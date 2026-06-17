import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';

import { shield } from '../../../src/shield.js';
import { createMockModel } from '../../helpers/mock-model.js';

describe('audit logging middleware', () => {
  it('calls custom sink with lifecycle events', async () => {
    const events: string[] = [];
    const model = createMockModel({ text: 'logged response' });

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
      audit: {
        enabled: true,
        console: false,
        logLevel: 'detailed',
        sink: (log) => {
          events.push(log.type);
        },
      },
    });

    await generateText({ model: safeModel, prompt: 'hello' });

    expect(events).toContain('request.start');
    expect(events).toContain('request.complete');
    expect(events).toContain('cost.recorded');
  });
});
