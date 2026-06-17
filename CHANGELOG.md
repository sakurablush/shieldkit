# Changelog

All notable changes to **shieldkit** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- AI SDK Compatibility workflow (`.github/workflows/ai-sdk-compat.yml`) — weekly and PR matrix against lockfile pin and `ai@latest`.
- `scripts/check-ai-sdk-version.mjs` and `npm run check:ai-sdk` / `verify:ai-sdk-latest`.
- Documentation: [CI and automation](docs/contributing/ci-and-automation.md), [dependency policy](docs/contributing/dependency-policy.md).

### Changed

- Peer dependency `ai` corrected to `>=6.0.0` (v6 / `LanguageModelV3` required).

## [0.1.0] - 2026-06-17

Initial public release on npm as **shieldkit** (source repo: `ai-shield`).

### Added

- `shield()` middleware for Vercel AI SDK `LanguageModelV3` models.
- Input/output guardrails (injection, PII, keywords).
- Structured JSON output repair with Zod validation and retries.
- Session cost budgets and audit logging.
- `guardTools()` for tool allow/deny lists, call limits, and approval gates.
- Mode presets: `balanced`, `strict`, `cheap`, `local`, `custom`.
- `shieldGenerateText` and `shieldStreamText` helpers.
- Full unit test matrix with positive and negative cases (`docs/testing/unit-coverage-audit.md`).
- Adversarial test suite (`tests/adversarial/`) with fixture corpus and contrast harness.
- Ollama red team workflow (`.github/workflows/redteam.yml`) and `npm run test:redteam`.
- `TEST_VERBOSE=1` optional logging during tests.
- `docs/testing/SECURITY_ASSURANCE_REPORT.md` and `docs/testing/adversarial-assurance-plan.md`.
- Cursor Agent Skills in `.cursor/skills/` with documentation at `docs/contributing/cursor-skills.md`.
- `.cursorignore` and `.kiloignore` for consistent AI indexing across tools.
- `CODE_OF_CONDUCT.md`, `CONTRIBUTORS.md`, and `.github/CODEOWNERS`.
- VitePress documentation site and hardened CI (lint, typecheck, test, build, docs, audit, CodeQL, Dependabot).

### Changed

- `.gitignore` now tracks `.cursor/skills/` and `.cursor/rules/`; only ephemeral plan files are ignored.

[Unreleased]: https://github.com/sakurablush/ai-shield/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sakurablush/ai-shield/releases/tag/v0.1.0
