import { describe, expect, it } from 'vitest';

const runFrontier = process.env.RUN_FRONTIER_REDTEAM === '1';

describe.skipIf(!runFrontier)('frontier red team smoke', () => {
  it('requires provider API keys before live spot-checks', () => {
    const hasKey =
      Boolean(process.env.OPENAI_API_KEY) ||
      Boolean(process.env.ANTHROPIC_API_KEY) ||
      Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    expect(
      hasKey,
      'Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY',
    ).toBe(true);
  });
});
