# Cursor Agent Skills

This repository ships **project skills** for [Cursor](https://cursor.com/) — structured playbooks that teach the AI agent how to develop, test, and document ai-shield correctly.

Skills live in `.cursor/skills/` (not published to npm). They complement human docs in `docs/` and `.cursor/rules/` (Aether personas).

## Quick reference

| Skill                                               | Attach when…                  | Human doc equivalent                                     |
| --------------------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| [ai-shield-onboarding](#ai-shield-onboarding)       | New to the repo               | [Getting started](../getting-started.md)                 |
| [ai-shield-contributing](#ai-shield-contributing)   | Changing `src/`, opening a PR | [Contributing](../contributing.md)                       |
| [ai-shield-local-testing](#ai-shield-local-testing) | Running tests, Ollama setup   | [Running tests](../testing/running-tests.md)             |
| [ai-shield-docs](#ai-shield-docs)                   | Editing `docs/` or VitePress  | [Contributing](../contributing.md#documentation-changes) |

## How to use in Cursor

1. Open the repo in Cursor.
2. In Agent chat, attach a skill:
   - Type `@` and search for the skill name (e.g. `ai-shield-local-testing`), or
   - Use the Skills picker if your Cursor version exposes it.
3. Ask your question — the agent follows the skill's checklist and conventions.

**Example prompts:**

```
@ai-shield-onboarding I'm new — what should I run first?

@ai-shield-contributing Add a new guard and prepare a PR

@ai-shield-local-testing Run the full free validation suite with Ollama

@ai-shield-docs Update the verification matrix after adding a test
```

Skills are **optional accelerators**. Everything in a skill is also documented in `docs/` for non-Cursor workflows.

## `disable-model-invocation` policy

Per [Cursor skill conventions](https://cursor.com/docs), skills support:

```yaml
disable-model-invocation: true # load only when you @-attach the skill
# omit the field              # agent may auto-apply when description matches
```

| Skill                     | Setting | Why                                                  |
| ------------------------- | ------- | ---------------------------------------------------- |
| `ai-shield-onboarding`    | `true`  | Index/router — attach when orienting, not every chat |
| `ai-shield-contributing`  | `true`  | Long PR playbook — attach for code changes           |
| `ai-shield-local-testing` | `true`  | Ollama/env specifics — attach for test runs          |
| `ai-shield-docs`          | `true`  | Doc/VitePress workflow — attach for doc edits        |

We default to **explicit invocation** so skills do not compete for context in unrelated conversations. Rich descriptions still help discovery when you search `@` in chat.

To allow ambient auto-invoke for a skill, remove `disable-model-invocation` from its `SKILL.md` frontmatter.

## Skill catalog

### ai-shield-onboarding

**Path:** `.cursor/skills/ai-shield-onboarding/SKILL.md`

Orients newcomers: what ai-shield is, repo layout, first commands, and which skill to attach next.

### ai-shield-contributing

**Path:** `.cursor/skills/ai-shield-contributing/SKILL.md`

Development workflow: `npm run ci`, code conventions (ESM, `.js` imports), where to edit `src/`, PR checklist, verification matrix updates.

### ai-shield-local-testing

**Path:** `.cursor/skills/ai-shield-local-testing/SKILL.md`

Full local validation without paid APIs:

- CPU suite (`ci`, `build`, `docs:build`, `npm pack --dry-run`)
- Ollama integration when Ollama is running (`tests/integration/ollama.test.ts`)
- `OLLAMA_HOST` and `OLLAMA_MODEL` explained
- Smoke example (`examples/agent-with-tools.ts`)
- Troubleshooting (cold GPU timeouts, Windows PATH)

**Platform supplements:** `.cursor/skills/ai-shield-local-testing/ollama-windows.md`, `ollama-linux.md`, `ollama-macos.md`

### ai-shield-docs

**Path:** `.cursor/skills/ai-shield-docs/SKILL.md`

Documentation and VitePress: `docs/` map, `npm run docs:build`, verification matrix and API reference sync.

## Directory layout

```
.cursor/
├── skills/         # Tracked — Cursor Agent Skills (shared with contributors)
├── rules/          # Tracked — Aether persona rules
└── plans/          # Gitignored — ephemeral agent plans (local only)
```

## Maintaining skills

When you change workflows (CI steps, test env vars, doc paths):

1. Update the relevant `SKILL.md` (and `ollama-*.md` platform guides if install paths or commands change).
2. Update this page if skill names, attach guidance, or invocation policy changes.
3. Sync canonical human docs (`docs/testing/`, `docs/contributing.md`, `CONTRIBUTING.md`).
4. Keep skills concise — link to `docs/` for long explanations; skills are checklists, not duplicates.

**Do not** create skills in `~/.cursor/skills-cursor/` — that directory is reserved for Cursor built-ins.

Ephemeral plan files under `.cursor/plans/` are listed in `.gitignore`, `.cursorignore`, and `.kiloignore` and should not be committed.

## Related

- [Contributing](../contributing.md)
- [CI and automation](./ci-and-automation.md)
- [Dependency policy](./dependency-policy.md)
- [Running tests](../testing/running-tests.md)
- [Verification matrix](../testing/verification-matrix.md)
