---
name: ai-shield-ship-release
description: End-to-end workflow to implement, validate, document, and release a shieldkit version. Use when the user asks to prepare a release branch, cut a version, tag v*, or ship a patch/minor release.
disable-model-invocation: true
---

# Ship Release

Complete workflow for a shieldkit semver release.

## Steps

1. **Branch** — create `release/X.Y.Z` from `main` (or rebase onto `origin/main`).
2. **Implement** — optional `@aether-engineer`; minimal diff; follow `ai-shield-contributing`.
3. **Test** — `.cursor/skills/ai-shield-pre-commit-ci/SKILL.md` (`npm run ci` until green).
4. **Assurance** — `npm run test:adversarial`; `npm run demo` (31/31); optional Ollama smoke (`examples/agent-with-tools.ts`).
5. **Docs** — sync `docs/`, verification matrix, skills if behavior changed (`ai-shield-docs`).
6. **Version** — `.cursor/skills/ai-shield-release-versioning/SKILL.md` (CHANGELOG + bump + footer links).
7. **Review** — optional: `.cursor/skills/ai-shield-review-before-merge/SKILL.md`.
8. **Commit** — only after green gates; user must request commit explicitly.
9. **Tag** — `git tag vX.Y.Z && git push origin vX.Y.Z` (user or CI); verify npm + GitHub Release.

## Report

State: release decision, gate results, suggested release title, and tag command.

## Do not

- Commit with a red gate.
- Tag without `[X.Y.Z]` section dated in `CHANGELOG.md`.
- Bump `package.json` on every PR — defer until release cut unless user asks.
