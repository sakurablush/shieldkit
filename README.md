# shieldkit

[![npm version](https://img.shields.io/npm/v/shieldkit.svg)](https://www.npmjs.com/package/shieldkit)
[![npm provenance](https://img.shields.io/badge/provenance-SLSA-blue)](https://www.npmjs.com/package/shieldkit)

Production guardrails, structured output repair, and basic compliance for the [Vercel AI SDK](https://ai-sdk.dev/).

Published on npm as **`shieldkit`**. Source repository: [sakurablush/shieldkit](https://github.com/sakurablush/shieldkit). **Documentation:** [sakurablush.github.io/shieldkit](https://sakurablush.github.io/shieldkit).

Works with frontier models and local models (Ollama). Peer dependency: `ai >=6`, `zod`.

```bash
npm install shieldkit ai zod
```

**Try the full feature tour locally** (mock + optional Ollama):

```bash
git clone https://github.com/sakurablush/shieldkit.git && cd shieldkit && npm ci && npm run demo
```

## Documentation

**Browse online:** [sakurablush.github.io/shieldkit](https://sakurablush.github.io/shieldkit)

Source markdown lives in [`docs/`](docs/README.md):

- [Getting started](docs/getting-started.md) — install and first request
- [Architecture](docs/architecture/overview.md) — middleware chain and request lifecycle
- [Features](docs/features/input-guardrails.md) — guards, repair, cost, audit, tools
- [Design](docs/design/why-middleware.md) — rationale, trade-offs, limitations
- [Testing](docs/testing/running-tests.md) — how to run tests and [verification matrix](docs/testing/verification-matrix.md)
- [API reference](docs/api/reference.md) — public exports
- [Examples](docs/examples/index.md) — Next.js route and agent with tools

Browse locally: `npm run docs:dev` (VitePress). Deploy: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Security: [SECURITY.md](SECURITY.md). See [Contributing](docs/contributing.md).

**Automation:** [CI and automation](docs/contributing/ci-and-automation.md) · [Dependency policy](docs/contributing/dependency-policy.md) · `npm run check:ai-sdk`

**Cursor users:** project [Agent Skills](docs/contributing/cursor-skills.md) in `.cursor/skills/` guide the AI through development, testing, and docs — attach with `@ai-shield-contributing`, `@ai-shield-local-testing`, etc.

## Community

| Document                                 | Purpose                            |
| ---------------------------------------- | ---------------------------------- |
| [CONTRIBUTING.md](CONTRIBUTING.md)       | Development setup and PR checklist |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards                |
| [CONTRIBUTORS.md](CONTRIBUTORS.md)       | How contributors are recognized    |
| [CHANGELOG.md](CHANGELOG.md)             | Release history                    |
| [SECURITY.md](SECURITY.md)               | Vulnerability reporting            |

## Quick start

```ts
import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { shield } from 'shieldkit';

const model = shield(ollama('llama3.2'));

const { text } = await generateText({
  model,
  prompt: 'Say hello in one sentence.',
  providerOptions: {
    aiShield: { sessionId: 'demo-session' },
  },
});
```

## Modes

| Mode                 | Input guards                                                         | Output repair                           | Cost budget          | Audit              |
| -------------------- | -------------------------------------------------------------------- | --------------------------------------- | -------------------- | ------------------ |
| `balanced` (default) | injection block, PII redact                                          | 2 attempts                              | enforce, warn at 80% | basic              |
| `strict`             | injection block (strict), PII block; add keyword deny list to enable | 3 attempts, no partial in retry prompts | enforce $0.50        | detailed           |
| `cheap`              | injection warn only                                                  | 1 attempt                               | enforce $0.10        | basic, console off |
| `local`              | injection warn, PII redact                                           | 3 attempts                              | track only           | detailed           |

```ts
const model = shield(ollama('llama3.2'), { mode: 'local' });
```

### Serverless note

Session cost state is stored in an in-memory `Map` keyed by `providerOptions.aiShield.sessionId`. In serverless or multi-instance deployments, each instance tracks its own budget. Use a sticky session ID per user conversation, or treat budgets as best-effort until a pluggable store ships post-v1.

## Structured output (v7 API)

Use `generateText` with `Output.object()`. Pass a Zod schema via `providerOptions` for schema-aware repair:

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

const schema = z.object({ name: z.string(), age: z.number() });

const { output } = await generateText({
  model: shield(ollama('llama3.2'), { mode: 'local' }),
  output: Output.object({ schema }),
  prompt: 'Generate a user profile as JSON.',
  providerOptions: {
    aiShield: {
      sessionId: 'structured-demo',
      outputSchema: schema,
    },
  },
});
```

For extra retry handling at the call site, use `shieldGenerateText` (catches `NoObjectGeneratedError`).

### Repair retry behavior

When JSON validation fails, the repair loop may call the **base model directly** for retries (updated prompt). Those retries:

- Skip outer middleware (input guards, audit `request.start`, pre-call budget checks)
- Still merge token usage from all attempts into the final result
- May include the previous invalid output in the retry prompt (helps repair; can re-send sensitive text)

To omit previous output from retry prompts (safer when outputs may contain PII):

```ts
shield(model, {
  guardrails: {
    output: {
      repair: { includePartialInRetry: false },
    },
  },
});
```

## Streaming

Input guards run before streaming. Output repair runs **after the stream completes** (full text is collected, repaired, then re-emitted).

## Session budget and cost tracking

Pre-call token estimates use model-specific chars-per-token ratios for common models (GPT-4o, Claude, Gemini, Llama, etc.), falling back to chars/4.

```ts
import { createShieldContext, shield } from 'shieldkit';

createShieldContext('user-123');

const model = shield(ollama('llama3.2'), {
  cost: { maxCostPerSession: 0.5, trackOnly: false },
});
```

## Tool guards

```ts
import { guardTools, shield } from 'shieldkit';
import { tool } from 'ai';
import { z } from 'zod';

const tools = guardTools(
  {
    search: tool({
      description: 'Search the web',
      inputSchema: z.object({ q: z.string() }),
      execute: async ({ q }) => ({ results: [q] }),
    }),
  },
  {
    allow: ['search'],
    maxCallsPerRequest: 3,
    requireApproval: true,
    requestId: 'req-abc',
  },
);
```

Pass `requestId` (and optional `sessionId`) so tool audit events correlate with model `providerOptions.aiShield.requestId`. One `requestId` is shared for all tools wrapped in the same `guardTools()` call.

When `requireApproval` is enabled, pass `{ approved: true }` via `experimental_context` on the tool execute call (experimental hook for UI approval flows).

## Error types

- `ShieldBlockedError` — input/output guard blocked the request
- `ShieldBudgetError` — session cost budget exceeded
- `ShieldRepairError` — structured output repair exhausted retries
- `ShieldToolError` — tool policy violation

## Legacy `generateObject`

The middleware still wraps models used with deprecated `generateObject` / `streamObject`. For new code, prefer `generateText` + `Output.object()`.

## Development

```bash
npm run ci      # lint, format, typecheck, test, audit
npm run build   # tsup → dist/
```

Using [Cursor](https://cursor.com/)? See [Cursor Agent Skills](docs/contributing/cursor-skills.md) for attachable playbooks (`@ai-shield-onboarding`, `@ai-shield-contributing`, `@ai-shield-local-testing`, `@ai-shield-docs`).

Ollama integration tests skip automatically when Ollama is unavailable:

```bash
OLLAMA_HOST=http://127.0.0.1:11434 OLLAMA_MODEL=llama3.2 npm run test:run
```

## Sustain development (optional)

**shieldkit** is MIT-licensed and free on npm — no paywall, no paid tier, no feature lock.

Keeping it current still has a real cost: tracking [Vercel AI SDK](https://ai-sdk.dev/) releases, running adversarial and compatibility suites, live-model red-team checks, and maintaining docs and CI. That work runs on a self-funded stack (time, API inference, hardware).

Without offsetting support, development continues, but pace follows what fits around paid work and personal budget. Security hardening, new guardrails, and fast SDK compatibility updates are not sustainable at full speed on zero budget.

**Contribute in code** if that fits you: [Issues](https://github.com/sakurablush/shieldkit/issues), [Discussions](https://github.com/sakurablush/shieldkit/discussions), or a pull request per [CONTRIBUTING.md](CONTRIBUTING.md).

**Financial support** is optional — only if shieldkit saved you time or you want to help cover the next development cycle (research, inference, upkeep). No tiers, no perks, no obligation:

| Coin     | Address                                       |
| -------- | --------------------------------------------- |
| Bitcoin  | `bc1qcrj9wreunffxm75fcz0a2gjkw87jshcwvmxv68`  |
| Ethereum | `0x3A265D72AB43f9C55bD71E0FD5c1b3304601ce33`  |
| Litecoin | `ltc1q0nsarncmnz8vk34dav7l0vgu9m5k48drr8z6js` |
| Dogecoin | `D6YGoYWpFZxW8JXvEfT5iB9uNXcs8AeY7L`          |

## License

MIT
