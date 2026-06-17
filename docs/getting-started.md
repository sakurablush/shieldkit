# Getting Started

Install **shieldkit** from npm and wrap your first language model in a few minutes.

Source repository: [sakurablush/ai-shield](https://github.com/sakurablush/ai-shield).

## Prerequisites

- **Node.js** ≥ 20
- **Vercel AI SDK** (`ai` ≥ 6) and **Zod** (`^3.25` or `^4`) as peer dependencies

## Installation

```bash
npm install shieldkit ai zod
```

For local models, add an Ollama provider (optional):

```bash
npm install ollama-ai-provider-v2
```

## First request

Wrap any `LanguageModelV3` with `shield()` and pass a session ID per request:

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

With OpenAI or another provider, pass your existing model instead of `ollama(...)` — the API is the same.

## Mode presets

Choose a preset when creating the shielded model:

```ts
const model = shield(baseModel, { mode: 'balanced' }); // default
const strict = shield(baseModel, { mode: 'strict' });
const local = shield(baseModel, { mode: 'local' });
```

| Mode       | Best for                                           |
| ---------- | -------------------------------------------------- |
| `balanced` | General production use                             |
| `strict`   | High-sensitivity data, tighter injection threshold |
| `cheap`    | Low-cost demos, warn-only injection                |
| `local`    | Ollama / self-hosted, track-only budgets           |
| `custom`   | Full manual control over every setting             |

See [Configuration](./architecture/configuration.md) for the full preset table.

## Per-request context

Use `providerOptions.aiShield` on every call:

```ts
await generateText({
  model,
  prompt: '...',
  providerOptions: {
    aiShield: {
      sessionId: 'user-123', // cost budget key
      userId: 'auth-id', // audit correlation
      requestId: 'req-optional', // auto-generated if omitted
    },
  },
});
```

## Common workflows

### Structured JSON output

```ts
import { generateText, Output } from 'ai';
import { z } from 'zod';

const schema = z.object({ answer: z.string() });

const { output } = await generateText({
  model: shield(baseModel, { mode: 'local' }),
  output: Output.object({ schema }),
  prompt: 'Reply as JSON.',
  providerOptions: {
    aiShield: { sessionId: 's1', outputSchema: schema },
  },
});
```

Details: [Structured output](./features/structured-output.md)

### Session budgets

```ts
import { createShieldContext, shield } from 'shieldkit';

createShieldContext('user-123');

const model = shield(baseModel, {
  cost: { maxCostPerSession: 0.5 },
});
```

Details: [Cost tracking](./features/cost-tracking.md)

### Tool policies

```ts
import { guardTools, shield } from 'shieldkit';

const tools = guardTools(myTools, {
  allow: ['search'],
  maxCallsPerRequest: 3,
  requestId: 'req-abc',
});
```

Details: [Tool guards](./features/tool-guards.md)

### Custom audit sink

```ts
const model = shield(baseModel, {
  audit: {
    console: false,
    sink: (log) => myLogger.info(log),
  },
});
```

Details: [Audit logging](./features/audit-logging.md)

## Error handling

```ts
import {
  ShieldBlockedError,
  ShieldBudgetError,
  ShieldRepairError,
  ShieldToolError,
} from 'shieldkit';

try {
  await generateText({ model, prompt });
} catch (error) {
  if (error instanceof ShieldBlockedError) {
    // Guard blocked the request
  } else if (error instanceof ShieldBudgetError) {
    // Session budget exceeded
  }
}
```

All shield errors extend `AISDKError` from the AI SDK.

## Next steps

| Topic        | Doc                                             |
| ------------ | ----------------------------------------------- |
| Architecture | [Overview](./architecture/overview.md)          |
| All features | [Features index](./README.md#documentation-map) |
| API symbols  | [API reference](./api/reference.md)             |
| Examples     | [Examples](./examples/index.md)                 |
| Testing      | [Running tests](./testing/running-tests.md)     |
| Contributing | [Contributing](./contributing.md)               |
