import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { shieldStreamText } from '../../src/shield-generate.js';
import { shield } from '../../src/shield.js';
import { createMockModel } from '../helpers/mock-model.js';

describe('shieldStreamText adversarial coverage', () => {
  it('merges outputSchema into provider options and streams', async () => {
    const schema = z.object({ answer: z.string() });
    const model = shield(createMockModel({ text: '{"answer":"hello"}' }), {
      mode: 'local',
      audit: { console: false },
    });

    const result = shieldStreamText({
      model,
      prompt: 'Return JSON',
      outputSchema: schema,
      providerOptions: {
        aiShield: { sessionId: 'stream-schema', outputSchema: schema },
      },
    });

    const text = await result.text;
    expect(text.length).toBeGreaterThan(0);
  });
});
