import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3Middleware,
} from '@ai-sdk/provider';
import type { z } from 'zod';

import { ShieldRepairError } from '../errors.js';
import type { ShieldRuntime } from '../types.js';
import {
  createEmptyUsage,
  getInputTokenCount,
  getOutputTokenCount,
  mergeUsage,
  stopFinishReason,
} from '../utils/usage.js';
import { formatZodErrors, repairJson } from '../utils/json-repair.js';
import {
  appendUserMessage,
  extractTextFromContent,
  getShieldProviderOptions,
  replaceTextInContent,
  stripMarkdownJsonFences,
} from '../utils/prompt.js';
import { collectStreamTextAndUsage } from '../utils/stream-collector.js';

type GenerateResult = Awaited<ReturnType<LanguageModelV3['doGenerate']>>;

export function createRepairMiddleware(
  runtime: ShieldRuntime,
): LanguageModelV3Middleware {
  const { config, emitAudit } = runtime;
  const repairConfig = config.guardrails.output.repair;

  return {
    specificationVersion: 'v3',
    wrapGenerate: async ({ doGenerate, doStream: _doStream, params, model }) => {
      if (!repairConfig.enabled) {
        return doGenerate();
      }

      return executeRepairLoop({
        params,
        model,
        maxAttempts: repairConfig.maxAttempts,
        includePartialInRetry: repairConfig.includePartialInRetry,
        emitAudit,
        invoke: (nextParams) => Promise.resolve(model.doGenerate(nextParams)),
        fallback: async () => await doGenerate(),
      });
    },

    wrapStream: async ({ doStream, params, model }) => {
      if (!repairConfig.enabled) {
        return doStream();
      }

      const repaired = await executeRepairLoop({
        params,
        model,
        maxAttempts: repairConfig.maxAttempts,
        includePartialInRetry: repairConfig.includePartialInRetry,
        emitAudit,
        invoke: async (nextParams) => {
          const streamed = await model.doStream(nextParams);
          const collected = await collectStreamTextAndUsage(streamed.stream);
          const usage = collected.usage ?? createEmptyUsage();
          return {
            content: [{ type: 'text' as const, text: collected.text }],
            finishReason: stopFinishReason,
            usage,
            warnings: [],
          } satisfies GenerateResult;
        },
        fallback: async () => {
          const streamed = await doStream();
          const collected = await collectStreamTextAndUsage(streamed.stream);
          const usage = collected.usage ?? createEmptyUsage();
          return {
            content: [{ type: 'text' as const, text: collected.text }],
            finishReason: stopFinishReason,
            usage,
            warnings: [],
          } satisfies GenerateResult;
        },
      });

      const text = extractTextFromContent(repaired.content);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'text-start', id: 'shield-text' });
          controller.enqueue({ type: 'text-delta', id: 'shield-text', delta: text });
          controller.enqueue({ type: 'text-end', id: 'shield-text' });
          controller.enqueue({
            type: 'finish',
            finishReason: stopFinishReason,
            usage: repaired.usage,
          });
          controller.close();
        },
      });

      return { stream, warnings: repaired.warnings };
    },
  };
}

async function executeRepairLoop(options: {
  params: LanguageModelV3CallOptions;
  model: LanguageModelV3;
  maxAttempts: number;
  includePartialInRetry: boolean;
  emitAudit: ShieldRuntime['emitAudit'];
  invoke: (params: LanguageModelV3CallOptions) => Promise<GenerateResult>;
  fallback: () => Promise<GenerateResult>;
}): Promise<GenerateResult> {
  const shieldOptions = getShieldProviderOptions(options.params.providerOptions);
  let currentParams = options.params;
  let lastError = 'Unknown validation error';
  let partialText = '';
  let lastResult: GenerateResult | undefined;
  let accumulatedUsage: GenerateResult['usage'] | undefined;

  const totalAttempts = options.maxAttempts + 1;

  for (let attempt = 0; attempt < totalAttempts; attempt += 1) {
    lastResult =
      attempt === 0 ? await options.fallback() : await options.invoke(currentParams);

    accumulatedUsage = mergeUsage(accumulatedUsage, lastResult.usage);

    const rawText = extractTextFromContent(lastResult.content);
    partialText = rawText;

    options.emitAudit({
      type: 'repair.attempt',
      sessionId: shieldOptions.sessionId,
      userId: shieldOptions.userId,
      requestId: shieldOptions.requestId,
      modelId: options.model.modelId,
      details: { attempt: attempt + 1, textLength: rawText.length },
    });

    const needsJsonValidation =
      options.params.responseFormat?.type === 'json' ||
      Boolean(shieldOptions.outputSchema);

    if (!needsJsonValidation) {
      return { ...lastResult, usage: accumulatedUsage };
    }

    const validation = validateAndRepair(rawText, shieldOptions.outputSchema);
    if (validation.valid) {
      options.emitAudit({
        type: 'repair.success',
        sessionId: shieldOptions.sessionId,
        userId: shieldOptions.userId,
        requestId: shieldOptions.requestId,
        modelId: options.model.modelId,
        details: { attempt: attempt + 1, repaired: validation.repaired },
      });

      const content =
        validation.text !== rawText
          ? replaceTextInContent(lastResult.content, validation.text)
          : lastResult.content;

      return {
        ...lastResult,
        content,
        usage: accumulatedUsage,
      };
    }

    lastError = validation.error ?? lastError;

    if (attempt >= options.maxAttempts) {
      break;
    }

    currentParams = {
      ...currentParams,
      prompt: appendUserMessage(
        currentParams.prompt,
        buildRepairFeedback(lastError, validation.text, {
          includePartial: options.includePartialInRetry,
        }),
      ),
    };
  }

  options.emitAudit({
    type: 'repair.failed',
    sessionId: shieldOptions.sessionId,
    userId: shieldOptions.userId,
    requestId: shieldOptions.requestId,
    modelId: options.model.modelId,
    details: { attempts: totalAttempts, lastError },
  });

  throw new ShieldRepairError({
    partialText,
    attempts: totalAttempts,
    lastError,
    usage: accumulatedUsage
      ? {
          inputTokens: getInputTokenCount(accumulatedUsage),
          outputTokens: getOutputTokenCount(accumulatedUsage),
        }
      : lastResult?.usage
        ? {
            inputTokens: getInputTokenCount(lastResult.usage),
            outputTokens: getOutputTokenCount(lastResult.usage),
          }
        : undefined,
  });
}

export function validateAndRepair(
  rawText: string,
  schema?: z.ZodType,
): { valid: boolean; text: string; repaired: boolean; error?: string } {
  const stripped = stripMarkdownJsonFences(rawText);
  const jsonRepair = repairJson(stripped);
  const candidate = jsonRepair.text;

  try {
    const parsed: unknown = JSON.parse(candidate);
    if (schema) {
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        return {
          valid: false,
          text: candidate,
          repaired: jsonRepair.repaired,
          error: formatZodErrors(validation.error),
        };
      }
    }

    return {
      valid: true,
      text: candidate,
      repaired: jsonRepair.repaired || candidate !== rawText.trim(),
    };
  } catch (error) {
    return {
      valid: false,
      text: candidate,
      repaired: jsonRepair.repaired,
      error:
        error instanceof Error ? error.message : (jsonRepair.error ?? 'Invalid JSON'),
    };
  }
}

function buildRepairFeedback(
  error: string,
  partial: string,
  options?: { includePartial?: boolean },
): string {
  const includePartial = options?.includePartial ?? true;
  return [
    'Your previous response was not valid JSON or did not match the required schema.',
    `Validation error: ${error}`,
    'Return ONLY valid JSON with no markdown fences or commentary.',
    includePartial && partial ? `Previous output:\n${partial}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export { buildRepairFeedback };
