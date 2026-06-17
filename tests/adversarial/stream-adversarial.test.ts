import { streamText } from 'ai';
import { describe, expect, it } from 'vitest';

import { shield } from '../../src/shield.js';
import { createMockModel } from '../helpers/mock-model.js';

describe('adversarial stream output guards', () => {
  it('redacts PII split across single stream chunk', async () => {
    const model = createMockModel({ text: 'Email: leak@corp.com today' });
    const safeModel = shield(model, {
      guardrails: {
        input: {
          injection: { enabled: false },
          pii: { enabled: false },
          keywords: { enabled: false, deny: [] },
        },
        output: {
          repair: { enabled: false },
          pii: { enabled: true, action: 'redact' },
          keywords: { enabled: false, deny: [] },
        },
      },
      audit: { console: false },
    });

    const text = await streamText({ model: safeModel, prompt: 'contact' }).text;
    expect(text).toContain('[REDACTED_PII:email]');
    expect(text).not.toContain('leak@corp.com');
  });

  it('blocks keyword in streamed output', async () => {
    const model = createMockModel({ text: 'forbidden word appears here' });
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
          keywords: { enabled: true, deny: ['forbidden'], action: 'block' },
        },
      },
      audit: { console: false },
    });

    await expect(
      streamText({ model: safeModel, prompt: 'say' }).text,
    ).rejects.toThrow();
  });
});
