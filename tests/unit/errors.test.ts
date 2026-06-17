import { describe, expect, it } from 'vitest';

import {
  ShieldBlockedError,
  ShieldBudgetError,
  ShieldRepairError,
  ShieldToolError,
} from '../../src/errors.js';

describe('shield errors', () => {
  it('ShieldBlockedError exposes guard metadata', () => {
    const error = new ShieldBlockedError({
      guard: 'injection',
      summary: 'score high',
    });
    expect(error.name).toBe('ShieldBlockedError');
    expect(error.guard).toBe('injection');
    expect(error.summary).toBe('score high');
    expect(error.message).toContain('injection');
  });

  it('ShieldBudgetError exposes session budget fields', () => {
    const error = new ShieldBudgetError({
      sessionId: 's1',
      totalCostUsd: 1.5,
      maxCostUsd: 1.0,
    });
    expect(error.sessionId).toBe('s1');
    expect(error.totalCostUsd).toBe(1.5);
    expect(error.maxCostUsd).toBe(1.0);
  });

  it('ShieldRepairError exposes repair metadata', () => {
    const error = new ShieldRepairError({
      partialText: '{"x":',
      attempts: 2,
      lastError: 'invalid json',
      usage: { totalTokens: 42 },
    });
    expect(error.partialText).toBe('{"x":');
    expect(error.attempts).toBe(2);
    expect(error.lastError).toBe('invalid json');
    expect(error.usage?.totalTokens).toBe(42);
  });

  it('ShieldToolError exposes tool metadata', () => {
    const error = new ShieldToolError({
      toolName: 'deleteAll',
      reason: 'denied',
    });
    expect(error.toolName).toBe('deleteAll');
    expect(error.reason).toBe('denied');
  });
});
