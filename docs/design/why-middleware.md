# Why Middleware?

ai-shield is built on the Vercel AI SDK's `wrapLanguageModel` middleware API rather than as a standalone proxy or fork of the SDK.

## Design goals

1. **Composable** — Works with any `LanguageModelV3` provider (OpenAI, Anthropic, Google, Ollama, custom)
2. **Non-invasive** — Call sites keep using `generateText`, `streamText`, and `Output.object` unchanged
3. **Ordered concerns** — Each guardrail is an isolated middleware with a single responsibility
4. **AI SDK native** — Leverages `transformParams`, `wrapGenerate`, and `wrapStream` hooks the SDK already provides

## Why not a proxy server?

A separate guardrail proxy would require:

- Network hop latency on every request
- Duplicating AI SDK request/response serialization
- Maintaining compatibility with every AI SDK version and provider

Middleware runs in-process with zero additional infrastructure.

## Why not subclass/wrap at the call site?

Wrapping `generateText` alone would miss:

- Streaming paths (`streamText`)
- Structured output (`Output.object`)
- Future AI SDK APIs that accept a `LanguageModel`

Wrapping the model once covers all call patterns.

## Middleware ordering rationale

The chain in `src/shield.ts` is deliberate:

| Order | Middleware            | Reason                                              |
| ----- | --------------------- | --------------------------------------------------- |
| 1     | Input guardrails      | Block or redact before any cost is incurred         |
| 2     | Cost tracking         | Reject over-budget requests before model call       |
| 3     | Audit logging         | Record lifecycle around the actual model invocation |
| 4     | Output guardrails     | Repair and filter after model responds              |
| 5     | extractJsonMiddleware | AI SDK built-in JSON extraction last                |

Input guards use `transformParams` (runs before `wrapGenerate`), so they execute before cost and audit wrappers even though they appear first in the array.

## Why separate tool guards?

`guardTools()` wraps tool `execute()` functions rather than using model middleware because:

- Tools are invoked by the AI SDK agent loop, not by `doGenerate`
- Tool policies (allow lists, approval) are orthogonal to prompt/output guards
- Different correlation: one `guardTools()` call shares a `requestId` across all tools in that set

## Relationship to AI SDK versions

ai-shield targets AI SDK v5+ with `LanguageModelV3` middleware. Peer dependencies:

- `ai >= 5.0.0`
- `zod ^3.25.0 || ^4.0.0`

## Related docs

- [Architecture overview](../architecture/overview.md)
- [Trade-offs](./trade-offs.md)
- [Limitations](./limitations.md)
