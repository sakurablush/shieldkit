# Verification Matrix

This is the central **"how we know it works"** artifact. Each row maps a capability to the tests that prove it and the confidence level we assign.

## Test inventory

**As of shieldkit@0.2.0** (re-check with `npm run test:run` after adding tests).

| Metric              | Count                         | Notes                                                                                           |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| Test files          | **38**                        | Under `tests/unit/`, `tests/integration/`, `tests/adversarial/`                                 |
| Test cases          | **163**                       | All in the merge gate (`npm run ci`)                                                            |
| CI without Ollama   | **159 passed**, **4 skipped** | `tests/integration/ollama.test.ts` skips when Ollama is unreachable (typical on GitHub Actions) |
| CI with Ollama      | **163 passed**                | Run locally with Ollama up                                                                      |
| Red team (optional) | **8** in **2** files          | `npm run test:redteam` — not part of `npm run ci`                                               |

Vitest default config (`vitest.config.ts`) includes `tests/**/*.test.ts` and excludes `tests/redteam/`.

**Confidence levels:**

- **High** — Deterministic unit tests cover the behavior thoroughly
- **Medium** — Partial coverage, heuristics involved, or live-model variability
- **Low / None** — Not tested or only indirectly covered

## Feature coverage

| Capability                       | Unit test(s)                                      | Integration test(s)      | Confidence | What is proven                                      |
| -------------------------------- | ------------------------------------------------- | ------------------------ | ---------- | --------------------------------------------------- |
| Config mode presets              | `config.test.ts`                                  | —                        | High       | `balanced`, `strict`, custom merge                  |
| `shield()` wraps model           | `config.test.ts`                                  | `ollama.test.ts`         | High       | Model passthrough and generation                    |
| Injection detection (patterns)   | `guards.test.ts`, `utils/guard-normalize.test.ts` | —                        | High       | Patterns + homoglyph/ZW normalization               |
| Injection block (middleware)     | `input-guardrails.test.ts`                        | `ollama.test.ts`         | High       | Block throws `ShieldBlockedError`                   |
| Injection warn (no block)        | `input-warn.test.ts`                              | —                        | High       | Warn action allows request                          |
| PII redact (input)               | `guards.test.ts`, `input-guardrails.test.ts`      | —                        | Medium     | Email redaction; per-message-part redaction         |
| PII redact (output stream)       | `output-guardrails.test.ts`                       | —                        | Medium     | Streamed output redacted                            |
| Keyword block (output stream)    | `output-guardrails.test.ts`                       | —                        | High       | Forbidden keyword blocks stream                     |
| Output guard audit events        | `output-guardrails.test.ts`                       | —                        | High       | `guard.triggered` emitted on stream                 |
| Session budget enforce           | `cost-tracking.test.ts`                           | —                        | High       | `ShieldBudgetError` + `budgetExceeded` session flag |
| Stream cost pre-estimate         | `cost-tracking.test.ts`                           | —                        | High       | Budget checked before stream starts                 |
| Track-only mode                  | `cost-tracking.test.ts`                           | —                        | High       | No enforcement when `trackOnly: true`               |
| Audit lifecycle (generate)       | `audit-logging.test.ts`                           | —                        | High       | `request.start` → `request.complete` via sink       |
| JSON fence stripping             | `json-repair.test.ts`                             | —                        | High       | Markdown code fences removed                        |
| JSON trailing comma fix          | `json-repair.test.ts`                             | —                        | High       | Syntactic repair                                    |
| JSON unclosed object fix         | `json-repair.test.ts`                             | —                        | High       | Syntactic repair                                    |
| Zod schema validation            | `json-repair.test.ts`                             | —                        | High       | Valid/invalid schema reporting                      |
| Repair fixture corpus            | `json-repair.test.ts`                             | —                        | High       | ≥80% of fixtures parse after repair                 |
| Repair retry (middleware)        | `repair.test.ts`                                  | —                        | High       | Invalid JSON retried; valid output returned         |
| `includePartialInRetry: false`   | `repair.test.ts`                                  | —                        | High       | Retry prompt omits partial output                   |
| `shieldGenerateText` repair      | `shield-generate.test.ts`                         | —                        | High       | `NoObjectGeneratedError` recovery                   |
| `shieldGenerateText` retry loop  | `shield-generate.test.ts`                         | —                        | High       | Multiple attempts on validation failure             |
| `shieldGenerateText` exhausted   | `shield-generate.test.ts`                         | —                        | High       | `ShieldRepairError` when retries fail               |
| Token estimator (unknown model)  | `token-estimator.test.ts`                         | —                        | High       | Default chars/4 fallback                            |
| Token estimator (known model)    | `token-estimator.test.ts`                         | —                        | High       | Model-specific ratios                               |
| Token estimator (provider path)  | `token-estimator.test.ts`                         | —                        | High       | Short ID resolved from path                         |
| Tool deny list                   | `guard-tools.test.ts`                             | —                        | High       | Denied tool throws `ShieldToolError`                |
| Tool allow list                  | `guard-tools.test.ts`                             | —                        | High       | Non-allowed tool blocked                            |
| Tool max calls                   | `guard-tools.test.ts`                             | —                        | High       | Exceeding limit blocked                             |
| Tool require approval            | `guard-tools.test.ts`                             | —                        | High       | Blocked without approval context                    |
| Tool approval granted            | `guard-tools.test.ts`                             | —                        | High       | Executes with `experimental_context.approved`       |
| Tool audit correlation           | `guard-tools.test.ts`                             | —                        | High       | Shared `requestId` across tools                     |
| Tool record shape                | `guard-tools.test.ts`                             | —                        | High       | Keys preserved after wrapping                       |
| Live text generation             | —                                                 | `ollama.test.ts`         | Medium     | End-to-end with real model                          |
| Live streaming                   | —                                                 | `ollama.test.ts`         | Medium     | Stream produces text                                |
| Live injection block             | —                                                 | `ollama.test.ts`         | Medium     | Strict mode blocks; raw model does not              |
| Live structured output           | —                                                 | `ollama.test.ts`         | Medium     | Repair path with real model                         |
| Adversarial injection corpus     | `injection-corpus.test.ts`                        | —                        | High       | Pattern + middleware per fixture                    |
| Adversarial PII corpus           | `pii-corpus.test.ts`                              | —                        | High       | Input block/redact; output stream block             |
| Keyword middleware integration   | `keyword-corpus.test.ts`                          | —                        | High       | Deny list through input middleware                  |
| Repair adversarial + bypass      | `repair-adversarial.test.ts`                      | —                        | High       | Retry path; documents guard skip on retry           |
| Tool adversarial policies        | `tool-adversarial.test.ts`                        | —                        | High       | Deny, allow, max calls                              |
| Budget adversarial               | `budget-adversarial.test.ts`                      | —                        | High       | Enforce vs track-only                               |
| Stream adversarial               | `stream-adversarial.test.ts`                      | —                        | High       | PII redact; keyword block on stream                 |
| `shieldStreamText`               | `shield-stream-text.test.ts`                      | —                        | Medium     | Schema merge + stream                               |
| Utils (`usage`, `prompt`, etc.)  | `utils/*.test.ts`                                 | —                        | High       | Pure helpers + output guard primitives              |
| Context / session API            | `context.test.ts`                                 | —                        | High       | Session lifecycle and usage recording               |
| Error class shape                | `errors.test.ts`                                  | —                        | High       | All four `Shield*Error` properties                  |
| Cost `budget.warn`               | `cost-warn.test.ts`                               | —                        | High       | Warn audit before hard budget block                 |
| Audit stream lifecycle           | `audit-stream.test.ts`                            | —                        | High       | Stream start/complete + guard on block              |
| Output guards (generate path)    | `output-generate.test.ts`                         | —                        | High       | PII redact + keyword block on `generateText`        |
| Repair disabled                  | `repair-disabled.test.ts`                         | —                        | High       | No repair when `enabled: false`                     |
| Contrast harness (RAW vs shield) | `contrast.test.ts`                                | —                        | High       | Observable before/after + audit                     |
| Live red team (Ollama)           | —                                                 | `ollama-redteam.test.ts` | Medium     | Strict blocks 7 injection fixtures on live model    |

## Non-guarantees (explicit gaps)

| Capability                        | Status                | Notes                                                                 |
| --------------------------------- | --------------------- | --------------------------------------------------------------------- |
| Frontier API providers            | **Not tested in CI**  | OpenAI, Anthropic, Google require API keys (`RUN_FRONTIER_REDTEAM=1`) |
| `generateObject` / `streamObject` | **Not tested**        | Legacy API; README notes middleware still wraps                       |
| Code coverage threshold           | **Not configured**    | Vitest coverage not enforced                                          |
| Serverless multi-instance budgets | **Not tested**        | Architectural limitation documented                                   |
| ML-based injection detection      | **N/A**               | Not implemented                                                       |
| Homoglyph / zero-width injection  | **Blocked (0.2.0+)**  | `normalizeGuardText()` + `guard-normalize.test.ts`                    |
| Multilingual injection            | **Documented bypass** | `inj-012` — see SECURITY_ASSURANCE_REPORT.md                          |

## CI gate

All merges require `npm run ci` to pass:

```
lint:check → format:check → typecheck → test:run → npm audit
```

All dependencies audited at moderate+ severity (`npm audit --audit-level=moderate`).

This proves:

- No lint or format regressions
- TypeScript compiles
- All non-skipped tests pass
- No moderate+ vulnerabilities in the dependency tree (`npm audit --audit-level=moderate`, dev + prod)

CI also runs `npm run build`, `npm run docs:build`, and `npm pack --dry-run` (see `.github/workflows/ci.yml`).

**AI SDK compatibility** is verified separately: weekly and on dependency-related PRs via [AI SDK Compatibility](../contributing/ci-and-automation.md#ai-sdk-compatibility). Local check: `npm run check:ai-sdk`.

## Automation coverage

| Concern                   | Verified by                 | In merge gate?            |
| ------------------------- | --------------------------- | ------------------------- |
| Lint / format / types     | CI `npm run ci`             | Yes                       |
| Unit + adversarial tests  | CI `npm run ci`             | Yes                       |
| Ollama integration        | CI (skipped if Ollama off)  | Yes (non-blocking skip)   |
| `ai@latest` compatibility | AI SDK Compatibility matrix | On triggered PRs + weekly |
| Live injection red team   | Red Team workflow           | No (advisory)             |
| GitHub Release on tag     | Publish workflow            | N/A (release only)        |
| CodeQL                    | codeql.yml                  | Advisory                  |

See [CI and automation](../contributing/ci-and-automation.md).

## Test layers

| Layer         | Location                      | In `npm run ci`?            |
| ------------- | ----------------------------- | --------------------------- |
| Unit          | `tests/unit/`                 | Yes                         |
| Integration   | `tests/integration/`          | Yes (Ollama optional)       |
| Adversarial   | `tests/adversarial/`          | Yes                         |
| Red team      | `tests/redteam/`              | No (`npm run test:redteam`) |
| AI SDK latest | AI SDK Compatibility workflow | No (separate matrix)        |

See [Unit coverage audit](./unit-coverage-audit.md) for the full +/- matrix.

## Maintaining this matrix

When adding behavior:

1. Add or extend a test in `tests/`
2. Add a row to the feature coverage table above
3. If removing behavior, remove the row and delete obsolete tests

See [Contributing](../contributing.md).

## Related docs

- [Running tests](./running-tests.md)
- [Writing tests](./writing-tests.md)
- [Adversarial assurance plan](./adversarial-assurance-plan.md)
- [Security assurance report](./SECURITY_ASSURANCE_REPORT.md)
- [Unit coverage audit](./unit-coverage-audit.md)
- [CI and automation](../contributing/ci-and-automation.md)
- [Limitations](../design/limitations.md)
