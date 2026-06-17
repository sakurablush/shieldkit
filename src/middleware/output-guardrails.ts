import type {
  LanguageModelV3Middleware,
  LanguageModelV3StreamPart,
} from '@ai-sdk/provider';

import type { ShieldRuntime } from '../types.js';
import { getShieldProviderOptions } from '../utils/prompt.js';
import {
  applyOutputGuardsToGenerateResult,
  applyOutputTextGuards,
} from '../utils/output-guards.js';
import { createRepairMiddleware, validateAndRepair } from './repair.js';

export function createOutputGuardrailMiddleware(
  runtime: ShieldRuntime,
): LanguageModelV3Middleware {
  const repairMiddleware = createRepairMiddleware(runtime);
  const outputConfig = runtime.config.guardrails.output;
  const { emitAudit } = runtime;

  const guardOptions = (params: {
    providerOptions: Parameters<typeof getShieldProviderOptions>[0];
    modelId: string;
  }) => ({
    outputConfig,
    emitAudit,
    shieldOptions: getShieldProviderOptions(params.providerOptions),
    modelId: params.modelId,
  });

  return {
    specificationVersion: 'v3',
    wrapGenerate: async (options) => {
      const result = repairMiddleware.wrapGenerate
        ? await repairMiddleware.wrapGenerate(options)
        : await options.doGenerate();

      return applyOutputGuardsToGenerateResult(
        result,
        guardOptions({
          providerOptions: options.params.providerOptions,
          modelId: options.model.modelId,
        }),
      );
    },

    wrapStream: async (options) => {
      const streamResult = repairMiddleware.wrapStream
        ? await repairMiddleware.wrapStream(options)
        : await options.doStream();

      const guardParams = guardOptions({
        providerOptions: options.params.providerOptions,
        modelId: options.model.modelId,
      });
      const chunks = await collectStreamParts(streamResult.stream);
      const rawText = chunks
        .filter(
          (
            chunk,
          ): chunk is Extract<LanguageModelV3StreamPart, { type: 'text-delta' }> => {
            return chunk.type === 'text-delta';
          },
        )
        .map((chunk) => chunk.delta)
        .join('');

      const nextText = rawText
        ? applyOutputTextGuards({ ...guardParams, text: rawText })
        : rawText;

      const stream = new ReadableStream<LanguageModelV3StreamPart>({
        start(controller) {
          if (nextText) {
            let textEmitted = false;
            for (const chunk of chunks) {
              if (chunk.type === 'text-start') {
                controller.enqueue(chunk);
                continue;
              }
              if (chunk.type === 'text-delta') {
                if (!textEmitted) {
                  controller.enqueue({
                    type: 'text-delta',
                    id: chunk.id,
                    delta: nextText,
                  });
                  textEmitted = true;
                }
                continue;
              }
              if (chunk.type === 'text-end') {
                controller.enqueue(chunk);
                continue;
              }
              controller.enqueue(chunk);
            }
          } else {
            for (const chunk of chunks) {
              controller.enqueue(chunk);
            }
          }
          controller.close();
        },
      });

      return { ...streamResult, stream };
    },
  };
}

async function collectStreamParts(
  stream: ReadableStream<LanguageModelV3StreamPart>,
): Promise<LanguageModelV3StreamPart[]> {
  const parts: LanguageModelV3StreamPart[] = [];
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return parts;
}

export { validateAndRepair };
