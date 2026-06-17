# Cost Tracking

## What it does

Tracks token usage and estimated USD cost per session. Optionally enforces a per-session budget, blocking requests that would exceed the limit.

## How it works

`src/middleware/cost-tracking.ts` wraps `wrapGenerate` and `wrapStream`.

### Pre-call (budget check)

1. Resolve `sessionId` from `providerOptions.aiShield` (default: `"default"`)
2. Estimate input tokens from prompt via `estimateTokensFromPrompt()` (`src/utils/token-estimator.ts`)
3. Estimate cost assuming output tokens ≈ input tokens (conservative pre-check)
4. Call `assertSessionBudget()`:
   - If `trackOnly`, skip enforcement
   - If `session.totalCostUsd >= maxCost`, throw `ShieldBudgetError`
   - If `session.totalCostUsd + estimatedCost > maxCost`, throw `ShieldBudgetError`

### Post-call (recording)

1. Read actual usage from model response (or fall back to estimate)
2. Compute cost via `estimateCostUsd()` using per-model or default pricing
3. Update session via `recordSessionUsage()` in `src/context.ts`
4. Emit `cost.recorded` audit event
5. If usage ≥ `warnAtPercent` of budget, emit `budget.warn`
6. Set `session.budgetExceeded = true` if at or over max

### Token estimation

Model-specific chars-per-token ratios for GPT-4o, Claude, Gemini, Llama, etc. Unknown models use chars/4.

### Session store

In-memory `Map<string, SessionState>`:

```ts
interface SessionState {
  sessionId: string;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
  budgetExceeded: boolean;
}
```

## Why this approach

- Pre-call estimates prevent runaway costs before the model responds
- Model-specific ratios improve estimate accuracy without tokenizer dependencies
- In-memory store is simple for single-process deployments

See [Trade-offs](../design/trade-offs.md) and [Limitations](../design/limitations.md) for serverless caveats.

## Configuration

```ts
import { createShieldContext, shield } from 'ai-shield';

createShieldContext('user-123');

const model = shield(baseModel, {
  cost: {
    maxCostPerSession: 0.5,
    trackOnly: false,
    warnAtPercent: 80,
    pricing: {
      'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10 },
    },
    defaultPricing: { inputPer1M: 0.15, outputPer1M: 0.6 },
  },
});

await generateText({
  model,
  prompt: '...',
  providerOptions: { aiShield: { sessionId: 'user-123' } },
});
```

| Option              | Default        | Purpose                                       |
| ------------------- | -------------- | --------------------------------------------- |
| `maxCostPerSession` | `1` (balanced) | USD limit per session                         |
| `trackOnly`         | `false`        | Record usage without enforcing (`local` mode) |
| `warnAtPercent`     | `80`           | Emit `budget.warn` at this % of max           |
| `pricing`           | `{}`           | Per-model rates (per 1M tokens)               |
| `defaultPricing`    | $0.15 / $0.60  | Fallback for unknown models                   |

## Errors and edge cases

| Situation                   | Behavior                                                           |
| --------------------------- | ------------------------------------------------------------------ |
| Budget exceeded (pre-call)  | `ShieldBudgetError` with `sessionId`, `totalCostUsd`, `maxCostUsd` |
| Budget exceeded (post-call) | Request completes; `budgetExceeded` flag set; next request blocked |
| `trackOnly: true`           | `maxCostPerSession` set to `Infinity`; no enforcement              |
| Repair retries              | Pre-budget **not** checked on direct `doGenerate` retries          |
| Serverless                  | Each instance has separate session state                           |

Audit events: `cost.recorded`, `budget.warn`, `budget.exceeded`.

## Verification

| Test file                                     | What it proves                                 |
| --------------------------------------------- | ---------------------------------------------- |
| `tests/unit/middleware/cost-tracking.test.ts` | Budget enforce, stream pre-estimate, trackOnly |
| `tests/unit/token-estimator.test.ts`          | Chars-per-token for known/unknown models       |

See [Verification matrix](../testing/verification-matrix.md).

## Related docs

- [Configuration](../architecture/configuration.md)
- [Audit logging](./audit-logging.md)
- [Limitations](../design/limitations.md)
