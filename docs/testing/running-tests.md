# Running Tests

shieldkit uses [Vitest](https://vitest.dev/) for unit and integration tests.

## Test inventory

| Command                | Test files | Test cases | In merge gate?                  |
| ---------------------- | ---------- | ---------- | ------------------------------- |
| `npm run test:run`     | 38         | 163        | Yes (`npm run ci`)              |
| `npm run test:redteam` | 2          | 8          | No (nightly workflow, advisory) |

On GitHub Actions (no Ollama), `test:run` reports **159 passed** and **4 skipped** — the Ollama integration file. Locally with Ollama running, all **163** run.

Details: [Verification matrix](./verification-matrix.md#test-inventory).

## CI pipeline

GitHub Actions runs on every push and PR to `main` / `master`. Full reference: **[CI and automation](../contributing/ci-and-automation.md)**.

### Merge gate (`ci.yml`)

| Step         | Command                                                       |
| ------------ | ------------------------------------------------------------- |
| Quality gate | `npm run ci` (lint, format, typecheck, test, full-tree audit) |
| Library      | `npm run build`                                               |
| Docs         | `npm run docs:build`                                          |
| Package      | `npm pack --dry-run`                                          |

Node **22**. Must pass with **zero errors and zero warnings**.

### Other workflows

| Workflow                                                                          | Blocks merge?        | Purpose                        |
| --------------------------------------------------------------------------------- | -------------------- | ------------------------------ |
| [AI SDK Compatibility](../contributing/ci-and-automation.md#ai-sdk-compatibility) | When triggered on PR | `ai` lockfile vs latest matrix |
| [Red Team](../contributing/ci-and-automation.md#red-team-advisory)                | No                   | Nightly Ollama injection tests |
| [Docs](../contributing/ci-and-automation.md#docs-deployment)                      | When docs change     | VitePress / GitHub Pages       |
| [CodeQL](../contributing/ci-and-automation.md#codeql)                             | Advisory             | Static security analysis       |

**Vercel AI SDK updates:** [Dependency policy](../contributing/dependency-policy.md) · `npm run check:ai-sdk`

## Commands

| Command                        | Purpose                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| `npm run test`                 | Vitest watch mode (re-runs on file changes)                        |
| `npm run test:run`             | Single run — used in CI (unit + integration + adversarial)         |
| `npm run test:adversarial`     | Adversarial corpus + contrast harness (mock model)                 |
| `npm run test:redteam`         | Ollama live red team (skipped if Ollama off)                       |
| `npm run test:assurance`       | Adversarial + red team combined                                    |
| `npm run demo`                 | Full 9-section feature tour (mock + optional Ollama)               |
| `npm run ci`                   | Full quality gate (lint, format, typecheck, test, full-tree audit) |
| `npm run check:ai-sdk`         | Compare lockfile `ai` pin vs npm latest                            |
| `npm run verify:ai-sdk-latest` | Typecheck + test + build on `ai@latest` (run `npm ci` after)       |

## Test layout

```
tests/
├── helpers/
│   ├── mock-model.ts
│   ├── contrast-harness.ts
│   └── load-adversarial-fixtures.ts
├── unit/
│   ├── …
│   └── tools/guard-tools.test.ts
├── integration/
│   └── ollama.test.ts          # Live Ollama (conditional)
├── adversarial/                # Corpus + contrast (always in CI)
│   ├── injection-corpus.test.ts
│   ├── contrast.test.ts
│   └── …
├── redteam/                    # Excluded from test:run — use test:redteam
│   └── ollama-redteam.test.ts
└── fixtures/
    └── adversarial/            # JSON fixture corpus
```

Vitest config (`vitest.config.ts`):

- Environment: Node
- Pattern: `tests/**/*.test.ts` (excludes `tests/redteam/` — use `npm run test:redteam`)
- Timeout: 60 seconds (integration tests may need up to 90s per test)

## Ollama integration tests

`tests/integration/ollama.test.ts` checks Ollama availability at load time:

```ts
const ollamaAvailable = await isOllamaAvailable();
describe.skipIf(!ollamaAvailable)('ollama integration', () => { ... });
```

If Ollama is not running, all four integration tests are **skipped** (not failed).

### Running integration tests locally

1. Install and start [Ollama](https://ollama.com/)
2. Pull a model: `ollama pull llama3.2`
3. Run tests:

```bash
OLLAMA_HOST=http://127.0.0.1:11434 OLLAMA_MODEL=llama3.2 npm run test:run
```

| Variable       | Default                  | Purpose                          |
| -------------- | ------------------------ | -------------------------------- |
| `OLLAMA_HOST`  | `http://127.0.0.1:11434` | Ollama API base URL              |
| `OLLAMA_MODEL` | `llama3.2`               | Model name for integration tests |

### What integration tests cover

- Text generation through `shield()`
- Streaming through `shield()`
- Injection blocking (strict mode) vs raw model passthrough
- Structured output with repair enabled

## Adversarial assurance

```bash
npm run test:adversarial   # corpus + contrast logging
CONTRAST_VERBOSE=1 npm run test:adversarial   # full audit JSON
npm run test:redteam       # Ollama red team (optional; 7 strict-block prompts)
npm run test:assurance     # adversarial then red team
```

Reports written to `test-results/` (gitignored): `contrast-report.json`, `adversarial-summary.json`.

### Red team vs merge gate

Red team is **not** part of `npm run ci`. Nightly workflow `.github/workflows/redteam.yml` runs with `continue-on-error: true` and `REDTEAM_STRICT=0` so flaky live-model results do not block merges. Locally, use default strict mode (`REDTEAM_STRICT=1`) to hard-fail on unblockable prompts.

See [Adversarial assurance plan](./adversarial-assurance-plan.md) and [Security assurance report](./SECURITY_ASSURANCE_REPORT.md).

### Environment variables

| Variable               | Default                  | Purpose                                     |
| ---------------------- | ------------------------ | ------------------------------------------- |
| `TEST_VERBOSE`         | off                      | Log audit/guard/contrast decisions in tests |
| `CONTRAST_VERBOSE`     | off                      | Alias for `TEST_VERBOSE` in contrast suite  |
| `OLLAMA_HOST`          | `http://127.0.0.1:11434` | Ollama API base URL                         |
| `OLLAMA_MODEL`         | `llama3.2`               | Model tag for integration/red team          |
| `REDTEAM_STRICT`       | `1`                      | Set `0` for advisory red team (nightly CI)  |
| `RUN_FRONTIER_REDTEAM` | off                      | Enable frontier smoke test                  |

## What CI does not test

- Frontier APIs (OpenAI, Anthropic, Google) — no API keys in CI (use `RUN_FRONTIER_REDTEAM=1` locally)
- Code coverage thresholds — not configured in Vitest

CI **does** run `npm run build` and `npm run docs:build` on every push and PR.

## Troubleshooting

| Issue                     | Solution                                                                          |
| ------------------------- | --------------------------------------------------------------------------------- |
| Integration tests skipped | Start Ollama and verify `curl $OLLAMA_HOST/api/tags`                              |
| Test timeout              | Increase per-test timeout or check Ollama model load time                         |
| `npm audit` fails CI      | Run `npm audit`; fix or override transitive deps (see `package.json` `overrides`) |
| ESLint warnings fail CI   | `lint:check` uses `--max-warnings 0`                                              |

## Cursor Agent Skills

For AI-assisted test runs in Cursor, attach `@ai-shield-local-testing` — includes Ollama setup per platform (`ollama-windows.md`, `ollama-linux.md`, `ollama-macos.md`), `OLLAMA_MODEL` explanation, GPU warm-up, and the free validation checklist. See [Cursor Agent Skills](../contributing/cursor-skills.md).

For adversarial / red-team work, see the [Adversarial assurance plan](./adversarial-assurance-plan.md).

## Related docs

- [Writing tests](./writing-tests.md)
- [Verification matrix](./verification-matrix.md)
- [Unit coverage audit](./unit-coverage-audit.md)
- [CI and automation](../contributing/ci-and-automation.md)
- [Dependency policy](../contributing/dependency-policy.md)
- [Contributing](/contributing)
