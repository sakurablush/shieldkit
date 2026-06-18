# Contributing to shieldkit

Thank you for contributing. This guide covers local setup, the quality gate, and documentation expectations.

## Prerequisites

- **Node.js** ≥ 20 (see `engines` in `package.json`)
- **npm** (lockfile: `package-lock.json`)

## Setup

```bash
git clone https://github.com/sakurablush/shieldkit.git
cd shieldkit
npm ci
```

## Cursor Agent Skills

This repo includes project skills in `.cursor/skills/` for AI-assisted development. Attach in Agent chat with `@`:

| Skill                     | Use for                     |
| ------------------------- | --------------------------- |
| `ai-shield-onboarding`    | New to the repo             |
| `ai-shield-contributing`  | Code changes and PRs        |
| `ai-shield-local-testing` | Tests and Ollama setup      |
| `ai-shield-docs`          | Documentation and VitePress |

Full guide: [docs/contributing/cursor-skills.md](docs/contributing/cursor-skills.md).

## Quality gate

All changes must pass the full CI gate before merge:

```bash
npm run ci
```

This runs, in order:

1. `npm run lint:check` — ESLint with zero warnings
2. `npm run format:check` — Prettier
3. `npm run typecheck` — TypeScript (`tsc --noEmit`)
4. `npm run test:run` — Vitest (unit + integration)
5. `npm audit --audit-level=moderate` — full dependency audit (dev + prod)

Individual commands:

| Command              | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `npm run build`      | Build library to `dist/`                                         |
| `npm run test`       | Vitest watch mode                                                |
| `npm run test:run`   | Single test run                                                  |
| `npm run lint`       | Auto-fix lint issues                                             |
| `npm run format`     | Auto-format with Prettier                                        |
| `npm run docs:dev`   | VitePress local preview                                          |
| `npm run docs:build` | Build static documentation site                                  |
| `npm run demo`       | 9-section tour, **31 PASS/FAIL checks** (mock + optional Ollama) |

## Ollama integration tests

Integration tests in `tests/integration/ollama.test.ts` skip automatically when Ollama is not reachable. To run them locally:

```bash
OLLAMA_HOST=http://127.0.0.1:11434 OLLAMA_MODEL=llama3.2 npm run test:run
```

## Pull request checklist

- [ ] `npm run ci` passes with zero errors and zero warnings
- [ ] New behavior has unit tests (or integration tests where appropriate)
- [ ] Public API changes are reflected in `docs/api/reference.md`
- [ ] Behavior claims are updated in `docs/testing/verification-matrix.md`
- [ ] README or feature docs updated if user-facing behavior changed
- [ ] `ai` / `@ai-sdk/*` bumps: see [dependency policy](docs/contributing/dependency-policy.md) and ensure **AI SDK Compatibility** CI is green

## Documentation changes

Documentation lives in `docs/` and is **not** published to npm (the package ships only `dist`, `README.md`, and `LICENSE`).

When adding or changing behavior:

1. Update the relevant feature doc under `docs/features/`
2. Update `docs/testing/verification-matrix.md` with the test file that proves the behavior
3. Add architecture or design notes if the change affects trade-offs or limitations

## Code style

- Match existing patterns in `src/` (ESM, `.js` import extensions in TypeScript)
- Keep changes focused — avoid unrelated refactors
- Comments only for non-obvious business logic

## CI and automation

All GitHub Actions workflows, Dependabot groups, and weekly schedules are documented in [docs/contributing/ci-and-automation.md](docs/contributing/ci-and-automation.md).

Vercel AI SDK (`ai`) upgrades: [docs/contributing/dependency-policy.md](docs/contributing/dependency-policy.md) · `npm run check:ai-sdk`

## Publishing (maintainers)

**Preferred:** merge to `main`, tag `vX.Y.Z`, push — [Publish workflow](.github/workflows/publish.yml) uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC, no `NPM_TOKEN`).

Setup and exact npm form values: [docs/contributing/npm-publishing.md](docs/contributing/npm-publishing.md).

**Fallback** (local `npm login`):

```bash
bash scripts/publish.sh   # or: .\scripts\publish.ps1 on Windows
git tag v$(node -p "require('./package.json').version")
git push origin v$(node -p "require('./package.json').version")
```

Tag push triggers [Publish workflow](.github/workflows/publish.yml) — npm OIDC publish **and** GitHub Release from `CHANGELOG` (via `scripts/extract-changelog-section.mjs`). Manual release notes are not required. `prepublishOnly` runs `npm run build` automatically on publish.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Community

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributors](CONTRIBUTORS.md)
- [Changelog](CHANGELOG.md)
- [Security policy](SECURITY.md)
