#!/usr/bin/env node
/**
 * Compare the lockfile-pinned `ai` devDependency with npm latest.
 * Also reports the resolved `@ai-sdk/provider` version (direct import in src/).
 *
 * Used locally (`npm run check:ai-sdk`) and in CI (AI SDK Compatibility workflow).
 */
import { appendFileSync, readFileSync } from 'node:fs';

const AI_PACKAGE = 'ai';
const PROVIDER_PACKAGE = '@ai-sdk/provider';

function sanitizeSemver(version, label) {
  if (
    typeof version !== 'string' ||
    !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]*)?$/.test(version)
  ) {
    throw new Error(
      `Refusing untrusted ${label} version for output: ${String(version)}`,
    );
  }
  return version;
}

function sanitizeRange(range, label) {
  const value = String(range ?? '');
  if (!value) {
    return '';
  }
  if (value.length > 32 || !/^[\d\s.+^~>=<*-]+$/.test(value)) {
    throw new Error(`Refusing untrusted ${label} range for output: ${value}`);
  }
  return value;
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Unrecognized semver: ${version}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function isOlderThan(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}

function readLockedVersion(pkg) {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const entry = lock.packages?.[`node_modules/${pkg}`];
  if (entry?.version) {
    return entry.version;
  }
  throw new Error(`No locked version for ${pkg} in package-lock.json`);
}

function tryReadLockedVersion(pkg) {
  try {
    return readLockedVersion(pkg);
  } catch {
    return null;
  }
}

function readPeerRange() {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
  return manifest.peerDependencies?.[AI_PACKAGE] ?? '';
}

function readDeclaredDevRange() {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
  return manifest.devDependencies?.[AI_PACKAGE] ?? '';
}

async function fetchLatestVersion(pkg) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`,
    {
      headers: { accept: 'application/json' },
    },
  );
  if (!response.ok) {
    throw new Error(`npm registry responded with ${response.status} for ${pkg}`);
  }
  const data = await response.json();
  return sanitizeSemver(data.version, pkg);
}

function buildReport(locked, latest, peer, declared, providerLocked, providerLatest) {
  const drift = isOlderThan(locked, latest);
  const providerDrift =
    providerLocked && providerLatest
      ? isOlderThan(providerLocked, providerLatest)
      : false;

  return {
    package: AI_PACKAGE,
    locked,
    latest,
    peer,
    declared,
    drift,
    upToDate: !drift,
    provider: {
      package: PROVIDER_PACKAGE,
      locked: providerLocked,
      latest: providerLatest,
      drift: providerDrift,
    },
  };
}

function writeGithubOutput(report) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;

  const locked = sanitizeSemver(report.locked, 'locked');
  const latest = sanitizeSemver(report.latest, 'latest');
  const peer = sanitizeRange(report.peer, 'peer');
  const providerLocked = report.provider.locked
    ? sanitizeSemver(report.provider.locked, 'provider_locked')
    : '';
  const providerLatest = report.provider.latest
    ? sanitizeSemver(report.provider.latest, 'provider_latest')
    : '';

  appendFileSync(
    file,
    [
      `locked=${locked}`,
      `latest=${latest}`,
      `drift=${report.drift}`,
      `peer=${peer}`,
      `provider_locked=${providerLocked}`,
      `provider_latest=${providerLatest}`,
    ].join('\n') + '\n',
  );
}

function writeGithubSummary(report) {
  const locked = sanitizeSemver(report.locked, 'locked');
  const latest = sanitizeSemver(report.latest, 'latest');
  const declared = sanitizeRange(report.declared, 'declared');
  const peer = sanitizeRange(report.peer, 'peer');
  const providerLocked =
    report.provider.locked != null
      ? sanitizeSemver(report.provider.locked, 'provider_locked')
      : null;
  const providerLatest =
    report.provider.latest != null
      ? sanitizeSemver(report.provider.latest, 'provider_latest')
      : null;

  const providerRow =
    providerLocked != null
      ? `| \`@ai-sdk/provider\` (lockfile) | \`${providerLocked}\` |`
      : '';
  const providerLatestRow =
    providerLatest != null
      ? `| \`@ai-sdk/provider\` (npm latest) | \`${providerLatest}\` |`
      : '';

  const lines = [
    '## Vercel AI SDK compatibility',
    '',
    '| | Version |',
    '|---|---|',
    `| \`ai\` lockfile (dev) | \`${locked}\` |`,
    `| \`ai\` npm latest | \`${latest}\` |`,
    providerRow,
    providerLatestRow,
    `| package.json range | \`${declared}\` |`,
    `| Peer range | \`${peer}\` |`,
    `| \`ai\` drift | ${report.drift ? '**yes** — merge Dependabot or `npm install ai@latest --save-dev`' : 'no'} |`,
    '',
    'shieldkit requires **AI SDK v6** (`LanguageModelV3`). The compatibility workflow runs typecheck, tests, and build against both the lockfile pin and `ai@latest`.',
    '',
    'Docs: [dependency policy](../../docs/contributing/dependency-policy.md) · [CI and automation](../../docs/contributing/ci-and-automation.md)',
    '',
  ].filter(Boolean);

  const markdown = lines.join('\n');
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) {
    appendFileSync(file, markdown);
  } else {
    console.log(markdown);
  }
}

async function main() {
  const locked = readLockedVersion(AI_PACKAGE);
  const latest = await fetchLatestVersion(AI_PACKAGE);
  const peer = readPeerRange();
  const declared = readDeclaredDevRange();
  const providerLocked = tryReadLockedVersion(PROVIDER_PACKAGE);
  let providerLatest = null;
  try {
    providerLatest = await fetchLatestVersion(PROVIDER_PACKAGE);
  } catch {
    // Optional — provider is transitive; registry lookup may fail offline
  }

  const report = buildReport(
    locked,
    latest,
    peer,
    declared,
    providerLocked,
    providerLatest,
  );

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  if (process.argv.includes('--github-output')) {
    writeGithubOutput(report);
    return;
  }

  if (process.argv.includes('--github-summary')) {
    writeGithubSummary(report);
    return;
  }

  console.log(`ai locked:           ${report.locked}`);
  console.log(`ai latest:           ${report.latest}`);
  if (report.provider.locked) {
    console.log(`@ai-sdk/provider:    ${report.provider.locked}`);
  }
  if (report.provider.latest) {
    console.log(`provider latest:     ${report.provider.latest}`);
  }
  console.log(`declared:            ${report.declared}`);
  console.log(`peer range:          ${report.peer}`);

  if (report.drift) {
    console.log(`\nUpdate available: ${report.locked} → ${report.latest}`);
    if (process.argv.includes('--strict')) {
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
