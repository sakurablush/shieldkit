import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';

import { ShieldBudgetError } from '../../src/errors.js';
import { resetSession } from '../../src/context.js';
import { shield } from '../../src/shield.js';
import { createMockModel } from '../helpers/mock-model.js';

describe('adversarial budget', () => {
  it('enforces session budget when estimate exceeds cap', async () => {
    resetSession('budget-adv-strict');

    const model = createMockModel({
      text: 'ok',
      usage: { inputTokens: 100, outputTokens: 100, totalTokens: 200 },
    });

    const safeModel = shield(model, {
      cost: {
        maxCostPerSession: 0.000_01,
        trackOnly: false,
        defaultPricing: { inputPer1M: 1, outputPer1M: 1 },
      },
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

    await generateText({
      model: safeModel,
      prompt: 'first',
      providerOptions: { aiShield: { sessionId: 'budget-adv-strict' } },
    });

    await expect(
      generateText({
        model: safeModel,
        prompt: 'second',
        providerOptions: { aiShield: { sessionId: 'budget-adv-strict' } },
      }),
    ).rejects.toBeInstanceOf(ShieldBudgetError);
  });

  it('track-only local mode does not throw on repeated calls', async () => {
    resetSession('budget-adv-local');
    const model = createMockModel({
      text: 'ok',
      usage: { inputTokens: 100_000, outputTokens: 100_000 },
    });

    const safeModel = shield(model, {
      mode: 'local',
      audit: { console: false },
    });

    await expect(
      generateText({
        model: safeModel,
        prompt: 'track only',
        providerOptions: { aiShield: { sessionId: 'budget-adv-local' } },
      }),
    ).resolves.toBeDefined();
  });
});
