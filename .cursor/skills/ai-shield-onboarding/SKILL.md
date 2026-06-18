---
name: ai-shield-onboarding
description: Orients new contributors and testers to the shieldkit repository — what the library does, repo layout, first commands, and which Cursor skill to attach next. Use when someone is new to shieldkit, asks what the project is, or needs a quick start before coding or testing.
disable-model-invocation: true
---

# shieldkit Onboarding

## What this project is

**shieldkit** is a Vercel AI SDK middleware library that adds:

- Input/output guardrails (injection, PII, keywords)
- Structured JSON output repair
- Session cost budgets and audit logging
- Tool call policies (`guardTools`)

Wrap any `LanguageModelV3` with `shield()` — works with Ollama, OpenAI, Anthropic, etc.

## Repo layout

```
src/           # Library source (published as dist/)
tests/         # Vitest — unit, adversarial, integration (Ollama optional)
examples/      # Runnable smoke scripts (Ollama)
docs/          # Markdown documentation
website/       # VitePress site
.cursor/skills/  # Cursor Agent Skills (see docs/contributing/cursor-skills.md)
.github/       # CI, CodeQL, Dependabot, docs deploy
```

## First 5 minutes

```bash
git clone https://github.com/sakurablush/shieldkit.git
cd shieldkit
npm ci
npm run ci        # all tests pass (Ollama integration skipped when unavailable)
npm run build
npm run demo      # optional — 9 sections, 31 PASS/FAIL checks (sections 1–8 mock-only)
```

## Choose your path

| Goal                   | Attach skill               | Human doc                             |
| ---------------------- | -------------------------- | ------------------------------------- |
| Change code, open PR   | `@ai-shield-contributing`  | `docs/contributing.md`                |
| Run all tests + Ollama | `@ai-shield-local-testing` | `docs/testing/running-tests.md`       |
| Edit documentation     | `@ai-shield-docs`          | `docs/contributing/cursor-skills.md`  |
| Understand the API     | —                          | `docs/getting-started.md`             |
| How we know it works   | —                          | `docs/testing/verification-matrix.md` |

Full skill index: `docs/contributing/cursor-skills.md`

## Minimal usage (Ollama)

```ts
import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { shield } from 'shieldkit';

const model = shield(ollama('llama3.2'), { mode: 'local' });

await generateText({
  model,
  prompt: 'Hello',
  providerOptions: { aiShield: { sessionId: 'demo' } },
});
```

`llama3.2` is the **Ollama model tag** — same value as the `OLLAMA_MODEL` env var in tests/examples.

## Key concepts

| Concept                    | Detail                                                                            |
| -------------------------- | --------------------------------------------------------------------------------- |
| `shield(model, config)`    | Wrapped model for `generateText` / `streamText`                                   |
| `mode`                     | `balanced`, `strict`, `cheap`, `local`, `custom`                                  |
| `providerOptions.aiShield` | Per-request `sessionId`, `userId`, `outputSchema`                                 |
| `guardTools`               | Allow/deny lists, max calls, approval gates                                       |
| Errors                     | `ShieldBlockedError`, `ShieldBudgetError`, `ShieldRepairError`, `ShieldToolError` |

## Peer dependencies

Consumers install: `shieldkit`, `ai` (≥6), `zod` (^3.25 or ^4). Ollama is optional (`ollama-ai-provider-v2`).
