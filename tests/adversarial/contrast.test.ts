import { afterAll, describe, expect, it } from 'vitest';

import { loadFixtures } from '../helpers/load-adversarial-fixtures.js';
import { runContrast } from '../helpers/contrast-harness.js';
import { logContrast } from '../helpers/security-logger.js';
import { writeContrastReport } from '../helpers/write-contrast-report.js';

const injectionFixtures = loadFixtures('injection').filter(
  (f) => f.tags?.includes('canonical') || f.tags?.includes('benign'),
);

const results: Awaited<ReturnType<typeof runContrast>>[] = [];

describe('contrast harness', () => {
  it.each(injectionFixtures)('$id RAW vs SHIELDED strict', async (fixture) => {
    const result = await runContrast({
      fixtureId: fixture.id,
      prompt: fixture.prompt!,
      mode: 'strict',
    });

    logContrast(result);
    results.push(result);

    if (fixture.modes?.strict === 'expect_block') {
      expect(result.shielded.outcome).toBe('blocked');
      expect(result.shielded.modelInvoked).toBe(false);
      expect(result.raw.outcome).toBe('ok');
      expect(result.raw.modelInvoked).toBe(true);
      expect(result.delta).toContain('Shield blocked');
    }
    if (fixture.modes?.strict === 'expect_allow') {
      expect(result.shielded.outcome).toBe('ok');
      expect(result.raw.outcome).toBe('ok');
    }
  });

  afterAll(() => {
    writeContrastReport(results);
  });
});
