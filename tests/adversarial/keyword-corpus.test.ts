import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';

import { keywordGuard } from '../../src/guards/keywords.js';
import { ShieldBlockedError } from '../../src/errors.js';
import { shield } from '../../src/shield.js';
import { loadFixtures } from '../helpers/load-adversarial-fixtures.js';
import { createMockModel } from '../helpers/mock-model.js';

const fixtures = loadFixtures('keywords');

describe('adversarial keyword corpus', () => {
  it.each(fixtures)('$id keywordGuard unit', (fixture) => {
    const result = keywordGuard(fixture.prompt!, {
      deny: fixture.deny ?? [],
      action: 'block',
    });
    if (fixture.modes?.strict === 'expect_block') {
      expect(result.triggered).toBe(true);
    }
    if (fixture.modes?.strict === 'expect_allow') {
      expect(result.triggered).toBe(false);
    }
  });

  it.each(fixtures)('$id input keyword middleware integration', async (fixture) => {
    const model = createMockModel({ text: 'ok' });
    const safeModel = shield(model, {
      mode: 'custom',
      guardrails: {
        input: {
          injection: { enabled: false },
          pii: { enabled: false },
          keywords: { enabled: true, deny: fixture.deny ?? [], action: 'block' },
        },
      },
      audit: { console: false },
    });

    const run = generateText({
      model: safeModel,
      prompt: fixture.prompt!,
      providerOptions: { aiShield: { sessionId: 'kw-corpus' } },
    });

    if (fixture.modes?.strict === 'expect_block') {
      await expect(run).rejects.toBeInstanceOf(ShieldBlockedError);
    } else {
      await expect(run).resolves.toBeDefined();
    }
  });
});
