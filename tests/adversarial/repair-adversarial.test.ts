import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { shield } from '../../src/shield.js';
import { loadFixtures } from '../helpers/load-adversarial-fixtures.js';
import { createMockModel } from '../helpers/mock-model.js';

const fixtures = loadFixtures('repair');

describe('adversarial repair', () => {
  it.each(fixtures)('$id repairs invalid JSON via retry', async (fixture) => {
    let calls = 0;
    const model = createMockModel({
      text: () => {
        calls += 1;
        return calls === 1 ? (fixture.output ?? 'not json') : '{"name":"Ada","age":42}';
      },
    });

    const safeModel = shield(model, {
      guardrails: {
        output: {
          repair: { enabled: true, maxAttempts: 2 },
          pii: { enabled: false },
          keywords: { enabled: false, deny: [] },
        },
      },
      audit: { console: false },
    });

    const schema = z.object({ name: z.string(), age: z.number() });
    const result = await generateText({
      model: safeModel,
      prompt: fixture.prompt ?? 'Return JSON',
      providerOptions: { aiShield: { outputSchema: schema, sessionId: 'repair-adv' } },
    });

    expect(calls).toBeGreaterThan(1);
    expect(result.text).toContain('"age":42');
  });

  it('repair retry uses model.doGenerate bypassing input guards on second attempt', async () => {
    let calls = 0;
    const model = createMockModel({
      text: (prompt) => {
        calls += 1;
        if (calls === 1) return '```json\n{"x":1\n```';
        const text = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
        expect(text.toLowerCase()).toContain('validation');
        return '{"x":1,"y":2}';
      },
    });

    const safeModel = shield(model, {
      mode: 'strict',
      audit: { console: false },
    });

    const schema = z.object({ x: z.number(), y: z.number() });
    const result = await generateText({
      model: safeModel,
      prompt: 'Return JSON only',
      providerOptions: {
        aiShield: { outputSchema: schema, sessionId: 'repair-bypass' },
      },
    });

    expect(calls).toBeGreaterThan(1);
    expect(result.text).toContain('"y":2');
  });
});
