# Input Guardrails

## What it does

Runs safety checks on the user prompt **before** the model is called. Can block the request, redact sensitive content, or warn without blocking.

Three guard types:

| Guard     | Detects                                                                   |
| --------- | ------------------------------------------------------------------------- |
| Injection | Prompt injection patterns (ignore instructions, jailbreak, role override) |
| PII       | Email, phone, SSN, credit card numbers                                    |
| Keywords  | User-defined deny list terms                                              |

## How it works

Implemented in `src/middleware/input-guardrails.ts` using the AI SDK `transformParams` hook.

1. Extract prompt text via `extractPromptText()`
2. Run enabled guards in order: injection → PII → keywords
3. For each triggered guard, emit `guard.triggered` audit event
4. If action is `block`, emit `request.blocked` and throw `ShieldBlockedError`
5. If PII action is `redact`, replace matches in the prompt via `redactPromptPii()`
6. Return modified params (or original if unchanged)

### Injection scoring

`src/guards/injection.ts` uses weighted regex patterns. Scores accumulate; when total ≥ threshold, the guard triggers.

Example patterns (weight):

- `ignore previous instructions` (1.0)
- `disregard system instructions` (1.0)
- `you are now a/an/the` (0.8)
- `jailbreak` / `DAN mode` (0.9)

### PII detection

`src/guards/pii.ts` applies regex patterns. Credit cards require Luhn validation to reduce false positives.

Redacted text uses placeholders: `[REDACTED_PII:email]`, `[REDACTED_PII:phone]`, etc.

### Keyword matching

`src/guards/keywords.ts` uses word-boundary regex (`\bkeyword\b`) case-insensitively.

## Why this approach

- **Pre-call enforcement** prevents spending tokens on malicious or policy-violating prompts
- **Regex-based** guards are fast, deterministic, and testable without external services
- **`transformParams`** is the correct AI SDK hook — runs once before generate/stream

## Configuration

```ts
shield(model, {
  guardrails: {
    input: {
      injection: {
        enabled: true,
        action: 'block', // 'block' | 'redact' | 'warn'
        threshold: 0.5, // cumulative score threshold
      },
      pii: {
        enabled: true,
        action: 'redact', // 'block' | 'redact' | 'warn'
      },
      keywords: {
        enabled: true,
        deny: ['confidential', 'internal-only'],
        action: 'block',
      },
    },
  },
});
```

Mode presets set defaults — see [Configuration](../architecture/configuration.md).

## Errors and edge cases

| Situation                            | Behavior                                        |
| ------------------------------------ | ----------------------------------------------- |
| `action: 'block'` and guard triggers | `ShieldBlockedError` with `guard` and `summary` |
| `action: 'warn'`                     | Audit event only; request proceeds              |
| `action: 'redact'` (PII)             | Prompt modified; model sees redacted text       |
| Keywords `deny: []`                  | Guard skipped even if enabled                   |
| Multi-part prompts                   | PII redaction runs per message part             |

**Note:** Repair retry prompts bypass input guards on subsequent attempts. See [Structured output](./structured-output.md).

## Verification

| Test file                                        | What it proves                                               |
| ------------------------------------------------ | ------------------------------------------------------------ |
| `tests/unit/guards.test.ts`                      | Injection pattern detection; PII redaction; keyword matching |
| `tests/unit/middleware/input-guardrails.test.ts` | Block injection; redact PII in prompt and per-part           |
| `tests/unit/middleware/input-warn.test.ts`       | Warn action allows request                                   |
| `tests/integration/ollama.test.ts`               | Live injection block in strict mode                          |

See [Verification matrix](../testing/verification-matrix.md).

## Related docs

- [Output guardrails](./output-guardrails.md)
- [Request lifecycle](../architecture/request-lifecycle.md)
- [Limitations](../design/limitations.md)
