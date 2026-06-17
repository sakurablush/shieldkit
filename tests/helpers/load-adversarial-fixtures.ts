import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ModeExpectation =
  | 'expect_block'
  | 'expect_warn_or_allow'
  | 'expect_allow'
  | 'expect_redact'
  | 'accepted_bypass';

export interface AdversarialFixture {
  id: string;
  category: string;
  prompt?: string;
  output?: string;
  modes?: Partial<Record<'strict' | 'balanced' | 'local', ModeExpectation>>;
  tags?: string[];
  deny?: string[];
  toolName?: string;
  schema?: { valid: boolean };
}

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '../fixtures/adversarial',
);

export function loadFixtures(category: string): AdversarialFixture[] {
  const file = join(fixturesDir, `${category}.json`);
  const raw = JSON.parse(readFileSync(file, 'utf8')) as AdversarialFixture[];
  return raw;
}

export function loadAllFixtureCategories(): string[] {
  return readdirSync(fixturesDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''));
}
