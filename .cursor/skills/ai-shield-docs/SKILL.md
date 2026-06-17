---
name: ai-shield-docs
description: Updates ai-shield documentation and VitePress site — docs structure, build commands, verification matrix, API reference sync, and cursor-skills maintenance. Use when editing docs/, website/, feature documentation, VitePress config, or CONTRIBUTING for ai-shield.
disable-model-invocation: true
---

# ai-shield Documentation

Human docs: `docs/` · Skill index: `docs/contributing/cursor-skills.md`

## Layout

```
docs/                    # Markdown source (not published to npm)
website/                 # VitePress site root
  .vitepress/config.ts   # Nav, sidebar, base path
.cursor/skills/          # Cursor Agent Skills
```

**npm package ships only:** `dist/`, `README.md`, `LICENSE`.

## Commands

| Command                | Purpose                           |
| ---------------------- | --------------------------------- |
| `npm run docs:dev`     | Local preview (hot reload)        |
| `npm run docs:build`   | Static build — **required in CI** |
| `npm run docs:preview` | Preview production build          |

CI sets `VITEPRESS_BASE=/${{ github.event.repository.name }}/` for GitHub Pages.

## Documentation map

| Topic             | Path                                     |
| ----------------- | ---------------------------------------- |
| Getting started   | `docs/getting-started.md`                |
| Cursor skills     | `docs/contributing/cursor-skills.md`     |
| Architecture      | `docs/architecture/`                     |
| Features          | `docs/features/`                         |
| API reference     | `docs/api/reference.md`                  |
| Testing           | `docs/testing/`                          |
| CI / automation   | `docs/contributing/ci-and-automation.md` |
| Dependency policy | `docs/contributing/dependency-policy.md` |
| Deployment        | `docs/DEPLOYMENT.md`                     |
| Security          | `docs/security-policy.md`, `SECURITY.md` |

## When behavior changes

1. Feature doc — `docs/features/<topic>.md`
2. API reference — `docs/api/reference.md`
3. Verification matrix — `docs/testing/verification-matrix.md`
4. Examples — `docs/examples/index.md`, `examples/*.ts`
5. Architecture / design — if trade-offs change
6. README — if install or quick-start changes
7. Cursor skills — if workflows change (`.cursor/skills/`, `docs/contributing/cursor-skills.md`)
8. CI / automation docs — if GitHub Actions or Dependabot change (`docs/contributing/ci-and-automation.md`, `.github/workflows/README.md`)

## Verification matrix

Each row: test file reference, confidence (High/Medium/Low), what is proven.

Update when adding/removing tests. Non-guarantees table lists explicit gaps.

## VitePress

`website/.vitepress/config.ts` — nav, sidebar, `base` from `VITEPRESS_BASE`.

After link or sidebar changes: `npm run docs:build`.

## PR checklist (docs-only)

```
- [ ] npm run docs:build passes
- [ ] verification-matrix.md updated if coverage changed
- [ ] API reference matches src/index.ts exports
- [ ] cursor-skills.md updated if skill workflows changed
- [ ] No docs/ in package.json "files"
```

## Related

- `.github/workflows/docs.yml`
- `@ai-shield-contributing` — full PR gate
- `@ai-shield-local-testing` — test doc sync
