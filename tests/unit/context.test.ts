import { beforeEach, describe, expect, it } from 'vitest';

import {
  createRequestContext,
  createShieldContext,
  getOrCreateSession,
  recordSessionUsage,
  resetSession,
  sessionStore,
} from '../../src/context.js';

describe('context', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it('creates and reuses sessions', () => {
    const created = createShieldContext('sess-a');
    expect(created.sessionId).toBe('sess-a');
    expect(created.totalCostUsd).toBe(0);

    const reused = getOrCreateSession('sess-a');
    expect(reused).toBe(created);
  });

  it('resets session state', () => {
    createShieldContext('sess-b');
    resetSession('sess-b');
    expect(sessionStore.has('sess-b')).toBe(false);
  });

  it('records session usage and increments counters', () => {
    const updated = recordSessionUsage('sess-c', {
      inputTokens: 10,
      outputTokens: 20,
      costUsd: 0.05,
    });
    expect(updated.totalInputTokens).toBe(10);
    expect(updated.totalOutputTokens).toBe(20);
    expect(updated.totalCostUsd).toBe(0.05);
    expect(updated.requestCount).toBe(1);
  });

  it('builds request context with defaults', () => {
    const ctx = createRequestContext({ sessionId: 's1', userId: 'u1' });
    expect(ctx.sessionId).toBe('s1');
    expect(ctx.userId).toBe('u1');
    expect(ctx.requestId).toMatch(/^req_/);
    expect(ctx.approved).toBe(false);
  });
});
