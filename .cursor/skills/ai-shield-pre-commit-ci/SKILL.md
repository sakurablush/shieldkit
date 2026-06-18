---
name: ai-shield-pre-commit-ci
description: Runs shieldkit's full CI gate (lint, format, typecheck, 163 tests, audit) before commit or merge. Use when committing, fixing CI failures, editing Cursor skills, or finishing implementation work.
paths:
  - src/**
  - tests/**
  - examples/**
  - .cursor/skills/**
---

# Pre-Commit CI

Run the repository quality gate before any commit or merge-ready sign-off.

## Command

```bash
npm run ci
```

Expands to: `lint:check` → `format:check` → `typecheck` → `test:run` (163 tests) → `npm audit --audit-level=moderate`

## Workflow

1. After edits to `src/`, `tests/`, or `examples/`, optionally run `npm run lint` on touched files (`--fix` is built in).
2. After edits to **`.cursor/skills/**/\*.md`**, run `npm run format`(or full`npm run ci`). Markdown tables must pass Prettier.
3. Run `npm run ci` in full — do not substitute `test:run` alone.
4. Fix every error and warning; re-run until exit code 0.
5. Include auto-fixed formatting in the same commit as the feature or fix.

## Docs changes

When `docs/` or `website/` changed:

```bash
npm run docs:build
```

## Release validation (before tag)

```bash
npm run test:adversarial
npm run demo
```

## If `ci` cannot run

```bash
npm run lint:check && npm run format:check && npm run typecheck && npm run test:run
```

Format skills only:

```bash
npx prettier --write ".cursor/skills/**/*.md"
```

## Rule reference

`.cursor/rules/pre-commit-quality-gate.mdc`
