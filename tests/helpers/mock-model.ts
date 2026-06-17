import type { LanguageModelV3, LanguageModelV3Usage } from '@ai-sdk/provider';

import { createUsageFromCounts, stopFinishReason } from '../../src/utils/usage.js';

export function createMockModel(options: {
  modelId?: string;
  text: string | ((prompt: unknown) => string);
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}): LanguageModelV3 {
  const counts = options.usage ?? {
    inputTokens: 10,
    outputTokens: 20,
    totalTokens: 30,
  };
  const usage: LanguageModelV3Usage = createUsageFromCounts(
    counts.inputTokens ?? 10,
    counts.outputTokens ?? 20,
  );

  return {
    specificationVersion: 'v3',
    provider: 'mock',
    modelId: options.modelId ?? 'mock-model',
    supportedUrls: {},
    doGenerate: async (params) => {
      const text =
        typeof options.text === 'function' ? options.text(params.prompt) : options.text;
      return {
        content: [{ type: 'text', text }],
        finishReason: stopFinishReason,
        usage,
        warnings: [],
      };
    },
    doStream: async (params) => {
      const text =
        typeof options.text === 'function' ? options.text(params.prompt) : options.text;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'text-start', id: '1' });
          controller.enqueue({ type: 'text-delta', id: '1', delta: text });
          controller.enqueue({ type: 'text-end', id: '1' });
          controller.enqueue({
            type: 'finish',
            finishReason: stopFinishReason,
            usage,
          });
          controller.close();
        },
      });
      return { stream, warnings: [] };
    },
  };
}
