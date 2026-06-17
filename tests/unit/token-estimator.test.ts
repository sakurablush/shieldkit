import { describe, expect, it } from 'vitest';

import {
  estimateCostUsd,
  estimateTokensFromPrompt,
  estimateTokensFromText,
  resolveCharsPerToken,
} from '../../src/utils/token-estimator.js';

describe('token-estimator', () => {
  it('uses default chars-per-token when model is unknown', () => {
    expect(estimateTokensFromText('1234567890')).toBe(3);
    expect(resolveCharsPerToken(undefined)).toBe(4);
  });

  it('uses model-specific chars-per-token for known models', () => {
    expect(resolveCharsPerToken('gpt-4o')).toBe(3.5);
    expect(estimateTokensFromText('1234567', 'gpt-4o')).toBe(2);
    expect(estimateTokensFromText('12345678', 'llama3.2')).toBe(2);
  });

  it('resolves short model ids from provider paths', () => {
    expect(resolveCharsPerToken('ollama/llama3.2')).toBe(4);
    expect(resolveCharsPerToken('openai/gpt-4o-mini')).toBe(4);
  });

  it('estimates tokens from prompt objects', () => {
    const tokens = estimateTokensFromPrompt([
      { role: 'user', content: [{ type: 'text', text: '12345678' }] },
    ]);
    expect(tokens).toBeGreaterThan(0);
  });

  it('estimates USD cost from token counts', () => {
    const cost = estimateCostUsd({
      modelId: 'gpt-4o',
      inputTokens: 1_000_000,
      outputTokens: 500_000,
      pricing: { 'gpt-4o': { inputPer1M: 2, outputPer1M: 4 } },
      defaultPricing: { inputPer1M: 1, outputPer1M: 1 },
    });
    expect(cost).toBe(4);
  });

  it('returns zero cost for empty token usage', () => {
    expect(
      estimateCostUsd({
        modelId: 'unknown',
        inputTokens: 0,
        outputTokens: 0,
        pricing: {},
        defaultPricing: { inputPer1M: 10, outputPer1M: 10 },
      }),
    ).toBe(0);
  });
});
