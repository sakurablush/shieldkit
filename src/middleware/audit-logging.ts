import type { LanguageModelV3Middleware } from '@ai-sdk/provider';

import type { ShieldRuntime } from '../types.js';
import { getShieldProviderOptions } from '../utils/prompt.js';

export function createAuditLoggingMiddleware(
  runtime: ShieldRuntime,
): LanguageModelV3Middleware {
  const { emitAudit } = runtime;

  return {
    specificationVersion: 'v3',
    wrapGenerate: async ({ doGenerate, params, model }) => {
      const shieldOptions = getShieldProviderOptions(params.providerOptions);

      emitAudit({
        type: 'request.start',
        sessionId: shieldOptions.sessionId,
        userId: shieldOptions.userId,
        requestId: shieldOptions.requestId,
        modelId: model.modelId,
        details: { mode: 'generate' },
      });

      try {
        const result = await doGenerate();
        emitAudit({
          type: 'request.complete',
          sessionId: shieldOptions.sessionId,
          userId: shieldOptions.userId,
          requestId: shieldOptions.requestId,
          modelId: model.modelId,
          details: {
            mode: 'generate',
            finishReason: result.finishReason,
            usage: result.usage,
          },
        });
        return result;
      } catch (error) {
        emitAudit({
          type: 'request.blocked',
          sessionId: shieldOptions.sessionId,
          userId: shieldOptions.userId,
          requestId: shieldOptions.requestId,
          modelId: model.modelId,
          details: {
            mode: 'generate',
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
    },

    wrapStream: async ({ doStream, params, model }) => {
      const shieldOptions = getShieldProviderOptions(params.providerOptions);

      emitAudit({
        type: 'request.start',
        sessionId: shieldOptions.sessionId,
        userId: shieldOptions.userId,
        requestId: shieldOptions.requestId,
        modelId: model.modelId,
        details: { mode: 'stream' },
      });

      const result = await doStream();

      const wrappedStream = new ReadableStream({
        async start(controller) {
          const reader = result.stream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              controller.enqueue(value);
            }
            emitAudit({
              type: 'request.complete',
              sessionId: shieldOptions.sessionId,
              userId: shieldOptions.userId,
              requestId: shieldOptions.requestId,
              modelId: model.modelId,
              details: { mode: 'stream' },
            });
            controller.close();
          } catch (error) {
            emitAudit({
              type: 'request.blocked',
              sessionId: shieldOptions.sessionId,
              userId: shieldOptions.userId,
              requestId: shieldOptions.requestId,
              modelId: model.modelId,
              details: {
                mode: 'stream',
                error: error instanceof Error ? error.message : String(error),
              },
            });
            controller.error(error);
          } finally {
            reader.releaseLock();
          }
        },
      });

      return { ...result, stream: wrappedStream };
    },
  };
}
