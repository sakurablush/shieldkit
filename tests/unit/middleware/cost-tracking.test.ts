import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../../../src/config.js';
import { resetSession, sessionStore } from '../../../src/context.js';
import { ShieldBudgetError } from '../../../src/errors.js';
import { createCostTrackingMiddleware } from '../../../src/middleware/cost-tracking.js';
import { shield } from '../../../src/shield.js';
import { createAuditEmitter } from '../../../src/utils/audit.js';
import { createMockModel } from '../../helpers/mock-model.js';

describe('cost tracking middleware', () => {
  it('enforces session budget', async () => {
    resetSession('budget-test');

    const model = createMockModel({
      text: 'ok',
      usage: {
        inputTokens: 100,
        outputTokens: 100,
        totalTokens: 200,
      },
    });

    const safeModel = shield(model, {
      cost: {
        maxCostPerSession: 0.00001,
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
      prompt: 'first call',
      providerOptions: {
        aiShield: { sessionId: 'budget-test' },
      },
    });

    await expect(
      generateText({
        model: safeModel,
        prompt: 'second call',
        providerOptions: {
          aiShield: { sessionId: 'budget-test' },
        },
      }),
    ).rejects.toBeInstanceOf(ShieldBudgetError);
  });

  it('estimates stream cost before starting the stream', async () => {
    resetSession('stream-estimate');

    const middleware = createCostTrackingMiddleware({
      config: resolveConfig({
        cost: {
          maxCostPerSession: 0.000001,
          trackOnly: false,
          defaultPricing: { inputPer1M: 1, outputPer1M: 1 },
        },
      }),
      sessionStore,
      emitAudit: createAuditEmitter({
        enabled: false,
        console: false,
        logLevel: 'basic',
      }),
    });

    await expect(
      middleware.wrapStream!({
        doStream: async () => ({
          stream: new ReadableStream(),
          warnings: [],
        }),
        params: {
          prompt: [
            { role: 'user', content: [{ type: 'text', text: 'a'.repeat(500) }] },
          ],
        },
        model: createMockModel({ text: 'ok' }),
      }),
    ).rejects.toBeInstanceOf(ShieldBudgetError);
  });

  it('tracks usage without enforcing in trackOnly mode', async () => {
    resetSession('track-only');

    const model = createMockModel({ text: 'ok' });
    const safeModel = shield(model, {
      mode: 'local',
      audit: { console: false },
    });

    await generateText({
      model: safeModel,
      prompt: 'hello',
      providerOptions: { aiShield: { sessionId: 'track-only' } },
    });

    await generateText({
      model: safeModel,
      prompt: 'hello again',
      providerOptions: { aiShield: { sessionId: 'track-only' } },
    });
  });
});
