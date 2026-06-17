import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = 'scripts/extract-changelog-section.mjs';

function runExtract(version: string, extraArgs: string[] = []): string {
  return execFileSync('node', [script, version, ...extraArgs], {
    encoding: 'utf8',
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

describe('extract-changelog-section.mjs', () => {
  it('prints the section body for an existing release', () => {
    const out = runExtract('0.2.0', ['--stdout']);
    expect(out).toContain('### Added');
    expect(out).toContain('normalizeGuardText');
    expect(out).not.toMatch(/^## \[/m);
  });

  it('accepts a leading v prefix', () => {
    const out = runExtract('v0.2.0', ['--stdout']);
    expect(out).toContain('normalizeGuardText');
  });

  it('exits non-zero when the section is missing', () => {
    expect(() => runExtract('99.99.99', ['--stdout'])).toThrow();
  });

  it('exits non-zero for an invalid version argument', () => {
    expect(() => runExtract('not-a-version', ['--stdout'])).toThrow();
  });
});
