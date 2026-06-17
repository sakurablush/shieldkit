import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { shield } from '../../../src/shield.js';
import { createMockModel } from '../../helpers/mock-model.js';

describe('repair disabled', () => {
  it('does not repair invalid JSON when repair is disabled', async () => {
    const model = createMockModel({ text: 'not-json' });
    const safeModel = shield(model, {
      guardrails: {
        input: {
          injection: { enabled: false },
          pii: { enabled: false },
          keywords: { enabled: false, deny: [] },
        },
        output: {
          repair: { enabled: false },
          pii: { enabled: false },
          keywords: { enabled: false, deny: [] },
        },
      },
      audit: { console: false },
    });

    const schema = z.object({ ok: z.boolean() });
    const result = await generateText({
      model: safeModel,
      prompt: 'Return JSON',
      providerOptions: { aiShield: { outputSchema: schema, sessionId: 'no-repair' } },
    });

    expect(result.text).toBe('not-json');
  });
});
