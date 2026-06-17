# shieldkit Documentation

Production guardrails, structured output repair, and basic compliance for the [Vercel AI SDK](https://ai-sdk.dev/).

## Quick links

| Section                                                          | Description                                        |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| [Getting started](./getting-started.md)                          | Install, first call, mode presets                  |
| [Architecture](./architecture/overview.md)                       | Middleware chain, request lifecycle, configuration |
| [Features](./features/input-guardrails.md)                       | Guards, repair, cost, audit, tools                 |
| [Design](./design/why-middleware.md)                             | Rationale, trade-offs, limitations                 |
| [Testing](./testing/running-tests.md)                            | How to run tests and verify correctness            |
| [CI and automation](./contributing/ci-and-automation.md)         | GitHub Actions, Dependabot, schedules              |
| [Dependency policy](./contributing/dependency-policy.md)         | Vercel AI SDK version strategy                     |
| [Adversarial assurance](./testing/adversarial-assurance-plan.md) | Hardcore tests, contrast harness, red team         |
| [API reference](./api/reference.md)                              | Public exports                                     |
| [Examples](./examples/index.md)                                  | Runnable examples in the repo                      |
| [Deployment](./DEPLOYMENT.md)                                    | Publish docs to GitHub Pages                       |
| [Cursor Agent Skills](./contributing/cursor-skills.md)           | AI playbooks for dev, test, docs (Cursor)          |
| [Security policy](./security-policy.md)                          | Vulnerability reporting and scope                  |

## What is shieldkit?

**shieldkit** is published on [npm](https://www.npmjs.com/package/shieldkit) and developed at [sakurablush/shieldkit](https://github.com/sakurablush/shieldkit). It wraps any `LanguageModelV3` (OpenAI, Anthropic, Ollama, etc.) with a middleware chain that provides:

- **Input guardrails** — prompt injection detection, PII redaction, keyword deny lists
- **Output guardrails** — PII/keyword filtering on model responses
- **Structured output repair** — JSON repair and Zod schema validation with retries
- **Cost tracking** — per-session token and USD budgets
- **Audit logging** — structured lifecycle events to console or custom sinks
- **Tool guards** — allow/deny lists, call limits, approval gates
- **Verified** — [149 automated tests](./testing/verification-matrix.md#test-inventory) in the CI merge gate

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

## Documentation map

```
docs/
├── getting-started.md
├── architecture/
│   ├── overview.md
│   ├── request-lifecycle.md
│   └── configuration.md
├── features/
│   ├── input-guardrails.md
│   ├── output-guardrails.md
│   ├── structured-output.md
│   ├── cost-tracking.md
│   ├── audit-logging.md
│   └── tool-guards.md
├── design/
│   ├── why-middleware.md
│   ├── trade-offs.md
│   └── limitations.md
├── testing/
│   ├── running-tests.md
│   ├── writing-tests.md
│   ├── verification-matrix.md
│   ├── adversarial-assurance-plan.md
│   └── SECURITY_ASSURANCE_REPORT.md
├── api/
│   └── reference.md
├── contributing/
│   ├── ci-and-automation.md
│   ├── dependency-policy.md
│   └── cursor-skills.md
├── DEPLOYMENT.md
└── examples/
    └── index.md
```

## Security

See [security-policy.md](./security-policy.md) for vulnerability reporting and production recommendations.

## Contributing

See [Contributing](./contributing.md) for development setup and the quality gate (`npm run ci`).

Using Cursor? Start with [Cursor Agent Skills](./contributing/cursor-skills.md).
