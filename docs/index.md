---
layout: home

hero:
  name: shieldkit
  text: Production guardrails for the Vercel AI SDK
  tagline: Input/output safety, structured output repair, cost budgets, audit logging, and tool policies
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Architecture
      link: /architecture/overview

features:
  - title: Input guardrails
    details: Prompt injection detection, PII redaction, keyword deny lists
  - title: Structured output repair
    details: JSON repair and Zod schema validation with automatic retries
  - title: Cost tracking
    details: Per-session token and USD budgets with pre-call estimates
  - title: Audit logging
    details: Structured lifecycle events to console or custom sinks
  - title: Tool guards
    details: Allow/deny lists, call limits, and approval gates
  - title: Verified
    details: 163 automated tests in the CI merge gate — see the verification matrix
---

## Documentation map

| Section         | Link                                               |
| --------------- | -------------------------------------------------- |
| Getting started | [getting-started.md](./getting-started.md)         |
| Architecture    | [overview](./architecture/overview.md)             |
| Features        | [input guardrails](./features/input-guardrails.md) |
| Design          | [why middleware](./design/why-middleware.md)       |
| Testing         | [running tests](./testing/running-tests.md)        |
| API             | [reference](./api/reference.md)                    |
| Examples        | [index](./examples/index.md)                       |
