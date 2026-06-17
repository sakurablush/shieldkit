import type { LanguageModelV3Middleware } from '@ai-sdk/provider';

import { ShieldBlockedError } from '../errors.js';
import { injectionGuard, keywordGuard, piiGuard } from '../guards/index.js';
import type { GuardResult, ShieldRuntime } from '../types.js';
import {
  extractPromptText,
  getShieldProviderOptions,
  redactPromptPii,
} from '../utils/prompt.js';

export function createInputGuardrailMiddleware(
  runtime: ShieldRuntime,
): LanguageModelV3Middleware {
  const { config, emitAudit } = runtime;
  const inputConfig = config.guardrails.input;

  return {
    specificationVersion: 'v3',
    transformParams: ({ params, model }) => {
      const shieldOptions = getShieldProviderOptions(params.providerOptions);
      const promptText = extractPromptText(params.prompt);
      let nextPrompt = params.prompt;
      const results: GuardResult[] = [];

      if (inputConfig.injection.enabled) {
        const result = injectionGuard(promptText, {
          threshold: inputConfig.injection.threshold,
          action: inputConfig.injection.action,
        });
        results.push(result);
      }

      if (inputConfig.pii.enabled) {
        const result = piiGuard(promptText, { action: inputConfig.pii.action });
        results.push(result);
        if (
          result.triggered &&
          result.modifiedText &&
          inputConfig.pii.action === 'redact'
        ) {
          nextPrompt = redactPromptPii(nextPrompt);
        }
      }

      if (inputConfig.keywords.enabled && inputConfig.keywords.deny.length > 0) {
        const result = keywordGuard(promptText, {
          deny: inputConfig.keywords.deny,
          action: inputConfig.keywords.action,
        });
        results.push(result);
      }

      for (const result of results) {
        if (!result.triggered) {
          continue;
        }

        emitAudit({
          type: 'guard.triggered',
          sessionId: shieldOptions.sessionId,
          userId: shieldOptions.userId,
          requestId: shieldOptions.requestId,
          modelId: model.modelId,
          details: {
            phase: 'input',
            guard: result.guard,
            action: result.action,
            summary: result.summary,
          },
        });

        if (result.action === 'block') {
          emitAudit({
            type: 'request.blocked',
            sessionId: shieldOptions.sessionId,
            userId: shieldOptions.userId,
            requestId: shieldOptions.requestId,
            modelId: model.modelId,
            details: { guard: result.guard, summary: result.summary },
          });
          throw new ShieldBlockedError({
            guard: result.guard,
            summary: result.summary ?? 'input guard triggered',
          });
        }
      }

      if (nextPrompt !== params.prompt) {
        return Promise.resolve({ ...params, prompt: nextPrompt });
      }

      return Promise.resolve(params);
    },
  };
}
