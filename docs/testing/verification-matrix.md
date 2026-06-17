# Verification Matrix

This is the central **"how we know it works"** artifact. Each row maps a capability to the tests that prove it and the confidence level we assign.

**Confidence levels:**

- **High** — Deterministic unit tests cover the behavior thoroughly
- **Medium** — Partial coverage, heuristics involved, or live-model variability
- **Low / None** — Not tested or only indirectly covered

## Feature coverage

| Capability                      | Unit test(s)                                 | Integration test(s) | Confidence | What is proven                                |
| ------------------------------- | -------------------------------------------- | ------------------- | ---------- | --------------------------------------------- |
| Config mode presets             | `config.test.ts`                             | —                   | High       | `balanced`, `strict`, custom merge            |
| `shield()` wraps model          | `config.test.ts`                             | `ollama.test.ts`    | High       | Model passthrough and generation              |
| Injection detection (patterns)  | `guards.test.ts`                             | —                   | High       | Known patterns trigger; benign text passes    |
| Injection block (middleware)    | `input-guardrails.test.ts`                   | `ollama.test.ts`    | High       | Block throws `ShieldBlockedError`             |
| Injection warn (no block)       | `input-warn.test.ts`                         | —                   | High       | Warn action allows request                    |
| PII redact (input)              | `guards.test.ts`, `input-guardrails.test.ts` | —                   | Medium     | Email redaction; per-message-part redaction   |
| PII redact (output stream)      | `output-guardrails.test.ts`                  | —                   | Medium     | Streamed output redacted                      |
| Keyword block (output stream)   | `output-guardrails.test.ts`                  | —                   | High       | Forbidden keyword blocks stream               |
| Output guard audit events       | `output-guardrails.test.ts`                  | —                   | High       | `guard.triggered` emitted on stream           |
| Session budget enforce          | `cost-tracking.test.ts`                      | —                   | High       | `ShieldBudgetError` when over budget          |
| Stream cost pre-estimate        | `cost-tracking.test.ts`                      | —                   | High       | Budget checked before stream starts           |
| Track-only mode                 | `cost-tracking.test.ts`                      | —                   | High       | No enforcement when `trackOnly: true`         |
| Audit lifecycle (generate)      | `audit-logging.test.ts`                      | —                   | High       | `request.start` → `request.complete` via sink |
| JSON fence stripping            | `json-repair.test.ts`                        | —                   | High       | Markdown code fences removed                  |
| JSON trailing comma fix         | `json-repair.test.ts`                        | —                   | High       | Syntactic repair                              |
| JSON unclosed object fix        | `json-repair.test.ts`                        | —                   | High       | Syntactic repair                              |
| Zod schema validation           | `json-repair.test.ts`                        | —                   | High       | Valid/invalid schema reporting                |
| Repair fixture corpus           | `json-repair.test.ts`                        | —                   | High       | ≥80% of fixtures parse after repair           |
| Repair retry (middleware)       | `repair.test.ts`                             | —                   | High       | Invalid JSON retried; valid output returned   |
| `includePartialInRetry: false`  | `repair.test.ts`                             | —                   | High       | Retry prompt omits partial output             |
| `shieldGenerateText` repair     | `shield-generate.test.ts`                    | —                   | High       | `NoObjectGeneratedError` recovery             |
| `shieldGenerateText` retry loop | `shield-generate.test.ts`                    | —                   | High       | Multiple attempts on validation failure       |
| `shieldGenerateText` exhausted  | `shield-generate.test.ts`                    | —                   | High       | `ShieldRepairError` when retries fail         |
| Token estimator (unknown model) | `token-estimator.test.ts`                    | —                   | High       | Default chars/4 fallback                      |
| Token estimator (known model)   | `token-estimator.test.ts`                    | —                   | High       | Model-specific ratios                         |
| Token estimator (provider path) | `token-estimator.test.ts`                    | —                   | High       | Short ID resolved from path                   |
| Tool deny list                  | `guard-tools.test.ts`                        | —                   | High       | Denied tool throws `ShieldToolError`          |
| Tool allow list                 | `guard-tools.test.ts`                        | —                   | High       | Non-allowed tool blocked                      |
| Tool max calls                  | `guard-tools.test.ts`                        | —                   | High       | Exceeding limit blocked                       |
| Tool require approval           | `guard-tools.test.ts`                        | —                   | High       | Blocked without approval context              |
| Tool approval granted           | `guard-tools.test.ts`                        | —                   | High       | Executes with `experimental_context.approved` |
| Tool audit correlation          | `guard-tools.test.ts`                        | —                   | High       | Shared `requestId` across tools               |
| Tool record shape               | `guard-tools.test.ts`                        | —                   | High       | Keys preserved after wrapping                 |
| Live text generation            | —                                            | `ollama.test.ts`    | Medium     | End-to-end with real model                    |
| Live streaming                  | —                                            | `ollama.test.ts`    | Medium     | Stream produces text                          |
| Live injection block            | —                                            | `ollama.test.ts`    | Medium     | Strict mode blocks; raw model does not        |
| Live structured output          | —                                            | `ollama.test.ts`    | Medium     | Repair path with real model                   |

## Non-guarantees (explicit gaps)

| Capability                           | Status               | Notes                                                                      |
| ------------------------------------ | -------------------- | -------------------------------------------------------------------------- |
| `shieldStreamText`                   | **Not tested**       | Merges `outputSchema` into provider options; no dedicated test file        |
| Frontier API providers               | **Not tested in CI** | OpenAI, Anthropic, Google require API keys                                 |
| Input keyword deny list (middleware) | **Partial**          | `keywordGuard` unit logic exists; no dedicated middleware integration test |
| Output PII block action              | **Partial**          | Stream redact tested; block action not explicitly tested                   |
| `generateObject` / `streamObject`    | **Not tested**       | Legacy API; README notes middleware still wraps                            |
| Code coverage threshold              | **Not configured**   | Vitest coverage not enforced                                               |
| Serverless multi-instance budgets    | **Not tested**       | Architectural limitation documented                                        |
| ML-based injection detection         | **N/A**              | Not implemented                                                            |

## CI gate

All merges require `npm run ci` to pass:

```
lint:check → format:check → typecheck → test:run → npm audit --omit=dev
```

Production dependencies only (`--omit=dev` excludes VitePress/vite dev-only advisories).

This proves:

- No lint or format regressions
- TypeScript compiles
- All non-skipped tests pass
- No moderate+ vulnerabilities in production dependencies

CI also runs `npm run build` and `npm run docs:build` (see `.github/workflows/ci.yml`).

## Test count summary

| Category    | Files  | Test cases               |
| ----------- | ------ | ------------------------ |
| Unit        | 12     | 40                       |
| Integration | 1      | 4 (skipped if no Ollama) |
| **Total**   | **13** | **44**                   |

## Maintaining this matrix

When adding behavior:

1. Add or extend a test in `tests/`
2. Add a row to the feature coverage table above
3. If removing behavior, remove the row and delete obsolete tests

See [Contributing](../contributing.md).

## Related docs

- [Running tests](./running-tests.md)
- [Writing tests](./writing-tests.md)
- [Limitations](../design/limitations.md)
