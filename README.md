# ai-shield

Production guardrails, structured output repair, and basic compliance for the [Vercel AI SDK](https://ai-sdk.dev/).

Works with frontier models and local models (Ollama). Peer dependency: `ai >=5`, `zod`.

## Quick start

```ts
import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { shield } from 'ai-shield';

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
import { createShieldContext, shield } from 'ai-shield';

createShieldContext('user-123');

const model = shield(ollama('llama3.2'), {
  cost: { maxCostPerSession: 0.5, trackOnly: false },
});
```

## Tool guards

```ts
import { guardTools, shield } from 'ai-shield';
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

Ollama integration tests skip automatically when Ollama is unavailable:

```bash
OLLAMA_HOST=http://127.0.0.1:11434 OLLAMA_MODEL=llama3.2 npm run test:run
```

## License

MIT
