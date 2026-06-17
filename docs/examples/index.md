# Examples

Runnable and copy-paste examples live in the repository `examples/` directory.

## Next.js API route

**File:** `examples/nextjs-api-route.ts` (repository root)

App Router POST handler with session initialization and cost budget:

```ts
import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { createShieldContext, shield } from 'shieldkit';

const model = shield(ollama(process.env.OLLAMA_MODEL ?? 'llama3.2'), {
  mode: 'balanced',
  cost: { maxCostPerSession: 0.25 },
});

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt: string; sessionId?: string };
  const sessionId = body.sessionId ?? 'anonymous';
  createShieldContext(sessionId);

  const result = await generateText({
    model,
    prompt: body.prompt,
    providerOptions: {
      aiShield: { sessionId, userId: 'demo-user' },
    },
  });

  return Response.json({ text: result.text });
}
```

**Highlights:**

- `createShieldContext(sessionId)` resets budget state for the conversation
- `maxCostPerSession` enforces per-user spending
- `userId` appears in audit logs

Copy into `app/api/chat/route.ts` in a Next.js project with `shieldkit`, `ai`, and `zod` installed.

## Agent with tools

**File:** `examples/agent-with-tools.ts` (repository root)

Local Ollama model with `guardTools` and custom audit sink:

```ts
import { generateText, tool } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { z } from 'zod';
import { guardTools, shield } from 'shieldkit';

const model = shield(ollama(process.env.OLLAMA_MODEL ?? 'llama3.2'), {
  mode: 'local',
  audit: {
    console: true,
    sink: (log) => console.log('[audit]', log.type, log.details ?? {}),
  },
});

const tools = guardTools(
  {
    getTime: tool({
      description: 'Get current UTC time',
      inputSchema: z.object({}),
      execute: async () => ({ now: new Date().toISOString() }),
    }),
  },
  { allow: ['getTime'], maxCallsPerRequest: 2 },
);

const result = await generateText({
  model,
  tools,
  prompt: 'Use the getTime tool and summarize the result.',
  providerOptions: { aiShield: { sessionId: 'agent-example' } },
});
```

**Highlights:**

- `local` mode: warn-only injection, track-only budgets, detailed audit
- `guardTools` with allow list and per-request call limit
- Dual audit output (console + custom sink)

Run directly (requires Ollama):

```bash
npx tsx examples/agent-with-tools.ts
```

## Test suite as reference

The `tests/` directory contains additional usage patterns:

| File                                             | Pattern                            |
| ------------------------------------------------ | ---------------------------------- |
| `tests/helpers/mock-model.ts`                    | Deterministic model for unit tests |
| `tests/unit/middleware/input-guardrails.test.ts` | Testing injection block            |
| `tests/unit/middleware/cost-tracking.test.ts`    | Budget enforcement                 |
| `tests/unit/tools/guard-tools.test.ts`           | Tool policy combinations           |
| `tests/integration/ollama.test.ts`               | Live end-to-end with Ollama        |

See [Writing tests](../testing/writing-tests.md).

## Related docs

- [Getting started](../getting-started.md)
- [Tool guards](../features/tool-guards.md)
- [Cost tracking](../features/cost-tracking.md)
