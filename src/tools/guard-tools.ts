import type { Tool, ToolExecutionOptions } from '@ai-sdk/provider-utils';

import { createRequestContext } from '../context.js';
import { ShieldToolError } from '../errors.js';
import type { AuditLog, ToolGuardOptions } from '../types.js';

type ToolRecord = Record<string, Tool>;

function hasToolApproval(execOptions?: ToolExecutionOptions): boolean {
  const ctx = execOptions?.experimental_context;
  if (!ctx || typeof ctx !== 'object' || Array.isArray(ctx)) {
    return false;
  }

  const record = ctx as Record<string, unknown>;
  if (record.approved === true) {
    return true;
  }

  const aiShield = record.aiShield;
  if (aiShield && typeof aiShield === 'object' && !Array.isArray(aiShield)) {
    return (aiShield as Record<string, unknown>).approved === true;
  }

  return false;
}

export function guardTools<T extends ToolRecord>(
  tools: T,
  options: ToolGuardOptions = {},
): T {
  const requestContext = createRequestContext({
    sessionId: options.sessionId,
    requestId: options.requestId,
    userId: options.userId,
  });

  const emit = (
    log: Omit<AuditLog, 'timestamp' | 'requestId' | 'sessionId' | 'userId'>,
  ) => {
    const enriched: AuditLog = {
      ...log,
      timestamp: new Date().toISOString(),
      requestId: requestContext.requestId,
      sessionId: requestContext.sessionId,
      userId: options.userId,
    };

    if (options.auditSink) {
      void Promise.resolve(options.auditSink(enriched)).catch(() => undefined);
    }
  };

  const wrappedEntries = Object.entries(tools).map(([name, toolDef]) => {
    if (!toolDef.execute) {
      return [name, toolDef] as const;
    }

    const wrapped: Tool = {
      ...toolDef,
      execute: async (input, execOptions) => {
        if (
          options.allow &&
          options.allow.length > 0 &&
          !options.allow.includes(name)
        ) {
          const reason = 'Tool not in allow list';
          options.onBlocked?.(name, reason);
          emit({
            type: 'tool.blocked',
            details: { toolName: name, reason },
          });
          throw new ShieldToolError({ toolName: name, reason });
        }

        if (options.deny?.includes(name)) {
          const reason = 'Tool is denied';
          options.onBlocked?.(name, reason);
          emit({
            type: 'tool.blocked',
            details: { toolName: name, reason },
          });
          throw new ShieldToolError({ toolName: name, reason });
        }

        if (options.requireApproval && !hasToolApproval(execOptions)) {
          const reason = 'Tool requires approval';
          options.onBlocked?.(name, reason);
          emit({
            type: 'tool.blocked',
            details: { toolName: name, reason },
          });
          throw new ShieldToolError({ toolName: name, reason });
        }

        requestContext.toolCallCounts[name] =
          (requestContext.toolCallCounts[name] ?? 0) + 1;
        if (
          options.maxCallsPerRequest !== undefined &&
          requestContext.toolCallCounts[name] > options.maxCallsPerRequest
        ) {
          const reason = `Max calls exceeded (${options.maxCallsPerRequest})`;
          options.onBlocked?.(name, reason);
          emit({
            type: 'tool.blocked',
            details: { toolName: name, reason },
          });
          throw new ShieldToolError({ toolName: name, reason });
        }

        emit({
          type: 'tool.executed',
          details: { toolName: name },
        });

        return await toolDef.execute!(input, execOptions);
      },
    };

    return [name, wrapped] as const;
  });

  return Object.fromEntries(wrappedEntries) as T;
}
