# Unit Coverage Audit

**Status:** complete · **Last updated:** 2026-06-18 (shieldkit@0.2.0)  
**Policy:** every implemented runtime capability in `src/` has **positive (+)** and **negative (−)** unit tests in `tests/unit/`. Adversarial/integration layers add breadth; they do not replace this matrix.

## Sign-off checklist

- [x] All public exports from `src/index.ts` covered
- [x] All `src/utils/*` modules have dedicated unit tests
- [x] Middleware paths: input, output (generate + stream), cost, audit, repair
- [x] Guards: injection, PII, keywords — block/warn/redact + benign
- [x] `TEST_VERBOSE=1` logs audit/guard/contrast decisions (default: silent CI)

## Public API

| Module / API                                       | Positive (+)                           | Negative (−)                               | Unit test file                              | Status  |
| -------------------------------------------------- | -------------------------------------- | ------------------------------------------ | ------------------------------------------- | ------- |
| `shield()`                                         | passthrough generation                 | strict injection block                     | `config.test.ts`                            | covered |
| `resolveConfig` balanced/strict/cheap/local/custom | preset values                          | —                                          | `config.test.ts`                            | covered |
| `shieldGenerateText`                               | valid output, repair success           | repair exhausted, non-repair error rethrow | `shield-generate.test.ts`                   | covered |
| `shieldStreamText`                                 | schema merge + stream, homoglyph block | strict injection block on stream           | `shield-stream-text.test.ts`                | covered |
| `guardTools`                                       | allow, approval, audit                 | deny, max calls, require approval          | `guard-tools.test.ts`                       | covered |
| `createShieldContext` / `getOrCreateSession`       | create + reuse                         | —                                          | `context.test.ts`                           | covered |
| `resetSession`                                     | clears session                         | —                                          | `context.test.ts`, `cost-tracking.test.ts`  | covered |
| `recordSessionUsage`                               | increments totals                      | —                                          | `context.test.ts`                           | covered |
| `createRequestContext`                             | defaults + overrides                   | —                                          | `context.test.ts`                           | covered |
| `ShieldBlockedError`                               | properties                             | —                                          | `errors.test.ts`                            | covered |
| `ShieldBudgetError`                                | properties                             | —                                          | `errors.test.ts`, `cost-tracking.test.ts`   | covered |
| `ShieldRepairError`                                | properties                             | —                                          | `errors.test.ts`, `shield-generate.test.ts` | covered |
| `ShieldToolError`                                  | properties                             | —                                          | `errors.test.ts`, `guard-tools.test.ts`     | covered |

## Guards

| Module                          | Positive (+)            | Negative (−)              | Unit test file   | Status  |
| ------------------------------- | ----------------------- | ------------------------- | ---------------- | ------- |
| `injectionGuard`                | detect injection        | benign text               | `guards.test.ts` | covered |
| `injectionGuard` warn           | triggered + warn action | —                         | `guards.test.ts` | covered |
| `piiGuard` email/phone/ssn/card | redact                  | invalid Luhn card ignored | `guards.test.ts` | covered |
| `piiGuard` block                | triggered               | —                         | `guards.test.ts` | covered |
| `keywordGuard`                  | deny match              | no match / boundary       | `guards.test.ts` | covered |

## Middleware

| Module                      | Positive (+)               | Negative (−)               | Unit test file                                  | Status  |
| --------------------------- | -------------------------- | -------------------------- | ----------------------------------------------- | ------- |
| Input injection             | —                          | strict block               | `input-guardrails.test.ts`                      | covered |
| Input injection warn        | allows request             | —                          | `input-warn.test.ts`                            | covered |
| Input PII                   | redact string + multi-part | —                          | `input-guardrails.test.ts`                      | covered |
| Output stream PII/keyword   | redact                     | block                      | `output-guardrails.test.ts`                     | covered |
| Output generate PII/keyword | redact                     | block                      | `output-generate.test.ts`                       | covered |
| Cost enforce                | records usage              | `ShieldBudgetError`        | `cost-tracking.test.ts`                         | covered |
| Cost track-only             | multiple calls OK          | —                          | `cost-tracking.test.ts`                         | covered |
| Cost stream pre-estimate    | —                          | budget block before stream | `cost-tracking.test.ts`                         | covered |
| Cost `budget.warn`          | audit at warnAtPercent     | —                          | `cost-warn.test.ts`                             | covered |
| Audit generate lifecycle    | start + complete           | blocked on injection       | `audit-logging.test.ts`, `audit-stream.test.ts` | covered |
| Audit stream lifecycle      | start + complete           | guard.triggered on block   | `audit-stream.test.ts`                          | covered |
| Repair retry                | valid JSON after retry     | —                          | `repair.test.ts`                                | covered |
| Repair feedback             | with/without partial       | —                          | `repair.test.ts`                                | covered |
| Repair disabled             | returns raw output         | —                          | `repair-disabled.test.ts`                       | covered |

## Utils

| Module                | Positive (+)                                | Negative (−)                  | Unit test file                   | Status  |
| --------------------- | ------------------------------------------- | ----------------------------- | -------------------------------- | ------- |
| `usage.ts`            | merge, counts, normalize                    | empty usage                   | `utils/usage.test.ts`            | covered |
| `prompt.ts`           | extract, merge, redact, transform           | invalid provider options      | `utils/prompt.test.ts`           | covered |
| `deep-merge.ts`       | nested merge                                | undefined skip, array replace | `utils/deep-merge.test.ts`       | covered |
| `output-guards.ts`    | generate redact                             | keyword block                 | `utils/output-guards.test.ts`    | covered |
| `audit.ts`            | console basic/detailed                      | disabled, sink swallow        | `utils/audit.test.ts`            | covered |
| `stream-collector.ts` | collect text + usage                        | —                             | `utils/stream-collector.test.ts` | covered |
| `guard-normalize.ts`  | homoglyph + zero-width fold, inj-009 benign | —                             | `utils/guard-normalize.test.ts`  | covered |
| `token-estimator.ts`  | known/unknown models                        | zero cost/text                | `token-estimator.test.ts`        | covered |
| `json-repair.ts`      | repair + validate                           | invalid schema                | `json-repair.test.ts`            | covered |

## Release tooling

| Script / workflow                         | Positive (+)                | Negative (−)              | Unit test file                              | Status  |
| ----------------------------------------- | --------------------------- | ------------------------- | ------------------------------------------- | ------- |
| `extract-changelog-section.mjs` + publish | section extract, `v` prefix | missing / invalid version | `scripts/extract-changelog-section.test.ts` | covered |

## Explicit non-goals (no unit tests required)

| Capability                        | Notes                               |
| --------------------------------- | ----------------------------------- |
| Frontier API providers            | `RUN_FRONTIER_REDTEAM=1` smoke only |
| `generateObject` / `streamObject` | Legacy API; documented gap          |
| Multi-instance serverless budgets | Architectural limitation            |
| ML-based injection                | Not implemented                     |

## Verbose test logging

```bash
TEST_VERBOSE=1 npm run test:run
```

Logs `[test:contrast]`, `[test:redteam]`, and `[test:<scope>]` lines. `CONTRAST_VERBOSE=1` is an alias. Default CI runs are silent.

## Related

- [Verification matrix](./verification-matrix.md)
- [Writing tests](./writing-tests.md)
- [Running tests](./running-tests.md)
