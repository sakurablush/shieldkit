# Configuration

ai-shield configuration has two layers: **shield-level config** passed to `shield(model, config?)`, and **per-request options** passed via `providerOptions.aiShield`.

## Shield-level config

### Mode presets

Set `mode` to apply a preset, then override individual keys:

| Mode                 | Input guards                               | Output repair                   | Cost budget          | Audit              |
| -------------------- | ------------------------------------------ | ------------------------------- | -------------------- | ------------------ |
| `balanced` (default) | injection block, PII redact                | 2 attempts                      | $1/session, warn 80% | basic, console on  |
| `strict`             | injection block (threshold 0.4), PII block | 3 attempts, no partial in retry | $0.50, warn 70%      | detailed           |
| `cheap`              | injection warn only, PII off               | 1 attempt                       | $0.10, warn 90%      | basic, console off |
| `local`              | injection warn (threshold 0.6), PII redact | 3 attempts                      | track only           | detailed           |
| `custom`             | user overrides only                        | user overrides                  | user overrides       | user overrides     |

```ts
const model = shield(baseModel, { mode: 'strict' });
```

### Merge order

`resolveConfig()` in `src/config.ts` merges in this order (later wins):

1. `BASE_DEFAULTS` — library defaults
2. Mode preset (`MODE_PRESETS[mode]`) — skipped for `custom`
3. User config passed to `shield()`

```ts
const model = shield(baseModel, {
  mode: 'balanced',
  cost: { maxCostPerSession: 0.25 },
  guardrails: {
    input: { injection: { threshold: 0.3 } },
  },
});
```

Use `resolveConfig(config)` to inspect the fully resolved configuration without wrapping a model.

### ShieldConfig shape

```ts
interface ShieldConfig {
  mode?: 'balanced' | 'strict' | 'cheap' | 'local' | 'custom';
  guardrails?: {
    input?: {
      injection?: {
        enabled?: boolean;
        action?: 'block' | 'redact' | 'warn';
        threshold?: number;
      };
      pii?: { enabled?: boolean; action?: 'block' | 'redact' | 'warn' };
      keywords?: {
        enabled?: boolean;
        deny?: string[];
        action?: 'block' | 'redact' | 'warn';
      };
    };
    output?: {
      repair?: {
        enabled?: boolean;
        maxAttempts?: number;
        includePartialInRetry?: boolean;
      };
      pii?: { enabled?: boolean; action?: 'block' | 'redact' | 'warn' };
      keywords?: {
        enabled?: boolean;
        deny?: string[];
        action?: 'block' | 'redact' | 'warn';
      };
    };
  };
  cost?: {
    maxCostPerSession?: number;
    trackOnly?: boolean;
    warnAtPercent?: number;
    pricing?: Record<string, { inputPer1M?: number; outputPer1M?: number }>;
    defaultPricing?: { inputPer1M?: number; outputPer1M?: number };
  };
  audit?: {
    enabled?: boolean;
    logLevel?: 'basic' | 'detailed';
    sink?: (log: AuditLog) => void | Promise<void>;
    console?: boolean;
  };
}
```

### Default pricing

When no model-specific pricing is configured, defaults are:

- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

Override per model:

```ts
shield(model, {
  cost: {
    pricing: {
      'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10 },
    },
  },
});
```

## Per-request options

Pass context per call via `providerOptions.aiShield`:

```ts
await generateText({
  model,
  prompt: '...',
  providerOptions: {
    aiShield: {
      sessionId: 'user-123',
      userId: 'auth-user-id',
      requestId: 'req-abc',
      outputSchema: myZodSchema,
      approved: true,
      metadata: { source: 'chat-widget' },
    },
  },
});
```

| Field          | Purpose                                | Default             |
| -------------- | -------------------------------------- | ------------------- |
| `sessionId`    | Cost budget key                        | `"default"`         |
| `userId`       | Audit correlation                      | —                   |
| `requestId`    | Audit correlation                      | auto-generated UUID |
| `outputSchema` | Zod schema for repair validation       | —                   |
| `approved`     | Tool approval flag (with `guardTools`) | `false`             |
| `metadata`     | Arbitrary audit metadata               | —                   |

### Session management

```ts
import { createShieldContext, resetSession } from 'shieldkit';

createShieldContext('user-123'); // initialize or reset session state
resetSession('user-123'); // delete session from store
```

Sessions are stored in an in-memory `Map`. See [Limitations](../design/limitations.md) for serverless caveats.

## Guard actions

All guards support three actions:

| Action   | Behavior                                             |
| -------- | ---------------------------------------------------- |
| `block`  | Throw `ShieldBlockedError`, emit `request.blocked`   |
| `redact` | Replace sensitive content, continue request          |
| `warn`   | Emit `guard.triggered` audit event, continue request |

Input injection and keywords support all three. Output keyword default is `warn`.

## Related docs

- [Getting started](../getting-started.md)
- [Cost tracking](../features/cost-tracking.md)
- [Structured output](../features/structured-output.md)
- [API reference](../api/reference.md)
