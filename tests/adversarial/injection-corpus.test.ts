import { generateText } from 'ai';
import { describe, expect, it } from 'vitest';

import { injectionGuard } from '../../src/guards/injection.js';
import { ShieldBlockedError } from '../../src/errors.js';
import { shield } from '../../src/shield.js';
import {
  loadFixtures,
  type AdversarialFixture,
  type ModeExpectation,
} from '../helpers/load-adversarial-fixtures.js';
import { createMockModel } from '../helpers/mock-model.js';

const fixtures = loadFixtures('injection');

async function middlewareOutcome(
  prompt: string,
  mode: 'strict' | 'balanced' | 'local',
): Promise<'blocked' | 'ok'> {
  const model = createMockModel({ text: 'ok' });
  const safeModel = shield(model, { mode, audit: { console: false } });
  try {
    await generateText({
      model: safeModel,
      prompt,
      providerOptions: { aiShield: { sessionId: 'inj-corpus' } },
    });
    return 'ok';
  } catch (error) {
    if (error instanceof ShieldBlockedError) return 'blocked';
    throw error;
  }
}

function guardTriggered(prompt: string, threshold: number): boolean {
  return injectionGuard(prompt, { threshold, action: 'block' }).triggered;
}

function expectGuard(
  fixture: AdversarialFixture,
  mode: 'strict' | 'balanced' | 'local',
  expectation: ModeExpectation | undefined,
): void {
  if (!expectation || expectation === 'accepted_bypass') return;

  const thresholds = { strict: 0.4, balanced: 0.5, local: 0.6 };
  const guardBlocks = guardTriggered(fixture.prompt!, thresholds[mode]);

  if (expectation === 'expect_block') {
    expect(guardBlocks).toBe(true);
  }
  if (expectation === 'expect_allow') {
    expect(guardBlocks).toBe(false);
  }
}

describe('adversarial injection corpus', () => {
  it.each(fixtures)('$id guard unit matches expectation', (fixture) => {
    for (const mode of ['strict', 'balanced', 'local'] as const) {
      expectGuard(fixture, mode, fixture.modes?.[mode]);
    }
  });

  it.each(fixtures.filter((f) => f.modes?.strict === 'accepted_bypass'))(
    '$id documents known bypass (no guard trigger)',
    (fixture) => {
      expect(guardTriggered(fixture.prompt!, 0.4)).toBe(false);
    },
  );

  it.each(
    fixtures.filter((f) => f.tags?.includes('canonical') || f.tags?.includes('benign')),
  )('$id middleware strict vs local', async (fixture) => {
    const strict = await middlewareOutcome(fixture.prompt!, 'strict');
    const local = await middlewareOutcome(fixture.prompt!, 'local');

    if (fixture.modes?.strict === 'expect_block') {
      expect(strict).toBe('blocked');
    }
    if (fixture.modes?.local === 'expect_warn_or_allow') {
      expect(local).toBe('ok');
    }
    if (fixture.modes?.strict === 'expect_allow') {
      expect(strict).toBe('ok');
    }
  });
});
