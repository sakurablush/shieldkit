# Contributing to ai-shield

Thank you for contributing. This guide covers local setup, the quality gate, and documentation expectations.

## Prerequisites

- **Node.js** ≥ 20 (see `engines` in `package.json`)
- **npm** (lockfile: `package-lock.json`)

## Setup

```bash
git clone <repo-url>
cd ai-shield
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
5. `npm audit --audit-level=moderate --omit=dev` — production dependency audit

Individual commands:

| Command              | Purpose                         |
| -------------------- | ------------------------------- |
| `npm run build`      | Build library to `dist/`        |
| `npm run test`       | Vitest watch mode               |
| `npm run test:run`   | Single test run                 |
| `npm run lint`       | Auto-fix lint issues            |
| `npm run format`     | Auto-format with Prettier       |
| `npm run docs:dev`   | VitePress local preview         |
| `npm run docs:build` | Build static documentation site |

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

## Publishing (maintainers)

The library is published to npm as **`shieldkit`**:

```bash
npm login
npm run ci && npm run build && npm run docs:build
npm pack --dry-run
npm publish --access public
git tag v0.1.0 && git push origin v0.1.0
```

See `scripts/publish.sh` for a single-script flow. `prepublishOnly` runs `npm run build` automatically.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Community

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributors](CONTRIBUTORS.md)
- [Changelog](CHANGELOG.md)
- [Security policy](SECURITY.md)
