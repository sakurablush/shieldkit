import { generateText, NoObjectGeneratedError, streamText } from 'ai';
import type { z } from 'zod';

import { resolveConfig } from './config.js';
import { ShieldRepairError } from './errors.js';
import { validateAndRepair, buildRepairFeedback } from './middleware/repair.js';
import type { LanguageModel, ShieldConfig } from './types.js';
import { mergeShieldProviderOptions } from './utils/prompt.js';
import { normalizeUsageCounts } from './utils/usage.js';

type GenerateTextParams = Parameters<typeof generateText>[0];

function getPromptText(prompt: GenerateTextParams['prompt'] | undefined): string {
  if (typeof prompt === 'string') {
    return prompt;
  }
  if (prompt === undefined) {
    return '';
  }
  return JSON.stringify(prompt);
}

export async function shieldGenerateText(
  params: GenerateTextParams & {
    model: LanguageModel;
    config?: ShieldConfig;
    outputSchema?: z.ZodType;
    maxRepairAttempts?: number;
  },
): Promise<Awaited<ReturnType<typeof generateText>>> {
  const { config, outputSchema, maxRepairAttempts, ...generateParams } = params;
  const resolved = resolveConfig(config);
  const attempts = maxRepairAttempts ?? resolved.guardrails.output.repair.maxAttempts;
  const includePartialInRetry = resolved.guardrails.output.repair.includePartialInRetry;

  const mergedOptions = mergeShieldProviderOptions(generateParams.providerOptions, {
    ...(outputSchema ? { outputSchema } : {}),
  });

  const baseParams = {
    ...generateParams,
    ...(mergedOptions ? { providerOptions: mergedOptions } : {}),
  };

  try {
    return await generateText(baseParams);
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error)) {
      throw error;
    }

    let lastError = error.message;
    let partialText = error.text ?? '';

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const validation = validateAndRepair(partialText, outputSchema);
      if (validation.valid && outputSchema) {
        return {
          ...error,
          text: validation.text,
          output: outputSchema.parse(JSON.parse(validation.text)),
        } as unknown as Awaited<ReturnType<typeof generateText>>;
      }

      lastError = validation.error ?? lastError;

      const retryParams = {
        ...(baseParams as GenerateTextParams),
        prompt: `${getPromptText(generateParams.prompt)}\n\n${buildRepairFeedback(lastError, partialText, { includePartial: includePartialInRetry })}`,
      } as GenerateTextParams;

      const retry = await generateText(retryParams);

      if ('output' in retry && retry.output !== undefined) {
        return retry;
      }

      partialText = retry.text;
    }

    throw new ShieldRepairError({
      partialText,
      attempts,
      lastError,
      usage: normalizeUsageCounts(error.usage),
    });
  }
}

export function shieldStreamText(
  params: Parameters<typeof streamText>[0] & {
    model: LanguageModel;
    outputSchema?: z.ZodType;
  },
): ReturnType<typeof streamText> {
  const { outputSchema, ...streamParams } = params;
  const mergedOptions = mergeShieldProviderOptions(streamParams.providerOptions, {
    ...(outputSchema ? { outputSchema } : {}),
  });

  return streamText({
    ...streamParams,
    ...(mergedOptions ? { providerOptions: mergedOptions } : {}),
  });
}
