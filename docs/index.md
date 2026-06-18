---
layout: home

hero:
  name: shieldkit
  text: Production guardrails for the Vercel AI SDK
  tagline: Input/output safety, structured output repair, cost budgets, audit logging, and tool policies — verified with 163 automated tests
  image:
    src: /logo.svg
    alt: shieldkit logo
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Run the demo
      link: /examples/#full-feature-demo
    - theme: alt
      text: npm
      link: https://www.npmjs.com/package/shieldkit

features:
  - icon: 🛡️
    title: Input guardrails
    details: Prompt injection, PII redaction, keyword deny lists — with homoglyph and zero-width normalization since v0.2.0
  - icon: 🔁
    title: Structured output repair
    details: JSON repair and Zod schema validation with automatic retries on `generateText` and `streamText`
  - icon: 💰
    title: Cost tracking
    details: Per-session token and USD budgets with pre-call estimates and warn thresholds
  - icon: 📋
    title: Audit logging
    details: Structured lifecycle events (`guard.triggered`, `request.blocked`, `repair.success`) to console or custom sinks
  - icon: 🔧
    title: Tool guards
    details: Allow/deny lists, call limits, and approval gates via `guardTools`
  - icon: ✅
    title: Verified
    details: 163 tests in CI, adversarial corpus, red team harness, and `npm run demo` with 31 PASS/FAIL checks
---

<div class="release-banner">

## New in v0.2.0

- **Evasion hardening** — `normalizeGuardText()` strips zero-width characters and folds Cyrillic homoglyphs before injection and keyword guards
- **Interactive demo** — `npm run demo` runs a 9-section tour with **31 automated checks** and audit evidence (mock + optional Ollama)
- **Release automation** — tagging `v*` publishes to npm and creates a GitHub Release from `CHANGELOG.md`

[Read the changelog on GitHub](https://github.com/sakurablush/shieldkit/blob/main/CHANGELOG.md#020---2026-06-18) · [Input guardrails docs](./features/input-guardrails.md) · [npm publishing](./contributing/npm-publishing.md)

</div>

<div class="quick-demo">

## Try it locally

```bash
git clone https://github.com/sakurablush/shieldkit.git
cd shieldkit && npm ci && npm run demo
```

Sections 1–8 use mocks only; section 9 needs [Ollama](https://ollama.com/download). Expect `Demo summary — 31/31 checks passed`.

```ts
import { generateText } from 'ai';
import { shield } from 'shieldkit';

const model = shield(yourModel, { mode: 'balanced' });

await generateText({
  model,
  prompt: 'Hello',
  providerOptions: { aiShield: { sessionId: 'user-123' } },
});
```

</div>

<div class="doc-map">

## Documentation map

| Section         | Link                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Getting started | [Install and first request](./getting-started.md)                                                     |
| Architecture    | [Middleware chain](./architecture/overview.md)                                                        |
| Features        | [Guards, repair, cost, audit, tools](./features/input-guardrails.md)                                  |
| Testing         | [Running tests](./testing/running-tests.md) · [Verification matrix](./testing/verification-matrix.md) |
| Examples        | [Runnable scripts](./examples/index.md)                                                               |
| API             | [Public exports](./api/reference.md)                                                                  |
| Contributing    | [Development guide](./contributing.md) · [Cursor skills](./contributing/cursor-skills.md)             |

</div>
