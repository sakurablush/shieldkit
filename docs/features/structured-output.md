# Structured Output

## What it does

Repairs malformed JSON from model responses and validates against a Zod schema. Retries with feedback when validation fails.

Works with:

- `generateText` + `Output.object({ schema })` (AI SDK v7 API)
- `providerOptions.aiShield.outputSchema` for schema-aware repair
- `shieldGenerateText()` for additional call-site retry on `NoObjectGeneratedError`

## How it works

Repair is implemented in `src/middleware/repair.ts` inside the output guardrail middleware.

### Validation pipeline

`validateAndRepair(rawText, schema?)` in `src/utils/json-repair.ts`:

1. Strip markdown JSON fences (` ```json `)
2. Apply syntactic repair (`repairJson`) — trailing commas, unclosed braces
3. `JSON.parse` the candidate
4. If schema provided, `schema.safeParse(parsed)`
5. Return `{ valid, text, repaired, error? }`

### Retry loop

`executeRepairLoop()` runs `maxAttempts + 1` total tries:

| Attempt   | Model call                    | Middleware                                         |
| --------- | ----------------------------- | -------------------------------------------------- |
| 0 (first) | `fallback()` → `doGenerate()` | Full chain                                         |
| 1+        | `model.doGenerate()` directly | **Bypasses** input guards, audit start, pre-budget |

On failure, appends a user message via `buildRepairFeedback()`:

```
Your previous response was not valid JSON or did not match the required schema.
Validation error: ...
Return ONLY valid JSON with no markdown fences or commentary.
Previous output: ...   (optional, controlled by includePartialInRetry)
```

Token usage from all attempts is merged into the final result.

### When repair activates

Repair runs when either:

- `params.responseFormat?.type === 'json'`, or
- `providerOptions.aiShield.outputSchema` is set

If neither is set, the repair middleware passes through without validation.

### shieldGenerateText

`src/shield-generate.ts` adds a call-site layer:

1. Calls `generateText` normally
2. On `NoObjectGeneratedError`, attempts local `validateAndRepair`
3. If still invalid, retries `generateText` with repair feedback appended to prompt
4. Throws `ShieldRepairError` when exhausted

## Why this approach

- LLMs frequently wrap JSON in markdown fences or produce minor syntax errors
- Schema validation catches semantically wrong structures
- Direct model retries avoid re-running input guards on repair prompts (which contain prior output)
- Merged usage gives accurate billing across attempts

## Configuration

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

const schema = z.object({ name: z.string(), age: z.number() });

const { output } = await generateText({
  model: shield(baseModel, {
    guardrails: {
      output: {
        repair: {
          enabled: true,
          maxAttempts: 2,
          includePartialInRetry: false, // safer when output may contain PII
        },
      },
    },
  }),
  output: Output.object({ schema }),
  prompt: 'Generate a user profile as JSON.',
  providerOptions: {
    aiShield: {
      sessionId: 'structured-demo',
      outputSchema: schema,
    },
  },
});
```

### shieldStreamText

Merges `outputSchema` into `providerOptions.aiShield` before calling `streamText`. Repair still runs via middleware on the buffered stream.

## Errors and edge cases

| Situation                     | Error / behavior                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| All attempts fail             | `ShieldRepairError` with `partialText`, `attempts`, `lastError`, `usage`             |
| `repair.enabled: false`       | No validation; raw model output returned                                             |
| `includePartialInRetry: true` | Prior invalid output included in retry prompt (may re-send PII)                      |
| Streaming                     | Full stream collected before repair; see [Output guardrails](./output-guardrails.md) |

Audit events: `repair.attempt`, `repair.success`, `repair.failed`.

## Verification

| Test file                              | What it proves                                                 |
| -------------------------------------- | -------------------------------------------------------------- |
| `tests/unit/json-repair.test.ts`       | Fence stripping, syntax repair, Zod validation, fixture corpus |
| `tests/unit/middleware/repair.test.ts` | Retry loop, `includePartialInRetry: false`                     |
| `tests/unit/shield-generate.test.ts`   | `NoObjectGeneratedError` recovery, retry exhaustion            |
| `tests/integration/ollama.test.ts`     | Live structured output with repair                             |

**Gap:** `shieldStreamText` has no dedicated tests.

See [Verification matrix](../testing/verification-matrix.md).

## Related docs

- [Request lifecycle](../architecture/request-lifecycle.md#repair-retry-path)
- [Trade-offs](../design/trade-offs.md#repair-retry-bypasses-middleware)
- [API reference](../api/reference.md)
