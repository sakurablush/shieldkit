import { AISDKError } from '@ai-sdk/provider';

export class ShieldBlockedError extends AISDKError {
  readonly guard: string;
  readonly summary: string;

  constructor(options: { guard: string; summary: string; message?: string }) {
    super({
      name: 'ShieldBlockedError',
      message: options.message ?? `Blocked by ${options.guard}: ${options.summary}`,
    });
    this.guard = options.guard;
    this.summary = options.summary;
  }
}

export class ShieldBudgetError extends AISDKError {
  readonly sessionId: string;
  readonly totalCostUsd: number;
  readonly maxCostUsd: number;

  constructor(options: {
    sessionId: string;
    totalCostUsd: number;
    maxCostUsd: number;
  }) {
    super({
      name: 'ShieldBudgetError',
      message: `Session ${options.sessionId} exceeded budget: $${options.totalCostUsd.toFixed(6)} / $${options.maxCostUsd.toFixed(6)}`,
    });
    this.sessionId = options.sessionId;
    this.totalCostUsd = options.totalCostUsd;
    this.maxCostUsd = options.maxCostUsd;
  }
}

export class ShieldRepairError extends AISDKError {
  readonly partialText: string;
  readonly attempts: number;
  readonly lastError: string;
  readonly usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };

  constructor(options: {
    partialText: string;
    attempts: number;
    lastError: string;
    usage?: ShieldRepairError['usage'];
    message?: string;
  }) {
    super({
      name: 'ShieldRepairError',
      message:
        options.message ??
        `Structured output repair failed after ${options.attempts} attempt(s): ${options.lastError}`,
    });
    this.partialText = options.partialText;
    this.attempts = options.attempts;
    this.lastError = options.lastError;
    this.usage = options.usage;
  }
}

export class ShieldToolError extends AISDKError {
  readonly toolName: string;
  readonly reason: string;

  constructor(options: { toolName: string; reason: string }) {
    super({
      name: 'ShieldToolError',
      message: `Tool "${options.toolName}" blocked: ${options.reason}`,
    });
    this.toolName = options.toolName;
    this.reason = options.reason;
  }
}
