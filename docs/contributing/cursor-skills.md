# Cursor Agent Skills & Rules

This repository ships **project skills** and **project rules** for [Cursor](https://cursor.com/) — structured playbooks that teach the agent how to develop, test, and document shieldkit correctly.

- Skills: `.cursor/skills/` (workflows, checklists)
- Rules: `.cursor/rules/` (personas, mandatory policies)

They complement human docs in `docs/`. Official references: [Cursor Rules](https://cursor.com/docs/rules) · [Agent Skills](https://cursor.com/docs/context/skills).

## Quick reference — skills

| Skill                     | When it loads                                                  | Invoke manually            |
| ------------------------- | -------------------------------------------------------------- | -------------------------- |
| `ai-shield-contributing`  | Auto when editing `src/`, `tests/`, `examples/`, release files | `/ai-shield-contributing`  |
| `ai-shield-docs`          | Auto when editing `docs/`, `website/`, `.cursor/skills/`       | `/ai-shield-docs`          |
| `ai-shield-local-testing` | Never auto — explicit only                                     | `/ai-shield-local-testing` |
| `ai-shield-onboarding`    | Never auto — explicit only                                     | `/ai-shield-onboarding`    |

## Quick reference — rules

| Rule                          | Trigger type      | When it applies                                                                              |
| ----------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `shieldkit-release-changelog` | **File patterns** | Auto when editing `src/`, `tests/`, `examples/`, `CHANGELOG.md`, `package.json`, `README.md` |
| `aether-engineer`             | **Manual** (`@`)  | Agent implementation with plan tracking                                                      |
| `aether-planner`              | **Manual** (`@`)  | Plan mode — architecture without code                                                        |
| `aether-reviewer`             | **Manual** (`@`)  | Code or PR review                                                                            |
| `aether-debugger`             | **Manual** (`@`)  | Debug mode — root cause analysis                                                             |
| `aether-test-engineer`        | **Manual** (`@`)  | Deep test design / QA review                                                                 |
| `aether-security-auditor`     | **Manual** (`@`)  | Security audit or threat modeling                                                            |
| `aether-advisor`              | **Manual** (`@`)  | Ask mode — technical Q&A without code changes                                                |

**No rule uses `alwaysApply: true`** — context stays lean; policies attach when files match or you `@`-mention a persona.

## How to use in Cursor

1. Open the repo in Cursor.
2. **Skills:** type `/` + skill name, or let the agent auto-load scoped skills when you edit matching files.
3. **Rules:** type `@` + rule name for Aether personas; `shieldkit-release-changelog` attaches when you touch library or release files.
4. View everything in **Cursor Settings → Rules** (Project Rules + Agent Decides skills).

**Example prompts:**

```
@ai-shield-onboarding I'm new — what should I run first?

/ai-shield-local-testing Run npm run demo and the Ollama smoke suite

@aether-reviewer Review my guard changes before I open a PR

@aether-engineer Implement the feature with a tracked execution plan
```

Skills and rules are **optional accelerators**. Everything they contain is also documented in `docs/` for non-Cursor workflows.

## Skills — invocation policy

Per [Cursor Skills docs](https://cursor.com/docs/context/skills):

| Mechanism                           | Effect                                                            |
| ----------------------------------- | ----------------------------------------------------------------- |
| `paths` (globs)                     | Skill surfaces only when the agent works with matching files      |
| `disable-model-invocation: true`    | Skill loads only via `/skill-name` — never auto from chat context |
| _(omit `disable-model-invocation`)_ | Agent may auto-apply when description + paths match the task      |

| Skill                     | `paths`                                                             | `disable-model-invocation` | Rationale                                            |
| ------------------------- | ------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| `ai-shield-contributing`  | `src/**`, `tests/**`, `examples/**`, `CHANGELOG.md`, `package.json` | **off**                    | Dev workflow should follow you into library code     |
| `ai-shield-docs`          | `docs/**`, `website/**`, `.cursor/skills/**`                        | **off**                    | Doc workflow when editing docs or skills             |
| `ai-shield-local-testing` | —                                                                   | **on**                     | Long Ollama/env playbook — invoke when running tests |
| `ai-shield-onboarding`    | —                                                                   | **on**                     | Router/index — invoke when orienting, not every chat |

Descriptions are written in **third person** with both **what** the skill does and **when** to use it — required for agent discovery.

## Rules — trigger policy

Per [Cursor Rules docs](https://cursor.com/docs/rules):

| `alwaysApply` | `description` | `globs` | Behavior                                 |
| ------------- | ------------- | ------- | ---------------------------------------- |
| `true`        | —             | —       | Every chat (we avoid this)               |
| `false`       | yes           | yes     | Auto when matching files are in context  |
| `false`       | yes           | no      | Agent decides relevance from description |
| `false`       | no            | no      | **Manual only** — `@rule-name` in chat   |

| Rule                          | Config                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `shieldkit-release-changelog` | `alwaysApply: false` + `globs` on library and release files + `description`  |
| `aether-*` personas           | `alwaysApply: false`, no `description`, no `globs` → manual `@aether-*` only |

## Skill catalog

### ai-shield-onboarding

**Path:** `.cursor/skills/ai-shield-onboarding/SKILL.md`

Orients newcomers: what shieldkit is, repo layout, first commands, and which skill to attach next.

### ai-shield-contributing

**Path:** `.cursor/skills/ai-shield-contributing/SKILL.md`

Development workflow: `npm run ci`, code conventions (ESM, `.js` imports), where to edit `src/`, PR checklist, verification matrix updates, release changelog extract (`scripts/extract-changelog-section.mjs`).

### ai-shield-local-testing

**Path:** `.cursor/skills/ai-shield-local-testing/SKILL.md`

Full local validation without paid APIs:

- CPU suite (`ci`, `build`, `docs:build`, `npm pack --dry-run`) — **163 tests** in merge gate
- Ollama integration when Ollama is running (`tests/integration/ollama.test.ts`)
- Adversarial corpus (`npm run test:adversarial`) — homoglyph `inj-010` and zero-width `inj-011` blocked since **0.2.0**
- Full demo (`npm run demo`) — **31 PASS/FAIL checks** across 9 sections (mock + optional Ollama)
- `OLLAMA_HOST` and `OLLAMA_MODEL` explained
- Smoke example (`examples/agent-with-tools.ts`) — audit evidence footer, `exit 1` on failure
- Troubleshooting (cold GPU timeouts, Windows PATH)

**Platform supplements:** `.cursor/skills/ai-shield-local-testing/ollama-windows.md`, `ollama-linux.md`, `ollama-macos.md`

### ai-shield-docs

**Path:** `.cursor/skills/ai-shield-docs/SKILL.md`

Documentation and VitePress: `docs/` map, `npm run docs:build`, verification matrix and API reference sync, CHANGELOG / GitHub Release notes (`npm-publishing.md`).

## Aether persona rules

**Path:** `.cursor/rules/aether-*.mdc`

Optional principal-engineer personas for specialized modes. They do **not** auto-apply — attach with `@aether-engineer`, `@aether-reviewer`, etc., when you want that voice and checklist.

## Directory layout

```
.cursor/
├── skills/         # Agent Skills (SKILL.md + optional scripts/references)
├── rules/          # Project rules (.mdc with frontmatter)
└── plans/          # Gitignored — ephemeral agent plans (local only)
```

## Maintaining skills and rules

When you change workflows (CI steps, test env vars, doc paths, trigger policy):

1. Update the relevant `SKILL.md` or `.mdc` rule frontmatter (`paths`, `globs`, `description`).
2. Update this page if names, attach guidance, or invocation policy changes.
3. Sync canonical human docs (`docs/testing/`, `docs/contributing.md`, `CONTRIBUTING.md`).
4. Keep skills and rules concise — link to `docs/` for long explanations.

**Do not** create skills in `~/.cursor/skills-cursor/` — that directory is reserved for Cursor built-ins.

Ephemeral plan files under `.cursor/plans/` are listed in `.gitignore`, `.cursorignore`, and `.kiloignore` and should not be committed.

## Related

- [Contributing](../contributing.md)
- [CI and automation](./ci-and-automation.md)
- [Dependency policy](./dependency-policy.md)
- [Running tests](../testing/running-tests.md)
- [Verification matrix](../testing/verification-matrix.md)
