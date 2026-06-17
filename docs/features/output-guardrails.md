# Output Guardrails

## What it does

Filters model responses **after** generation. Applies PII redaction and keyword checks to the final output text. For streaming, buffers the complete response before emitting to the client.

Output guardrails run **after** the repair loop inside `createOutputGuardrailMiddleware`.

## How it works

`src/middleware/output-guardrails.ts` wraps `wrapGenerate` and `wrapStream`:

### Generate path

1. Delegate to repair middleware (`wrapGenerate`)
2. Apply `applyOutputGuardsToGenerateResult()` on the result content

### Stream path

1. Delegate to repair middleware (`wrapStream`)
2. Collect all stream chunks via `collectStreamParts()`
3. Join `text-delta` chunks into full text
4. Run `applyOutputTextGuards()` on the complete text
5. Re-emit stream with guarded text (single `text-delta` with full content)

Guard logic lives in `src/utils/output-guards.ts` — same PII and keyword guards as input, applied to output text.

## Why this approach

- Models can hallucinate or leak PII even when input was clean
- Post-generation filtering catches policy violations in responses
- Buffering streams ensures guards see complete text (trade-off: no incremental token delivery)

See [Trade-offs](../design/trade-offs.md#stream-repair-buffer-then-emit).

## Configuration

```ts
shield(model, {
  guardrails: {
    output: {
      pii: {
        enabled: true,
        action: 'redact', // 'block' | 'redact' | 'warn'
      },
      keywords: {
        enabled: true,
        deny: ['SECRET', 'INTERNAL'],
        action: 'block', // default for output keywords is 'warn' in balanced mode
      },
    },
  },
});
```

## Errors and edge cases

| Situation                 | Behavior                                |
| ------------------------- | --------------------------------------- |
| PII `action: 'block'`     | `ShieldBlockedError` on output          |
| Keyword `action: 'block'` | `ShieldBlockedError` on output          |
| `action: 'warn'`          | `guard.triggered` audit; text unchanged |
| `action: 'redact'`        | Sensitive spans replaced in output      |
| Empty stream              | Passes through unchanged                |

## Verification

| Test file                                         | What it proves                                    |
| ------------------------------------------------- | ------------------------------------------------- |
| `tests/unit/middleware/output-guardrails.test.ts` | PII redact in stream; keyword block; audit events |

See [Verification matrix](../testing/verification-matrix.md).

## Related docs

- [Input guardrails](./input-guardrails.md)
- [Structured output](./structured-output.md)
- [Request lifecycle](../architecture/request-lifecycle.md)
