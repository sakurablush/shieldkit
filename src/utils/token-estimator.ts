import type { LanguageModelV3Prompt } from '@ai-sdk/provider';

import { extractPromptText } from './prompt.js';

/** Approximate characters per token for common models (used for pre-call budget estimates). */
const MODEL_CHARS_PER_TOKEN: Record<string, number> = {
  'gpt-4o': 3.5,
  'gpt-4o-mini': 4,
  'gpt-4.1': 3.5,
  'gpt-4.1-mini': 4,
  'gpt-4.1-nano': 4,
  'claude-3-5-sonnet-latest': 3.5,
  'claude-sonnet-4-20250514': 3.5,
  'gemini-2.0-flash': 4,
  'gemini-2.5-pro': 3.5,
  'llama3.2': 4,
  'llama3.1': 4,
  'llama3.2:latest': 4,
  'mistral-small': 4,
};

const DEFAULT_CHARS_PER_TOKEN = 4;

function resolveCharsPerToken(modelId?: string): number {
  if (!modelId) {
    return DEFAULT_CHARS_PER_TOKEN;
  }

  const direct = MODEL_CHARS_PER_TOKEN[modelId];
  if (direct !== undefined) {
    return direct;
  }

  const shortId = modelId.split('/').pop() ?? modelId;
  const shortMatch = MODEL_CHARS_PER_TOKEN[shortId];
  if (shortMatch !== undefined) {
    return shortMatch;
  }

  const normalized = shortId.split(':')[0] ?? shortId;
  const normalizedMatch = MODEL_CHARS_PER_TOKEN[normalized];
  if (normalizedMatch !== undefined) {
    return normalizedMatch;
  }

  return DEFAULT_CHARS_PER_TOKEN;
}

export function estimateTokensFromPrompt(
  prompt: LanguageModelV3Prompt,
  modelId?: string,
): number {
  const text = extractPromptText(prompt);
  return estimateTokensFromText(text, modelId);
}

export function estimateTokensFromText(text: string, modelId?: string): number {
  if (!text) {
    return 0;
  }

  const charsPerToken = resolveCharsPerToken(modelId);
  return Math.max(1, Math.ceil(text.length / charsPerToken));
}

export function estimateCostUsd(options: {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  pricing: Record<string, { inputPer1M?: number; outputPer1M?: number }>;
  defaultPricing: { inputPer1M?: number; outputPer1M?: number };
}): number {
  const pricing =
    options.pricing[options.modelId] ??
    options.pricing[options.modelId.split('/').pop() ?? ''] ??
    options.defaultPricing;

  const inputRate = pricing.inputPer1M ?? 0;
  const outputRate = pricing.outputPer1M ?? 0;

  return (
    (options.inputTokens / 1_000_000) * inputRate +
    (options.outputTokens / 1_000_000) * outputRate
  );
}

export { resolveCharsPerToken };
