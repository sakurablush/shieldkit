import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ContrastResult } from './contrast-harness.js';

const outDir = join(process.cwd(), 'test-results');

export function writeContrastReport(results: ContrastResult[]): void {
  mkdirSync(outDir, { recursive: true });

  const blocked = results.filter((r) => r.shielded.outcome === 'blocked').length;
  const rawInvokedWhenBlocked = results.filter(
    (r) => r.shielded.outcome === 'blocked' && r.raw.modelInvoked,
  ).length;

  writeFileSync(
    join(outDir, 'contrast-report.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary: {
          cases: results.length,
          shieldBlocked: blocked,
          rawReachedModelWhenShieldBlocked: rawInvokedWhenBlocked,
        },
        results,
      },
      null,
      2,
    ),
    'utf8',
  );
}

export function writeAdversarialSummary(summary: Record<string, unknown>): void {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, 'adversarial-summary.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), ...summary }, null, 2),
    'utf8',
  );
}
