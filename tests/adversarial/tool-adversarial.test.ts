import { tool } from 'ai';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ShieldToolError } from '../../src/errors.js';
import { guardTools } from '../../src/tools/guard-tools.js';
import { loadFixtures } from '../helpers/load-adversarial-fixtures.js';

const fixtures = loadFixtures('tools');

const baseTools = {
  allowed: tool({
    description: 'Allowed',
    inputSchema: z.object({ value: z.string() }),
    execute: async ({ value }) => ({ echo: value }),
  }),
  denied: tool({
    description: 'Denied',
    inputSchema: z.object({ value: z.string() }),
    execute: async () => ({ ok: true }),
  }),
};

describe('adversarial tool policies', () => {
  it.each(fixtures)('$id tool guard', async (fixture) => {
    const guarded = guardTools(baseTools, {
      allow: ['allowed'],
      deny: ['denied'],
      maxCallsPerRequest: 2,
      requestId: 'tool-adv',
    });

    const name = fixture.toolName as 'allowed' | 'denied';
    const run = guarded[name].execute!({ value: 'x' });

    if (fixture.modes?.strict === 'expect_block') {
      await expect(run).rejects.toBeInstanceOf(ShieldToolError);
    } else {
      await expect(run).resolves.toBeDefined();
    }
  });

  it('blocks third call when maxCallsPerRequest is 2', async () => {
    const guarded = guardTools(baseTools, {
      allow: ['allowed'],
      maxCallsPerRequest: 2,
    });

    await guarded.allowed.execute!({ value: '1' });
    await guarded.allowed.execute!({ value: '2' });
    await expect(guarded.allowed.execute!({ value: '3' })).rejects.toBeInstanceOf(
      ShieldToolError,
    );
  });
});
