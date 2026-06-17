import { ShieldBlockedError } from '../errors.js';
import { keywordGuard, piiGuard } from '../guards/index.js';
import type { GuardResult, ShieldRuntime } from '../types.js';
import { replaceTextInContent } from './prompt.js';

export function applyOutputTextGuards(options: {
  text: string;
  outputConfig: ShieldRuntime['config']['guardrails']['output'];
  emitAudit: ShieldRuntime['emitAudit'];
  shieldOptions: {
    sessionId?: string;
    userId?: string;
    requestId?: string;
  };
  modelId: string;
}): string {
  let nextText = options.text;

  if (options.outputConfig.pii.enabled) {
    nextText = applyGuardToText({
      ...options,
      text: nextText,
      guardResult: piiGuard(nextText, { action: options.outputConfig.pii.action }),
      phase: 'output',
      guardName: 'pii',
    });
  }

  if (
    options.outputConfig.keywords.enabled &&
    options.outputConfig.keywords.deny.length > 0
  ) {
    nextText = applyGuardToText({
      ...options,
      text: nextText,
      guardResult: keywordGuard(nextText, {
        deny: options.outputConfig.keywords.deny,
        action: options.outputConfig.keywords.action,
      }),
      phase: 'output',
      guardName: 'keywords',
    });
  }

  return nextText;
}

function applyGuardToText(options: {
  text: string;
  guardResult: GuardResult;
  phase: string;
  guardName: string;
  outputConfig: ShieldRuntime['config']['guardrails']['output'];
  emitAudit: ShieldRuntime['emitAudit'];
  shieldOptions: { sessionId?: string; userId?: string; requestId?: string };
  modelId: string;
}): string {
  const { guardResult } = options;
  if (!guardResult.triggered) {
    return options.text;
  }

  options.emitAudit({
    type: 'guard.triggered',
    sessionId: options.shieldOptions.sessionId,
    userId: options.shieldOptions.userId,
    requestId: options.shieldOptions.requestId,
    modelId: options.modelId,
    details: {
      phase: options.phase,
      guard: guardResult.guard,
      action: guardResult.action,
      summary: guardResult.summary,
    },
  });

  if (guardResult.action === 'block') {
    throw new ShieldBlockedError({
      guard: options.guardName,
      summary: guardResult.summary ?? `${options.phase} guard triggered`,
    });
  }

  return guardResult.modifiedText ?? options.text;
}

export type OutputGuardContext = Omit<
  Parameters<typeof applyOutputTextGuards>[0],
  'text'
>;

export function applyOutputGuardsToGenerateResult<
  T extends { content: Array<{ type: string; text?: string }> },
>(result: T, options: OutputGuardContext): T {
  const rawText = result.content
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
  const nextText = applyOutputTextGuards({ ...options, text: rawText });

  if (nextText === rawText) {
    return result;
  }

  return {
    ...result,
    content: replaceTextInContent(result.content, nextText),
  };
}
