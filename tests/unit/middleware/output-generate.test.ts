import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';

import { ShieldBlockedError } from '../../../src/errors.js';
import { shield } from '../../../src/shield.js';
import { createMockModel } from '../../helpers/mock-model.js';

describe('output guardrails generate path', () => {
  it('redacts PII in generateText output', async () => {
    const model = createMockModel({ text: 'Email: secret@example.com' });
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

    const result = await generateText({ model: safeModel, prompt: 'contact' });
    expect(result.text).toContain('[REDACTED_PII:email]');
    expect(result.text).not.toContain('secret@example.com');
  });

  it('blocks forbidden keywords in generateText output', async () => {
    const model = createMockModel({ text: 'Contains forbidden token' });
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
      generateText({ model: safeModel, prompt: 'say' }),
    ).rejects.toBeInstanceOf(ShieldBlockedError);
  });
});
