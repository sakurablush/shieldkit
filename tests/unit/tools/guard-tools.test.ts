import { tool } from 'ai';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ShieldToolError } from '../../../src/errors.js';
import { guardTools } from '../../../src/tools/guard-tools.js';

describe('guardTools', () => {
  const tools = {
    allowed: tool({
      description: 'Allowed tool',
      inputSchema: z.object({ value: z.string() }),
      execute: async ({ value }) => ({ echo: value }),
    }),
    denied: tool({
      description: 'Denied tool',
      inputSchema: z.object({ value: z.string() }),
      execute: async () => ({ ok: true }),
    }),
  };

  it('blocks denied tools', async () => {
    const guarded = guardTools(tools, { deny: ['denied'] });

    await expect(guarded.denied.execute!({ value: 'x' })).rejects.toBeInstanceOf(
      ShieldToolError,
    );
  });

  it('allows permitted tools', async () => {
    const guarded = guardTools(tools, { allow: ['allowed'] });
    const result = await guarded.allowed.execute?.({ value: 'hello' });
    expect(result).toEqual({ echo: 'hello' });
  });

  it('enforces maxCallsPerRequest', async () => {
    const guarded = guardTools(tools, {
      allow: ['allowed'],
      maxCallsPerRequest: 1,
    });

    await guarded.allowed.execute?.({ value: 'one' });
    await expect(guarded.allowed.execute!({ value: 'two' })).rejects.toBeInstanceOf(
      ShieldToolError,
    );
  });

  it('blocks tools when requireApproval is set without approval context', async () => {
    const guarded = guardTools(tools, {
      allow: ['allowed'],
      requireApproval: true,
    });

    await expect(guarded.allowed.execute!({ value: 'x' })).rejects.toBeInstanceOf(
      ShieldToolError,
    );
  });

  it('allows tools when requireApproval and experimental_context.approved is true', async () => {
    const guarded = guardTools(tools, {
      allow: ['allowed'],
      requireApproval: true,
    });

    const result = await guarded.allowed.execute?.(
      { value: 'approved' },
      { toolCallId: 'call-1', messages: [], experimental_context: { approved: true } },
    );

    expect(result).toEqual({ echo: 'approved' });
  });

  it('uses a shared requestId for all tool audit events', async () => {
    const auditLogs: Array<{ type: string; requestId?: string }> = [];
    const guarded = guardTools(tools, {
      allow: ['allowed'],
      requestId: 'shared-req-1',
      auditSink: (log) => {
        auditLogs.push(log);
      },
    });

    await guarded.allowed.execute?.(
      { value: 'one' },
      { toolCallId: 'call-1', messages: [] },
    );
    await guarded.allowed.execute?.(
      { value: 'two' },
      { toolCallId: 'call-2', messages: [] },
    );

    expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    expect(auditLogs.every((log) => log.requestId === 'shared-req-1')).toBe(true);
  });
});

describe('guardTools integration shape', () => {
  it('preserves tool record keys', () => {
    const tools = {
      search: tool({
        description: 'Search',
        inputSchema: z.object({ q: z.string() }),
      }),
    };

    const guarded = guardTools(tools);
    expect(Object.keys(guarded)).toEqual(['search']);
  });
});
