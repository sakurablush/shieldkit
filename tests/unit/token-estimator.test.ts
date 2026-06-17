import { describe, expect, it } from 'vitest';

import {
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
});
