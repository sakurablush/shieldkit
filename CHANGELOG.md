# Changelog

All notable changes to **shieldkit** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-06-17

### Fixed

- Stream text collector: use a `ReadableStream` / `WritableStream` pair instead of `new TransformStream({...})` to clear the CodeQL `js/superfluous-trailing-arguments` alert (no behavior change).
- Documentation: correct test inventory (149 tests in merge gate, not 39); align audit wording with full-tree `npm audit`.

## [0.1.0] - 2026-06-17

Initial public release on npm as **shieldkit** ([sakurablush/shieldkit](https://github.com/sakurablush/shieldkit)).

### Added

- `shield()` middleware for Vercel AI SDK `LanguageModelV3` models.
- Input/output guardrails (injection, PII, keywords).
- Structured JSON output repair with Zod validation and retries.
- Session cost budgets and audit logging.
- `guardTools()` for tool allow/deny lists, call limits, and approval gates.
- Mode presets: `balanced`, `strict`, `cheap`, `local`, `custom`.
- `shieldGenerateText` and `shieldStreamText` helpers.
- Full unit test matrix with positive and negative cases ([unit coverage audit](docs/testing/unit-coverage-audit.md)).
- Adversarial test suite (`tests/adversarial/`) with fixture corpus and contrast harness.
- Ollama red team workflow (`.github/workflows/redteam.yml`) and `npm run test:redteam`.
- `TEST_VERBOSE=1` optional logging during tests.
- [Security assurance report](docs/testing/SECURITY_ASSURANCE_REPORT.md) and [adversarial assurance plan](docs/testing/adversarial-assurance-plan.md).
- AI SDK Compatibility workflow — weekly and PR matrix against lockfile pin and `ai@latest`.
- `scripts/check-ai-sdk-version.mjs`, `npm run check:ai-sdk`, and `npm run verify:ai-sdk-latest`.
- Publish helpers: `scripts/publish.sh`, `scripts/publish.ps1`, and `prepublishOnly` build gate.
- Documentation: [CI and automation](docs/contributing/ci-and-automation.md), [dependency policy](docs/contributing/dependency-policy.md).
- Cursor Agent Skills in `.cursor/skills/` (including per-platform Ollama guides) and [cursor-skills.md](docs/contributing/cursor-skills.md).
- `.cursorignore`, `.kiloignore`, `CODE_OF_CONDUCT.md`, `CONTRIBUTORS.md`, and `.github/CODEOWNERS`.
- VitePress documentation site and hardened CI (lint, typecheck, test, build, docs, `npm pack --dry-run`, audit, CodeQL, Dependabot).

### Changed

- npm package and GitHub repository: **shieldkit**.
- Peer dependency `ai` is `>= 6.0.0` (AI SDK v6 / `LanguageModelV3` required).
- `.gitignore` tracks `.cursor/skills/` and `.cursor/rules/`; ephemeral plan files remain ignored.
- Dev toolchain: ESLint 10, TypeScript 6, `typescript-eslint` 8.61; `vite` override `^6.4.3` for VitePress transitive CVEs.
- CI audits all dependencies (`npm audit --audit-level=moderate`, not `--omit=dev`).

[Unreleased]: https://github.com/sakurablush/shieldkit/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/sakurablush/shieldkit/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/sakurablush/shieldkit/releases/tag/v0.1.0
