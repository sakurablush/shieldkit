---
name: ai-shield-contributing
description: Guides shieldkit library development — npm run ci gate, ESM conventions, PR checklist, verification matrix, and where to change src/. Use when contributing, fixing bugs, adding guards or middleware, editing tests/examples, or preparing a pull request.
paths:
  - src/**
  - tests/**
  - examples/**
  - CHANGELOG.md
  - package.json
---

# shieldkit Contributing

Human doc: `docs/contributing.md` · Skill index: `docs/contributing/cursor-skills.md`

## Quick start

```bash
cd shieldkit
npm ci
npm run ci          # must pass before PR
npm run build       # also run in CI after ci
npm run docs:build  # also run in CI
```

**Requirements:** Node ≥ 20 (`engines` in `package.json`). CI uses Node 22.

## CI gate (mandatory)

`npm run ci` runs in order:

1. `lint:check` — ESLint, `--max-warnings 0`
2. `format:check` — Prettier
3. `typecheck` — `tsc --noEmit`
4. `test:run` — full Vitest suite (Ollama integration optional; see `docs/testing/running-tests.md`)
5. `npm audit --audit-level=moderate` — full dependency audit

GitHub Actions (`.github/workflows/ci.yml`) also runs `build`, `docs:build`, and `npm pack --dry-run`.

**All workflows:** `docs/contributing/ci-and-automation.md` · **AI SDK:** `docs/contributing/dependency-policy.md` · `npm run check:ai-sdk`

## Code conventions

| Rule            | Detail                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| Module system   | ESM (`"type": "module"`)                                                             |
| TS imports      | Use `.js` extension: `import { x } from './foo.js'`                                  |
| Package surface | Public API in `src/index.ts`; npm ships only `dist/`, `README.md`, `LICENSE`         |
| Tests           | `tests/unit/` mirrors `src/`; `tests/helpers/mock-model.ts` for deterministic models |
| Config in tests | `audit: { console: false }` unless testing audit                                     |

## Where to change what

| Change                            | Location                                      |
| --------------------------------- | --------------------------------------------- |
| Shield wrapper / middleware chain | `src/shield.ts`, `src/middleware/`            |
| Guard logic (patterns, PII)       | `src/guards/`, `src/utils/guard-normalize.ts` |
| JSON repair                       | `src/repair/`                                 |
| Tool policies                     | `src/tools/guard-tools.ts`                    |
| Config presets                    | `src/config.ts`                               |
| Errors                            | `src/errors.ts`                               |
| Release changelog extract         | `scripts/extract-changelog-section.mjs`       |
| Public exports                    | `src/index.ts` + `docs/api/reference.md`      |

## Version & CHANGELOG (mandatory)

Follow `.cursor/rules/shieldkit-release-changelog.mdc` before finishing any consumer-facing change.

1. **Changelog** — notable changes go under `## [Unreleased]` in `CHANGELOG.md` (`Added` / `Changed` / `Fixed` / `Security` / …).
2. **Version** — normal PRs defer the bump; release PRs align `package.json`, dated `CHANGELOG` section, and `vX.Y.Z` tag (`docs/contributing/npm-publishing.md`).
3. **Report** — state changelog yes/no and whether version was bumped or deferred.

## PR checklist

```
- [ ] npm run ci passes (zero errors, zero warnings)
- [ ] npm run build passes
- [ ] npm run docs:build passes (if docs or VitePress config touched)
- [ ] New behavior has unit tests (integration only when live model needed)
- [ ] docs/api/reference.md updated for public API changes
- [ ] docs/testing/verification-matrix.md updated for new proven behavior
- [ ] Feature doc under docs/features/ updated if user-facing
- [ ] `npm run demo` passes when `examples/` or demo behavior changed
- [ ] CHANGELOG.md updated under [Unreleased] when consumer impact exists
- [ ] package.json version bumped only when preparing a release (not every PR)
- [ ] No unrelated refactors
- [ ] `ai` / `@ai-sdk/*` bumps: dependency policy + AI SDK Compatibility CI green
```

## Adding behavior

1. Implement in `src/`
2. Add unit test in `tests/unit/` using `createMockModel` when possible
3. Add row to `docs/testing/verification-matrix.md`
4. Update feature doc and API reference as needed
5. Run full CI gate — see `.cursor/skills/ai-shield-pre-commit-ci/SKILL.md` (`npm run ci`)

For live-model behavior, extend `tests/integration/ollama.test.ts` — attach `@ai-shield-local-testing`.

## Useful commands

| Command                    | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run demo`             | 9-section tour, **31 PASS/FAIL checks** (mock + optional Ollama) |
| `npm run test:adversarial` | Adversarial corpus + contrast harness                            |
| `npm run dev`              | `tsup --watch` for library development                           |
| `npm run test`             | Vitest watch mode                                                |
| `npm run lint` / `format`  | Auto-fix before `ci`                                             |
| `npm pack --dry-run`       | Verify tarball (dist + README + LICENSE only)                    |
| `npm run check:ai-sdk`     | Lockfile `ai` vs npm latest                                      |

## Related

- `CONTRIBUTING.md` — contributor guide (repo root)
- `docs/contributing/ci-and-automation.md` — all GitHub Actions workflows
- `docs/contributing/dependency-policy.md` — Vercel AI SDK upgrade policy
- `docs/testing/writing-tests.md` — mock model, audit spies, errors
- `docs/architecture/overview.md` — request lifecycle
- `docs/design/limitations.md` — known gaps
