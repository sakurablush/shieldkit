import { generateText, stepCountIs, tool } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { z } from 'zod';

import { guardTools, shield } from '../src/index.js';

const model = shield(ollama(process.env.OLLAMA_MODEL ?? 'llama3.2'), {
  mode: 'local',
  audit: {
    console: true,
    sink: (log) => {
      console.log('[audit]', log.type, log.details ?? {});
    },
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
  {
    allow: ['getTime'],
    maxCallsPerRequest: 2,
  },
);

const result = await generateText({
  model,
  tools,
  stopWhen: stepCountIs(5),
  prompt: 'Use the getTime tool and summarize the result.',
  providerOptions: {
    aiShield: { sessionId: 'agent-example' },
  },
});

console.log(result.text);
