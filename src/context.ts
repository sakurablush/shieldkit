import type { RequestContext, SessionState, ShieldProviderOptions } from './types.js';
import { createRequestId } from './utils/prompt.js';

const DEFAULT_SESSION = 'default';

export const sessionStore = new Map<string, SessionState>();

export function createShieldContext(sessionId = DEFAULT_SESSION): SessionState {
  const state: SessionState = {
    sessionId,
    totalCostUsd: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    requestCount: 0,
    budgetExceeded: false,
  };
  sessionStore.set(sessionId, state);
  return state;
}

export function getOrCreateSession(sessionId = DEFAULT_SESSION): SessionState {
  const existing = sessionStore.get(sessionId);
  if (existing) {
    return existing;
  }
  return createShieldContext(sessionId);
}

export function resetSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export function createRequestContext(options: ShieldProviderOptions): RequestContext {
  return {
    sessionId: options.sessionId ?? DEFAULT_SESSION,
    userId: options.userId,
    requestId: options.requestId ?? createRequestId(),
    toolCallCounts: {},
    approved: options.approved ?? false,
    metadata: options.metadata,
    outputSchema: options.outputSchema,
  };
}

export function recordSessionUsage(
  sessionId: string,
  usage: { inputTokens: number; outputTokens: number; costUsd: number },
): SessionState {
  const session = getOrCreateSession(sessionId);
  session.totalInputTokens += usage.inputTokens;
  session.totalOutputTokens += usage.outputTokens;
  session.totalCostUsd += usage.costUsd;
  session.requestCount += 1;
  sessionStore.set(sessionId, session);
  return session;
}
