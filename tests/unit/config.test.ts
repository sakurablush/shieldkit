import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../../src/config.js';
import { shield } from '../../src/shield.js';
import { createMockModel } from '../helpers/mock-model.js';

describe('resolveConfig', () => {
  it('defaults to balanced mode', () => {
    const config = resolveConfig();
    expect(config.mode).toBe('balanced');
    expect(config.guardrails.input.injection.enabled).toBe(true);
    expect(config.guardrails.output.repair.maxAttempts).toBe(2);
  });

  it('applies strict preset', () => {
    const config = resolveConfig({ mode: 'strict' });
    expect(config.guardrails.input.keywords.enabled).toBe(false);
    expect(config.guardrails.output.repair.maxAttempts).toBe(3);
    expect(config.guardrails.output.repair.includePartialInRetry).toBe(false);
    expect(config.audit.logLevel).toBe('detailed');
  });

  it('merges custom overrides', () => {
    const config = resolveConfig({
      mode: 'cheap',
      guardrails: {
        output: {
          repair: { maxAttempts: 5 },
        },
      },
    });
    expect(config.guardrails.output.repair.maxAttempts).toBe(5);
  });
});

describe('shield', () => {
  it('wraps model and passes through generation', async () => {
    const model = createMockModel({ text: 'hello world' });
    const safeModel = shield(model, { mode: 'cheap', audit: { console: false } });

    const result = await generateText({
      model: safeModel,
      prompt: 'Say hello',
    });

    expect(result.text).toBe('hello world');
  });
});
