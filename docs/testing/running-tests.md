# Running Tests

ai-shield uses [Vitest](https://vitest.dev/) for unit and integration tests.

## Commands

| Command            | Purpose                                                       |
| ------------------ | ------------------------------------------------------------- |
| `npm run test`     | Vitest watch mode (re-runs on file changes)                   |
| `npm run test:run` | Single run — used in CI                                       |
| `npm run ci`       | Full quality gate (lint, format, typecheck, test, prod audit) |

## CI pipeline

GitHub Actions workflow `.github/workflows/ci.yml` runs on push/PR to `main`/`master`:

1. Node 22
2. `npm ci`
3. `npm run ci`
4. `npm run build`
5. `npm run docs:build`

The quality gate must pass with **zero errors and zero warnings**.

## Test layout

```
tests/
├── helpers/
│   └── mock-model.ts       # Deterministic LanguageModelV3 mock
├── unit/
│   ├── config.test.ts
│   ├── guards.test.ts
│   ├── json-repair.test.ts
│   ├── shield-generate.test.ts
│   ├── token-estimator.test.ts
│   ├── middleware/
│   │   ├── audit-logging.test.ts
│   │   ├── cost-tracking.test.ts
│   │   ├── input-guardrails.test.ts
│   │   ├── input-warn.test.ts
│   │   ├── output-guardrails.test.ts
│   │   └── repair.test.ts
│   └── tools/
│       └── guard-tools.test.ts
└── integration/
    └── ollama.test.ts      # Live Ollama tests (conditional)
```

Vitest config (`vitest.config.ts`):

- Environment: Node
- Pattern: `tests/**/*.test.ts`
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

## What CI does not test

- Frontier APIs (OpenAI, Anthropic, Google) — no API keys in CI
- `shieldStreamText` — no dedicated test file
- Code coverage thresholds — not configured in Vitest

CI **does** run `npm run build` and `npm run docs:build` on every push and PR.

## Troubleshooting

| Issue                     | Solution                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------- |
| Integration tests skipped | Start Ollama and verify `curl $OLLAMA_HOST/api/tags`                                    |
| Test timeout              | Increase per-test timeout or check Ollama model load time                               |
| `npm audit` fails CI      | Production audit uses `--omit=dev`; update prod deps or check dev-only vulns separately |
| ESLint warnings fail CI   | `lint:check` uses `--max-warnings 0`                                                    |

## Related docs

- [Writing tests](./writing-tests.md)
- [Verification matrix](./verification-matrix.md)
- [Contributing](/contributing)
