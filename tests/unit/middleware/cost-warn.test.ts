import { describe, expect, it } from 'vitest';

import { resolveConfig } from '../../../src/config.js';
import { createShieldContext, sessionStore } from '../../../src/context.js';
import { createCostTrackingMiddleware } from '../../../src/middleware/cost-tracking.js';
import type { AuditLog } from '../../../src/types.js';
import { createMockModel } from '../../helpers/mock-model.js';
import { logAuditEvents } from '../../helpers/test-logger.js';

describe('cost warn middleware', () => {
  it('emits budget.warn when session crosses warnAtPercent', async () => {
    sessionStore.clear();
    const auditLogs: AuditLog[] = [];

    const session = createShieldContext('warn-session');
    session.totalCostUsd = 0.049;
    sessionStore.set('warn-session', session);

    const config = resolveConfig({
      cost: {
        maxCostPerSession: 0.1,
        warnAtPercent: 50,
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
    });
    expect(config.cost.warnAtPercent).toBe(50);
    expect(config.cost.maxCostPerSession).toBe(0.1);

    const middleware = createCostTrackingMiddleware({
      config,
      sessionStore,
      emitAudit: (log) => auditLogs.push(log),
    });

    const model = createMockModel({
      text: 'ok',
      usage: { inputTokens: 3000, outputTokens: 3000, totalTokens: 6000 },
    });

    await middleware.wrapGenerate!({
      doGenerate: async () =>
        model.doGenerate({
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'x' }] }],
        }),
      params: {
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'x' }] }],
        providerOptions: { aiShield: { sessionId: 'warn-session' } },
      },
      model,
    });

    const updated = sessionStore.get('warn-session');
    expect(updated?.totalCostUsd).toBeGreaterThan(0.054);
    const percentUsed = (updated!.totalCostUsd / config.cost.maxCostPerSession) * 100;
    expect(percentUsed).toBeGreaterThanOrEqual(50);
    expect(percentUsed).toBeLessThan(100);
    logAuditEvents(
      'cost-warn',
      auditLogs.map((l) => ({ type: l.type })),
    );
    expect(auditLogs.map((l) => l.type)).toContain('budget.warn');
    expect(auditLogs.map((l) => l.type)).toContain('cost.recorded');
    expect(sessionStore.get('warn-session')?.budgetExceeded).toBe(false);
  });
});
