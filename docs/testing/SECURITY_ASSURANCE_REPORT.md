# Security Assurance Report

**Status:** living document · **Last updated:** 2026-06-18 (shieldkit@0.2.0)  
**Methodology:** Tier A adversarial corpus (mock model) + Tier B contrast harness + optional Tier C Ollama red team

## Executive summary

**shieldkit** provides **heuristic guardrails** for the Vercel AI SDK — not a complete security product. This report documents what automated adversarial tests prove, known bypasses, and contrast evidence (with `shield()` vs without).

| Layer              | Command                    | Result                          |
| ------------------ | -------------------------- | ------------------------------- |
| Adversarial corpus | `npm run test:adversarial` | full fixture corpus, mock model |
| Contrast harness   | included in adversarial    | RAW vs SHIELDED + audit         |
| Live red team      | `npm run test:redteam`     | Ollama, optional                |
| CI gate            | `npm run ci`               | lint, types, all tests, audit   |
| Unit matrix        | `tests/unit/`              | see unit-coverage-audit.md      |

## Methodology

1. **Fixtures** in `tests/fixtures/adversarial/` (JSON) with per-mode expectations
2. **Unit + middleware** tests per category (injection, PII, keywords, repair, tools, budget, stream)
3. **Contrast harness** writes `test-results/contrast-report.json`; console lines with `TEST_VERBOSE=1` (or `CONTRAST_VERBOSE=1`)
4. **Ollama red team** compares strict shield vs raw model on all `expect_block` injection fixtures (7 prompts). Nightly CI uses `REDTEAM_STRICT=0` (advisory); local default is strict.

**Release baseline:** `shieldkit@0.2.0` (2026-06-18). Re-run assurance after changes to `src/guards/` or `src/middleware/`.

## Bypass registry (expected)

These corpus cases **do not** trigger pattern guards — documented honestly:

| ID      | Category  | Reason               |
| ------- | --------- | -------------------- |
| inj-012 | injection | Non-English phrasing |

**Fixed in 0.2.0:** `inj-010` (homoglyph) and `inj-011` (zero-width) — blocked via `normalizeGuardText()` before injection/keyword matching.

## Contrast highlights

Strict mode blocks canonical injection before the model runs; raw mock path always invokes the model.

Example console line:

```
[test:contrast] inj-001 | strict | RAW: ok (invoked) | SHIELD: blocked | audit: ... | Shield blocked the request; raw path reached the model.
```

Set `TEST_VERBOSE=1` during `npm run test:adversarial` for contrast and audit JSON.

## Findings

| ID    | Severity | Component          | Status                                                                                           |
| ----- | -------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| F-001 | Info     | Repair retry       | **Accepted** — retries call `model.doGenerate` bypassing input guards (see limitations)          |
| F-002 | Medium   | Injection patterns | **Partial** — homoglyph / zero-width mitigated in 0.2.0; multilingual bypass remains (`inj-012`) |
| F-003 | Info     | Stream block       | AI SDK may wrap `ShieldBlockedError` in `NoOutputGeneratedError` on stream path                  |

## Regression checklist

- [ ] `npm run test:adversarial` green
- [ ] `npm run ci` green
- [ ] [Verification matrix](./verification-matrix.md) updated
- [ ] Bypass registry reviewed when injection patterns change

## Related

- [Adversarial assurance plan](./adversarial-assurance-plan.md)
- [Limitations](../design/limitations.md)
- [SECURITY.md](https://github.com/sakurablush/shieldkit/blob/main/SECURITY.md)
