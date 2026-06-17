import { describe, expect, it } from 'vitest';

import {
  createEmptyUsage,
  createUsageFromCounts,
  getInputTokenCount,
  getOutputTokenCount,
  getTotalTokenCount,
  mergeUsage,
  normalizeUsageCounts,
  stopFinishReason,
} from '../../../src/utils/usage.js';
import { logTest } from '../../helpers/test-logger.js';

describe('usage utils', () => {
  it('creates empty usage with zero tokens', () => {
    const usage = createEmptyUsage();
    expect(getTotalTokenCount(usage)).toBe(0);
    logTest('usage', 'empty usage', usage);
  });

  it('merges multiple usage objects', () => {
    const a = createUsageFromCounts(10, 20);
    const b = createUsageFromCounts(5, 15);
    const merged = mergeUsage(a, b, undefined);
    expect(getInputTokenCount(merged)).toBe(15);
    expect(getOutputTokenCount(merged)).toBe(35);
  });

  it('normalizes flat and nested usage counts', () => {
    expect(normalizeUsageCounts(undefined)).toEqual({
      inputTokens: 0,
      outputTokens: 0,
    });
    expect(normalizeUsageCounts({ inputTokens: 3, outputTokens: 7 })).toEqual({
      inputTokens: 3,
      outputTokens: 7,
    });
    expect(
      normalizeUsageCounts({
        inputTokens: { total: 4 },
        outputTokens: { total: 9 },
      }),
    ).toEqual({ inputTokens: 4, outputTokens: 9 });
  });

  it('exposes unified stop finish reason', () => {
    expect(stopFinishReason.unified).toBe('stop');
    expect(stopFinishReason.raw).toBe('stop');
  });
});
