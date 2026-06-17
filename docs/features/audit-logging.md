# Audit Logging

## What it does

Emits structured audit events for request lifecycle, guard triggers, repair attempts, cost recording, budget warnings, and tool execution.

Events go to the console (optional) and/or a custom async sink.

## How it works

### Emitter

`createAuditEmitter()` in `src/utils/audit.ts` returns `emitAudit`, shared across all middleware via `ShieldRuntime`.

For each event:

1. Skip if `audit.enabled` is false
2. Add ISO timestamp
3. If `audit.console`, write to `console.info` (format depends on `logLevel`)
4. If `audit.sink`, call asynchronously (errors swallowed)

### Middleware events

`src/middleware/audit-logging.ts` wraps generate and stream:

| Event              | When                         |
| ------------------ | ---------------------------- |
| `request.start`    | Before model call            |
| `request.complete` | After successful completion  |
| `request.blocked`  | On any error during the call |

### Guard and repair events

Emitted by respective middleware:

| Event             | Source                    |
| ----------------- | ------------------------- |
| `guard.triggered` | Input/output guardrails   |
| `repair.attempt`  | Repair loop               |
| `repair.success`  | Valid JSON/schema         |
| `repair.failed`   | Retries exhausted         |
| `cost.recorded`   | Cost tracking             |
| `budget.warn`     | Approaching session limit |
| `budget.exceeded` | Budget check failed       |

### Tool events

`guardTools()` emits:

| Event           | When                  |
| --------------- | --------------------- |
| `tool.executed` | Tool ran successfully |
| `tool.blocked`  | Policy violation      |

## Why this approach

- Structured events enable SIEM integration, dashboards, and compliance trails
- Correlation IDs (`sessionId`, `userId`, `requestId`) link model and tool activity
- Console output gives zero-config visibility in development

## Configuration

```ts
const model = shield(baseModel, {
  audit: {
    enabled: true,
    logLevel: 'detailed', // 'basic' | 'detailed'
    console: true,
    sink: async (log) => {
      await fetch('/api/audit', {
        method: 'POST',
        body: JSON.stringify(log),
      });
    },
  },
});
```

### Log levels

| Level      | Console output                              |
| ---------- | ------------------------------------------- |
| `basic`    | `type`, `timestamp`, `sessionId`, `modelId` |
| `detailed` | Full `AuditLog` object including `details`  |

### AuditLog shape

```ts
interface AuditLog {
  type: AuditEventType;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  requestId?: string;
  modelId?: string;
  details?: Record<string, unknown>;
}
```

### Correlation

Pass the same IDs to model and tool calls:

```ts
const requestId = 'req-abc';

await generateText({
  model,
  prompt: '...',
  providerOptions: {
    aiShield: { sessionId: 'user-1', requestId },
  },
});

const tools = guardTools(myTools, { requestId, sessionId: 'user-1' });
```

## Errors and edge cases

| Situation                        | Behavior                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `audit.enabled: false`           | No events emitted                                                              |
| `console: false`                 | Console suppressed; sink still called                                          |
| Sink throws                      | Error caught and ignored                                                       |
| `request.blocked` on guard block | Emitted by input guardrails **and** audit middleware may also emit on re-throw |

Mode `cheap` sets `console: false` by default.

## Verification

| Test file                                         | What it proves                        |
| ------------------------------------------------- | ------------------------------------- |
| `tests/unit/middleware/audit-logging.test.ts`     | Custom sink receives lifecycle events |
| `tests/unit/middleware/output-guardrails.test.ts` | Guard audit on stream                 |
| `tests/unit/tools/guard-tools.test.ts`            | Tool audit with shared requestId      |

See [Verification matrix](../testing/verification-matrix.md).

## Related docs

- [Tool guards](./tool-guards.md)
- [Configuration](../architecture/configuration.md)
- [Limitations](../design/limitations.md)
