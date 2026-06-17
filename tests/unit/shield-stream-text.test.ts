import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { shieldStreamText } from '../../src/shield-generate.js';
import { shield } from '../../src/shield.js';
import { createMockModel } from '../helpers/mock-model.js';

describe('shieldStreamText', () => {
  it('merges outputSchema into provider options and streams', async () => {
    const model = shield(createMockModel({ text: 'stream payload' }), {
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
    const result = shieldStreamText({
      model,
      prompt: 'go',
      outputSchema: schema,
      providerOptions: { aiShield: { sessionId: 'stream-schema' } },
    });

    const text = await result.text;
    expect(text).toBe('stream payload');
  });
});
