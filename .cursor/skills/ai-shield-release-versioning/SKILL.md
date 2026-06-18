---
name: ai-shield-release-versioning
description: Cuts a shieldkit release or updates CHANGELOG and version files per SemVer. Use when shipping consumer-visible changes, bumping version, tagging v*, or preparing GitHub Release notes.
paths:
  - CHANGELOG.md
  - package.json
  - package-lock.json
  - README.md
---

# Release Versioning

Shippable work in shieldkit requires a release decision and CHANGELOG entry.

## Authority

- Changelog format: `CHANGELOG.md` (Keep a Changelog)
- Publish procedure: `docs/contributing/npm-publishing.md`
- Release notes extract: `scripts/extract-changelog-section.mjs`

## Decision

| Outcome     | When                                                                   |
| ----------- | ---------------------------------------------------------------------- |
| **No bump** | Internal refactors, maintainer-only CI, `.cursor/` policy — say why    |
| **Defer**   | Normal PR — `[Unreleased]` entry only; do not bump `package.json`      |
| **Patch**   | Bug or security fix, no public API break                               |
| **Minor**   | Backward-compatible feature (new guard behavior, helpers, presets)     |
| **Major**   | Breaking public API (`src/index.ts`, exported types, default behavior) |

Read current version from `package.json` — never guess.

## Workflow

1. Decide bump level; state rationale in final output.
2. Add bullets under `[Unreleased]` (or new `## [X.Y.Z] - YYYY-MM-DD` when cutting).
3. Sections: **Added**, **Changed**, **Deprecated**, **Removed**, **Fixed**, **Security** — omit empty.
4. On release bump: sync `package.json`, `package-lock.json`, footer compare links in `CHANGELOG.md`.
5. Tag `vX.Y.Z` — CI publishes npm + GitHub Release from CHANGELOG (`softprops/action-gh-release`).
6. Run `.cursor/skills/ai-shield-pre-commit-ci/SKILL.md` before commit; `npm run demo` before tag.

Preview release body:

```bash
node scripts/extract-changelog-section.mjs X.Y.Z --stdout
```

## Rule reference

`.cursor/rules/shieldkit-release-changelog.mdc`

## End-to-end ship

For a full release branch workflow, see `.cursor/skills/ai-shield-ship-release/SKILL.md`.
