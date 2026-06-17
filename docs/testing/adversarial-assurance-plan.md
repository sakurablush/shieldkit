# Adversarial Assurance Plan

**Status:** implemented (MVP corpus) · **Last updated:** 2026-06-17

Hardcore adversarial tests with a **contrast harness** (with `shield()` vs without), optional Ollama red team, runtime logging, and a living [Security assurance report](./SECURITY_ASSURANCE_REPORT.md).

## Scope (MVP)

This release ships a **focused corpus** (~46 adversarial cases in CI), not the full 150+ fixture ambition. The structure supports growth: add rows to `tests/fixtures/adversarial/*.json`, extend tests, update the bypass registry.

| Category  | Fixtures file    | Cases (approx.)              |
| --------- | ---------------- | ---------------------------- |
| Injection | `injection.json` | 12 (+ 3 documented bypasses) |
| PII       | `pii.json`       | 6                            |
| Keywords  | `keywords.json`  | 4                            |
| Repair    | `repair.json`    | 4                            |
| Tools     | `tools.json`     | 6                            |
| Budget    | `budget.json`    | 4                            |
| Stream    | inline tests     | 2                            |
| Contrast  | canonical subset | 9                            |
| Integrity | loader smoke     | 1                            |

## Four tiers

| Tier           | Location                                             | CI merge gate?                    | Purpose                 |
| -------------- | ---------------------------------------------------- | --------------------------------- | ----------------------- |
| **A** Corpus   | `tests/adversarial/` + `tests/fixtures/adversarial/` | **Yes** (`npm run test:run`)      | Fixtures on mock model  |
| **B** Contrast | `tests/helpers/contrast-harness.ts`                  | **Yes**                           | RAW vs SHIELDED + audit |
| **C** Red team | `tests/redteam/ollama-redteam.test.ts`               | **No** (nightly workflow)         | Real Ollama model       |
| **D** Frontier | `tests/redteam/frontier.smoke.test.ts`               | **No** (`RUN_FRONTIER_REDTEAM=1`) | Provider spot-checks    |

**Merge policy:** only `npm run ci` blocks PRs. Red team runs nightly via `.github/workflows/redteam.yml` with `continue-on-error: true` and `REDTEAM_STRICT=0` (advisory metrics, not a hard gate).

## Commands

| Command                    | Runs                      |
| -------------------------- | ------------------------- |
| `npm run test:adversarial` | Tier A + B                |
| `npm run test:redteam`     | Tier C (+ D when env set) |
| `npm run test:assurance`   | A + B + C sequentially    |

Environment:

| Variable                       | Default           | Purpose                                    |
| ------------------------------ | ----------------- | ------------------------------------------ |
| `CONTRAST_VERBOSE`             | off               | Full contrast JSON in console              |
| `REDTEAM_STRICT`               | `1` (strict)      | Set `0` for advisory red team (nightly CI) |
| `RUN_FRONTIER_REDTEAM`         | off               | Enable frontier smoke test                 |
| `OLLAMA_HOST` / `OLLAMA_MODEL` | see running-tests | Live model for Tier C                      |

Reports (gitignored): `test-results/contrast-report.json`, `test-results/adversarial-summary.json`.

## Related

- [Verification matrix](./verification-matrix.md)
- [Running tests](./running-tests.md)
- [Security assurance report](./SECURITY_ASSURANCE_REPORT.md)
