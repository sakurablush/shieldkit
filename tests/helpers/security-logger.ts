import type { ContrastResult } from './contrast-harness.js';
import { isTestVerbose, logTest } from './test-logger.js';

const verbose = isTestVerbose();

export function logContrast(result: ContrastResult): void {
  const audit =
    result.shielded.auditEvents.length > 0
      ? result.shielded.auditEvents.map((e) => e.type).join(' -> ')
      : 'none';

  const line = `${result.fixtureId} | ${result.mode} | RAW: ${result.raw.outcome}${result.raw.modelInvoked ? ' (invoked)' : ''} | SHIELD: ${result.shielded.outcome}${result.shielded.modelInvoked ? ' (invoked)' : ''} | audit: ${audit} | ${result.delta}`;

  if (verbose) {
    logTest('contrast', line, result);
  }
}

export function logRedteam(line: string): void {
  if (verbose) {
    logTest('redteam', line);
  }
}
