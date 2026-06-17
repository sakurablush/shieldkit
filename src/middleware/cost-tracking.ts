import type { LanguageModelV3Middleware, LanguageModelV3Usage } from '@ai-sdk/provider';

import { ShieldBudgetError } from '../errors.js';
import { getOrCreateSession, recordSessionUsage } from '../context.js';
import type { ShieldProviderOptions, ShieldRuntime } from '../types.js';
import { getInputTokenCount, getOutputTokenCount } from '../utils/usage.js';
import { estimateCostUsd, estimateTokensFromPrompt } from '../utils/token-estimator.js';
import { getShieldProviderOptions } from '../utils/prompt.js';

export function createCostTrackingMiddleware(
  runtime: ShieldRuntime,
): LanguageModelV3Middleware {
  const { config, emitAudit } = runtime;

  return {
    specificationVersion: 'v3',
    wrapGenerate: async ({ doGenerate, params, model }) => {
      const shieldOptions = getShieldProviderOptions(params.providerOptions);
      const sessionId = shieldOptions.sessionId ?? 'default';
      const session = getOrCreateSession(sessionId);
      const estimatedInput = estimateTokensFromPrompt(params.prompt, model.modelId);
      const estimatedCost = estimateCostUsd({
        modelId: model.modelId,
        inputTokens: estimatedInput,
        outputTokens: estimatedInput,
        pricing: config.cost.pricing,
        defaultPricing: config.cost.defaultPricing,
      });

      assertSessionBudget({
        config,
        session,
        sessionId,
        estimatedCost,
        shieldOptions,
        modelId: model.modelId,
        emitAudit,
      });

      const result = await doGenerate();
      const inputTokens = getInputTokenCount(result.usage) || estimatedInput;
      const outputTokens = getOutputTokenCount(result.usage);
      const costUsd = estimateCostUsd({
        modelId: model.modelId,
        inputTokens,
        outputTokens,
        pricing: config.cost.pricing,
        defaultPricing: config.cost.defaultPricing,
      });

      const updated = recordSessionUsage(sessionId, {
        inputTokens,
        outputTokens,
        costUsd,
      });

      emitAudit({
        type: 'cost.recorded',
        sessionId,
        userId: shieldOptions.userId,
        requestId: shieldOptions.requestId,
        modelId: model.modelId,
        details: {
          inputTokens,
          outputTokens,
          costUsd,
          sessionTotalCostUsd: updated.totalCostUsd,
        },
      });

      if (
        config.cost.maxCostPerSession !== undefined &&
        config.cost.warnAtPercent < 100
      ) {
        const percentUsed =
          (updated.totalCostUsd / config.cost.maxCostPerSession) * 100;
        if (percentUsed >= config.cost.warnAtPercent && percentUsed < 100) {
          emitAudit({
            type: 'budget.warn',
            sessionId,
            userId: shieldOptions.userId,
            requestId: shieldOptions.requestId,
            modelId: model.modelId,
            details: {
              percentUsed,
              totalCostUsd: updated.totalCostUsd,
              maxCostUsd: config.cost.maxCostPerSession,
            },
          });
        }
      }

      if (
        config.cost.maxCostPerSession !== undefined &&
        updated.totalCostUsd >= config.cost.maxCostPerSession
      ) {
        updated.budgetExceeded = true;
      }

      return result;
    },

    wrapStream: async ({ doStream, params, model }) => {
      const shieldOptions = getShieldProviderOptions(params.providerOptions);
      const sessionId = shieldOptions.sessionId ?? 'default';
      const session = getOrCreateSession(sessionId);
      const estimatedInput = estimateTokensFromPrompt(params.prompt, model.modelId);
      const estimatedCost = estimateCostUsd({
        modelId: model.modelId,
        inputTokens: estimatedInput,
        outputTokens: estimatedInput,
        pricing: config.cost.pricing,
        defaultPricing: config.cost.defaultPricing,
      });

      assertSessionBudget({
        config,
        session,
        sessionId,
        estimatedCost,
        shieldOptions,
        modelId: model.modelId,
        emitAudit,
      });

      const streamResult = await doStream();
      const originalStream = streamResult.stream;

      const wrappedStream = new ReadableStream({
        async start(controller) {
          const reader = originalStream.getReader();
          let usage: LanguageModelV3Usage | undefined;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }
              if (value.type === 'finish') {
                usage = value.usage;
              }
              controller.enqueue(value);
            }
          } finally {
            reader.releaseLock();
          }

          const inputTokens =
            getInputTokenCount(usage) ||
            estimateTokensFromPrompt(params.prompt, model.modelId);
          const outputTokens = getOutputTokenCount(usage);
          const costUsd = estimateCostUsd({
            modelId: model.modelId,
            inputTokens,
            outputTokens,
            pricing: config.cost.pricing,
            defaultPricing: config.cost.defaultPricing,
          });

          const updated = recordSessionUsage(sessionId, {
            inputTokens,
            outputTokens,
            costUsd,
          });

          emitAudit({
            type: 'cost.recorded',
            sessionId,
            userId: shieldOptions.userId,
            requestId: shieldOptions.requestId,
            modelId: model.modelId,
            details: {
              inputTokens,
              outputTokens,
              costUsd,
              sessionTotalCostUsd: updated.totalCostUsd,
              mode: 'stream',
            },
          });

          controller.close();
        },
      });

      return { ...streamResult, stream: wrappedStream };
    },
  };
}

function assertSessionBudget(options: {
  config: ShieldRuntime['config'];
  session: ReturnType<typeof getOrCreateSession>;
  sessionId: string;
  estimatedCost: number;
  shieldOptions: ShieldProviderOptions;
  modelId: string;
  emitAudit: ShieldRuntime['emitAudit'];
}): void {
  const {
    config,
    session,
    sessionId,
    estimatedCost,
    shieldOptions,
    modelId,
    emitAudit,
  } = options;

  if (config.cost.trackOnly) {
    return;
  }

  const maxCost = config.cost.maxCostPerSession;
  if (!Number.isFinite(maxCost)) {
    return;
  }

  if (session.totalCostUsd >= maxCost) {
    emitAudit({
      type: 'budget.exceeded',
      sessionId,
      userId: shieldOptions.userId,
      requestId: shieldOptions.requestId,
      modelId,
      details: {
        totalCostUsd: session.totalCostUsd,
        maxCostUsd: maxCost,
      },
    });
    throw new ShieldBudgetError({
      sessionId,
      totalCostUsd: session.totalCostUsd,
      maxCostUsd: maxCost,
    });
  }

  if (session.totalCostUsd + estimatedCost > maxCost) {
    throw new ShieldBudgetError({
      sessionId,
      totalCostUsd: session.totalCostUsd + estimatedCost,
      maxCostUsd: maxCost,
    });
  }
}
