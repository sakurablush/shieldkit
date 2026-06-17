import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NoObjectGeneratedError } from 'ai';
import { z } from 'zod';

import { ShieldRepairError } from '../../src/errors.js';
import type { LanguageModel } from '../../src/types.js';

const { generateTextMock } = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
}));

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    generateText: generateTextMock,
  };
});

const { shieldGenerateText } = await import('../../src/shield-generate.js');

const mockModel = {
  specificationVersion: 'v3',
  provider: 'mock',
  modelId: 'mock-model',
} as LanguageModel;

const schema = z.object({ name: z.string(), age: z.number() });

function createNoObjectError(text: string): NoObjectGeneratedError {
  return new NoObjectGeneratedError({
    message: 'Could not parse object',
    text,
    response: {
      id: 'resp-1',
      timestamp: new Date(),
      modelId: 'mock-model',
    },
    usage: { inputTokens: 12, outputTokens: 8, totalTokens: 20 },
    finishReason: 'stop',
  });
}

describe('shieldGenerateText', () => {
  beforeEach(() => {
    generateTextMock.mockReset();
  });

  it('returns repaired output when NoObjectGeneratedError contains fixable JSON', async () => {
    generateTextMock.mockRejectedValueOnce(
      createNoObjectError('```json\n{"name":"Ada","age":30}\n```'),
    );

    const result = await shieldGenerateText({
      model: mockModel,
      prompt: 'Generate profile',
      outputSchema: schema,
    });

    expect(result.output).toEqual({ name: 'Ada', age: 30 });
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it('retries generateText when initial object validation fails', async () => {
    generateTextMock
      .mockRejectedValueOnce(createNoObjectError('not json at all'))
      .mockResolvedValueOnce({
        text: '{"name":"Bob","age":25}',
        output: { name: 'Bob', age: 25 },
      });

    const result = await shieldGenerateText({
      model: mockModel,
      prompt: 'Generate profile',
      outputSchema: schema,
      maxRepairAttempts: 2,
    });

    expect(result.output).toEqual({ name: 'Bob', age: 25 });
    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it('throws ShieldRepairError when retries are exhausted', async () => {
    generateTextMock
      .mockRejectedValueOnce(createNoObjectError('still not json'))
      .mockResolvedValueOnce({ text: 'still not json' });

    await expect(
      shieldGenerateText({
        model: mockModel,
        prompt: 'Generate profile',
        outputSchema: schema,
        maxRepairAttempts: 1,
      }),
    ).rejects.toBeInstanceOf(ShieldRepairError);
  });
});
