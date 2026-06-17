import type { LanguageModelV3Usage } from '@ai-sdk/provider';

export function getInputTokenCount(usage?: LanguageModelV3Usage): number {
  return usage?.inputTokens.total ?? 0;
}

export function getOutputTokenCount(usage?: LanguageModelV3Usage): number {
  return usage?.outputTokens.total ?? 0;
}

export function getTotalTokenCount(usage?: LanguageModelV3Usage): number {
  return getInputTokenCount(usage) + getOutputTokenCount(usage);
}

export function createEmptyUsage(): LanguageModelV3Usage {
  return {
    inputTokens: {
      total: 0,
      noCache: undefined,
      cacheRead: undefined,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: 0,
      text: undefined,
      reasoning: undefined,
    },
  };
}

export function createUsageFromCounts(
  inputTokens: number,
  outputTokens: number,
): LanguageModelV3Usage {
  return {
    inputTokens: {
      total: inputTokens,
      noCache: inputTokens,
      cacheRead: undefined,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: outputTokens,
      text: outputTokens,
      reasoning: undefined,
    },
  };
}

export function mergeUsage(
  ...usages: Array<LanguageModelV3Usage | undefined>
): LanguageModelV3Usage {
  let inputTokens = 0;
  let outputTokens = 0;

  for (const usage of usages) {
    inputTokens += getInputTokenCount(usage);
    outputTokens += getOutputTokenCount(usage);
  }

  return createUsageFromCounts(inputTokens, outputTokens);
}

export function normalizeUsageCounts(usage?: {
  inputTokens?: number | { total?: number };
  outputTokens?: number | { total?: number };
}): { inputTokens: number; outputTokens: number } {
  if (!usage) {
    return { inputTokens: 0, outputTokens: 0 };
  }

  const input =
    typeof usage.inputTokens === 'number'
      ? usage.inputTokens
      : (usage.inputTokens?.total ?? 0);
  const output =
    typeof usage.outputTokens === 'number'
      ? usage.outputTokens
      : (usage.outputTokens?.total ?? 0);

  return { inputTokens: input, outputTokens: output };
}

export const stopFinishReason = {
  unified: 'stop',
  raw: 'stop',
} as const;
