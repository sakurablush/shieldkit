# Request Lifecycle

This document describes how a single request flows through ai-shield for the three main paths: synchronous generation, streaming, and structured output repair.

## Synchronous generation (`generateText`)

```mermaid
sequenceDiagram
    participant App
    participant Shield as shield model
    participant Input as Input Guardrails
    participant Cost as Cost Tracking
    participant Audit as Audit Logging
    participant Output as Output Guardrails
    participant Model as Base Model

    App->>Shield: generateText({ model, prompt, providerOptions })
    Shield->>Input: transformParams(prompt)
    Input->>Input: injection / PII / keyword checks
    alt blocked
        Input-->>App: ShieldBlockedError
    else redacted or passed
        Input->>Cost: wrapGenerate
        Cost->>Cost: pre-call budget check
        alt budget exceeded
            Cost-->>App: ShieldBudgetError
        end
        Cost->>Audit: request.start
        Audit->>Output: wrapGenerate
        Output->>Model: doGenerate (via repair fallback)
        Model-->>Output: content + usage
        Output->>Output: repair loop if JSON/schema
        Output->>Output: output PII/keyword guards
        Output-->>Audit: result
        Audit->>Audit: request.complete
        Audit->>Cost: result
        Cost->>Cost: record usage, budget warn
        Cost-->>App: result
    end
```

### Steps in detail

1. **Input phase** (`transformParams`): Extract prompt text, run guards. Block throws `ShieldBlockedError`. Redact modifies the prompt in place.
2. **Pre-call budget** (`wrapGenerate` in cost middleware): Estimate tokens from prompt, compute estimated cost, reject if session budget would be exceeded.
3. **Audit start**: Emit `request.start` with session/request IDs.
4. **Model call**: Output middleware delegates to repair middleware, which calls `doGenerate()` on the inner chain (first attempt).
5. **Repair** (if JSON/schema required): Validate output; retry with feedback prompt on failure (see [Repair retry path](#repair-retry-path)).
6. **Output guards**: Apply PII redaction and keyword checks to final text.
7. **Audit complete**: Emit `request.complete` with usage.
8. **Cost recording**: Update session store, emit `cost.recorded`, optionally `budget.warn`.

## Streaming (`streamText`)

Input guards still run via `transformParams` before the stream starts. The output path differs:

```mermaid
sequenceDiagram
    participant App
    participant Shield as shield model
    participant Repair as Repair Middleware
    participant Output as Output Guardrails
    participant Model as Base Model

    App->>Shield: streamText({ model, prompt })
    Note over Shield: Input guards + budget + audit.start
    Shield->>Repair: wrapStream
    Repair->>Model: doStream (or direct on retry)
    Model-->>Repair: stream chunks
    Repair->>Repair: collect full text
    Repair->>Repair: validate/repair JSON
    Repair-->>Output: re-emitted stream
    Output->>Output: collect stream, apply output guards
    Output-->>App: guarded stream
    Note over Shield: cost recorded on finish chunk
```

### Streaming implications

- **Latency**: The client does not receive tokens until the full stream is collected, repaired (if needed), and output-guarded. This trades real-time streaming for correctness.
- **Cost tracking**: Usage is recorded when the `finish` chunk is observed in the wrapped stream.
- **Audit**: `request.complete` fires after the stream is fully consumed.

## Structured output (`Output.object` + Zod)

When `responseFormat.type === 'json'` or `providerOptions.aiShield.outputSchema` is set, the repair loop activates:

1. First attempt goes through the full middleware chain (`fallback` → `doGenerate`).
2. Output is stripped of markdown fences, repaired syntactically, and validated against the Zod schema.
3. On failure, a user message is appended with validation feedback and optionally the previous invalid output.
4. Retries call `model.doGenerate()` **directly**, bypassing outer middleware.

See [Structured output](../features/structured-output.md) for configuration and security notes.

## Repair retry path

```mermaid
sequenceDiagram
    participant Output as Output Guardrails
    participant Repair as Repair Loop
    participant Chain as Middleware Chain
    participant Model as Base Model

    Output->>Repair: attempt 0
    Repair->>Chain: fallback (doGenerate)
    Chain->>Model: full middleware path
    Model-->>Repair: invalid JSON
    Repair->>Model: attempt 1+ direct doGenerate
    Note over Model: Skips input guards,<br/>audit start, pre-budget
    Model-->>Repair: response
    Repair->>Repair: validate again
    alt valid
        Repair-->>Output: repaired content
    else exhausted
        Repair-->>Output: ShieldRepairError
    end
```

### What retries skip

On repair attempts after the first:

- Input guardrails (injection, PII, keywords)
- Pre-call budget assertion
- Audit `request.start` for the retry call

### What retries preserve

- Token usage from all attempts is merged into the final result
- Audit events: `repair.attempt`, `repair.success`, or `repair.failed`
- Output guards still run on the final text

## Tool execution (parallel path)

Tool calls happen inside AI SDK's agent loop, outside the model middleware chain:

```mermaid
sequenceDiagram
    participant Agent as generateText agent loop
    participant Guard as guardTools wrapper
    participant Tool as Tool execute

    Agent->>Guard: tool.execute(input)
    Guard->>Guard: allow/deny/approval/maxCalls
    alt blocked
        Guard-->>Agent: ShieldToolError
    else allowed
        Guard->>Tool: execute
        Tool-->>Guard: result
        Guard-->>Agent: result
    end
```

Correlate tool audit events with model requests by passing the same `requestId` to both `providerOptions.aiShield` and `guardTools()`.

## Error propagation

| Error                | Thrown by           | When                                       |
| -------------------- | ------------------- | ------------------------------------------ |
| `ShieldBlockedError` | Input/output guards | Guard action is `block`                    |
| `ShieldBudgetError`  | Cost middleware     | Session budget exceeded (pre or post call) |
| `ShieldRepairError`  | Repair middleware   | All repair attempts exhausted              |
| `ShieldToolError`    | `guardTools`        | Tool policy violation                      |

Failed requests emit `request.blocked` audit events (from audit middleware or guard-specific paths).

## Related docs

- [Architecture overview](./overview.md)
- [Input guardrails](../features/input-guardrails.md)
- [Structured output](../features/structured-output.md)
- [Verification matrix](../testing/verification-matrix.md)
