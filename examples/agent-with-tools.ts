/**
 * Smoke example: shield + guardTools + live Ollama agent loop.
 * Run: npx tsx examples/agent-with-tools.ts
 */
import { generateText, stepCountIs, tool } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { z } from 'zod';

import { guardTools, shield } from '../src/index.js';

const auditEvents: string[] = [];

const model = shield(ollama(process.env.OLLAMA_MODEL ?? 'llama3.2'), {
  mode: 'local',
  audit: {
    console: true,
    sink: (log) => {
      auditEvents.push(log.type);
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

const steps = result.steps?.length ?? 0;
const toolCalls = result.steps?.flatMap((s) => s.toolCalls ?? []).length ?? 0;

console.log('\n--- agent-with-tools evidence ---');
console.log(`✅ final text (${result.text.length} chars):`, result.text);
console.log(`✅ agent steps: ${steps}, tool calls: ${toolCalls}`);
console.log(`✅ audit trail: ${auditEvents.join(' → ')}`);

const ok =
  result.text.length > 0 &&
  steps >= 1 &&
  auditEvents.includes('request.start') &&
  auditEvents.includes('request.complete') &&
  auditEvents.includes('cost.recorded');

if (!ok) {
  console.error('❌ agent-with-tools smoke checks failed');
  process.exit(1);
}

console.log('✅ agent-with-tools smoke passed\n');
