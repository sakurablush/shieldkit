---
name: ai-shield-local-testing
description: Runs and validates ai-shield tests locally — CPU CI suite, Ollama integration (OLLAMA_HOST, OLLAMA_MODEL), smoke examples, GPU warm-up, and troubleshooting. Use when testing ai-shield, setting up Ollama, running integration tests, validating without paid API keys, or debugging test timeouts.
disable-model-invocation: true
---

# ai-shield Local Testing

Human doc: `docs/testing/running-tests.md` · Skill index: `docs/contributing/cursor-skills.md`

## What gets tested

| Layer       | Command                                | Hardware     | Proves                                       |
| ----------- | -------------------------------------- | ------------ | -------------------------------------------- |
| CI gate     | `npm run ci`                           | CPU          | lint, types, **149 tests**, full-tree audit  |
| Build       | `npm run build`                        | CPU          | `dist/` compiles                             |
| Docs        | `npm run docs:build`                   | CPU          | VitePress links valid                        |
| Package     | `npm pack --dry-run`                   | CPU          | tarball = dist + README + LICENSE            |
| Integration | `npm run test:run` + Ollama            | GPU optional | live Ollama E2E (`tests/integration/`)       |
| Adversarial | `npm run test:adversarial`             | CPU          | fixture corpus + contrast harness            |
| Red team    | `npm run test:redteam`                 | GPU optional | live injection prompts                       |
| Assurance   | `npm run test:assurance`               | GPU optional | adversarial + red team                       |
| Smoke       | `npx tsx examples/agent-with-tools.ts` | GPU optional | tools + shield manual path                   |
| Full demo   | `npm run demo`                         | GPU optional | all features with audit logs (mock + Ollama) |

**Full local acceptance:** `npm run ci` green; `npm run test:adversarial` green; all tests in `npm run test:run` pass when Ollama is available (integration file skipped otherwise); `npm run test:assurance` optional.

## OLLAMA_MODEL — what it means

`OLLAMA_MODEL` is an **environment variable** — not a library setting. ai-shield does not read it.

Tests and examples pass it to the Ollama provider:

```ts
ollama(process.env.OLLAMA_MODEL ?? 'llama3.2');
```

| Variable       | Default                  | Purpose                                         |
| -------------- | ------------------------ | ----------------------------------------------- |
| `OLLAMA_HOST`  | `http://127.0.0.1:11434` | Ollama HTTP API base URL                        |
| `OLLAMA_MODEL` | `llama3.2`               | Model tag for `ollama()` — must be pulled first |

After `ollama pull llama3.2`, both `llama3.2` and `llama3.2:latest` work.

| Model         | VRAM    | Use               |
| ------------- | ------- | ----------------- |
| `llama3.2`    | ~2–3 GB | Default           |
| `llama3.2:1b` | ~1 GB   | Faster cold start |
| `phi3:mini`   | ~2 GB   | Alternative       |

## CPU-only suite (no Ollama)

```bash
npm ci && npm run ci && npm run build && npm run docs:build && npm pack --dry-run
```

**Expected:** all tests pass; zero production dependency audit findings. Ollama integration tests run when Ollama is reachable; otherwise that file is skipped (not a failure).

## Ollama setup

1. Install: [ollama.com/download](https://ollama.com/download) or platform guide below
2. Pull: `ollama pull llama3.2`
3. Verify: `ollama list` and `curl http://127.0.0.1:11434/api/tags`

**Platform guides:** [Windows](ollama-windows.md) · [Linux](ollama-linux.md) · [macOS](ollama-macos.md)

## Integration tests (Ollama)

**Unix / macOS:**

```bash
export OLLAMA_HOST=http://127.0.0.1:11434
export OLLAMA_MODEL=llama3.2
npm run test:run
```

**Windows (PowerShell):**

```powershell
$env:PATH = "$env:LOCALAPPDATA\Programs\Ollama;" + $env:PATH
$env:OLLAMA_HOST = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "llama3.2"
npm run test:run
```

`tests/integration/ollama.test.ts` — entire file skipped if Ollama unreachable (not a failure).

| Test              | Timeout | Validates                     |
| ----------------- | ------- | ----------------------------- |
| generates text    | 60s     | `shield` + `generateText` E2E |
| streams text      | 60s     | `shield` + `streamText` E2E   |
| blocks injection  | 90s     | strict mode vs raw model      |
| structured output | 90s     | `Output.object` + repair      |

## Model warm-up (cold GPU)

First inference loads VRAM (1–3 min). Shorter-timeout integration cases may fail on a cold GPU.

**Preferred warm-up** (works in scripts; `ollama run` can hang interactively on Windows):

```bash
# Unix — curl
curl -s http://127.0.0.1:11434/api/generate -d '{"model":"llama3.2","prompt":"ping","stream":false}'
```

```powershell
# Windows — Invoke-RestMethod
$body = '{"model":"llama3.2","prompt":"ping","stream":false}'
Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method POST -Body $body -ContentType "application/json"
ollama ps   # expect 100% GPU when loaded
```

Then `npm run test:run` — typically completes in seconds.

Fallbacks: `llama3.2:1b`, or `OLLAMA_NUM_GPU=0` (CPU-only).

## Smoke examples

```bash
# Unix
OLLAMA_MODEL=llama3.2 npx tsx examples/agent-with-tools.ts
```

```powershell
# Windows
$env:OLLAMA_MODEL = "llama3.2"
npx tsx examples/agent-with-tools.ts
```

**Expected:** `getTime` tool called, audit events, exit 0, no `ShieldToolError`.

**Not runnable:** `examples/nextjs-api-route.ts` (copy-paste for Next.js).

## Troubleshooting

| Symptom                        | Fix                                                            |
| ------------------------------ | -------------------------------------------------------------- |
| Ollama integration skipped     | Start Ollama; verify `/api/tags`                               |
| Tests timeout at 60s           | Warm model via `/api/generate`; retry                          |
| `ollama run` hangs (Windows)   | Use `/api/generate` instead                                    |
| `ollama` not in PATH (Windows) | `$env:PATH = "$env:LOCALAPPDATA\Programs\Ollama;" + $env:PATH` |
| GPU OOM                        | `llama3.2:1b` or `OLLAMA_NUM_GPU=0`                            |

## Not tested locally (free)

Frontier APIs, GitHub Actions/CodeQL, coverage thresholds, serverless budgets — see `docs/testing/verification-matrix.md`.

## Verbose logging

```bash
TEST_VERBOSE=1 npm run test:run
```

Logs contrast, red team, and unit audit decisions. Silent by default in CI.

## Free validation checklist

```
- [ ] npm ci
- [ ] npm run ci (all tests pass; Ollama integration skipped OK when Ollama is off)
- [ ] npm run build
- [ ] npm run docs:build
- [ ] npm pack --dry-run
- [ ] Ollama + llama3.2 pulled
- [ ] npm run test:adversarial → contrast report in test-results/
- [ ] Optional: npm run test:redteam with Ollama
- [ ] npx tsx examples/agent-with-tools.ts
```

## Related

- [ollama-windows.md](ollama-windows.md) · [ollama-linux.md](ollama-linux.md) · [ollama-macos.md](ollama-macos.md)
- Attach `@ai-shield-contributing` for PR workflow
