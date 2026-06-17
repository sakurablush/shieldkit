import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildRepairFeedback } from '../../../src/middleware/repair.js';
import { shield } from '../../../src/shield.js';
import { createMockModel } from '../../helpers/mock-model.js';

describe('repair middleware', () => {
  it('retries invalid JSON and returns repaired output', async () => {
    let calls = 0;
    const model = createMockModel({
      text: () => {
        calls += 1;
        return calls === 1 ? '```json\n{"name":"Ada"\n```' : '{"name":"Ada","age":42}';
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
      prompt: 'Return JSON',
      providerOptions: {
        aiShield: { outputSchema: schema },
      },
    });

    expect(calls).toBeGreaterThan(1);
    expect(result.text).toContain('"age":42');
  });

  it('buildRepairFeedback omits partial output when includePartial is false', () => {
    const withPartial = buildRepairFeedback('bad schema', 'secret@corp.com', {
      includePartial: true,
    });
    const withoutPartial = buildRepairFeedback('bad schema', 'secret@corp.com', {
      includePartial: false,
    });

    expect(withPartial).toContain('secret@corp.com');
    expect(withoutPartial).not.toContain('secret@corp.com');
    expect(withoutPartial).toContain('Validation error: bad schema');
  });
});
