# API Reference

Public exports from the **shieldkit** npm package (`src/index.ts`).

## Functions

### `shield(model, config?)`

Wraps a `LanguageModelV3` with the full middleware chain.

| Parameter | Type            | Description                         |
| --------- | --------------- | ----------------------------------- |
| `model`   | `LanguageModel` | Base model from any AI SDK provider |
| `config`  | `ShieldConfig?` | Optional shield configuration       |

**Returns:** `LanguageModel` — use with `generateText`, `streamText`, etc.

**See:** [Architecture overview](../architecture/overview.md) · [Verification matrix](../testing/verification-matrix.md#feature-coverage)

---

### `shieldGenerateText(params)`

Like `generateText`, with extra retry handling when `NoObjectGeneratedError` is thrown.

| Parameter                  | Type                 | Description                  |
| -------------------------- | -------------------- | ---------------------------- |
| `params`                   | `GenerateTextParams` | Standard AI SDK params       |
| `params.model`             | `LanguageModel`      | Shield-wrapped model         |
| `params.config`            | `ShieldConfig?`      | Repair config override       |
| `params.outputSchema`      | `z.ZodType?`         | Schema for validation/repair |
| `params.maxRepairAttempts` | `number?`            | Override `maxAttempts`       |

**Returns:** `Promise<GenerateTextResult>`

**Throws:** `ShieldRepairError` when retries are exhausted

**See:** [Structured output](../features/structured-output.md)

---

### `shieldStreamText(params)`

Like `streamText`, merging `outputSchema` into `providerOptions.aiShield`.

| Parameter             | Type               | Description                  |
| --------------------- | ------------------ | ---------------------------- |
| `params`              | `StreamTextParams` | Standard AI SDK params       |
| `params.model`        | `LanguageModel`    | Shield-wrapped model         |
| `params.outputSchema` | `z.ZodType?`       | Schema for repair middleware |

**Returns:** `StreamTextResult`

**Note:** No dedicated test coverage — see [verification matrix](../testing/verification-matrix.md#non-guarantees-explicit-gaps).

---

### `guardTools(tools, options?)`

Wraps tool `execute` functions with invocation policies.

| Parameter | Type                   | Description                  |
| --------- | ---------------------- | ---------------------------- |
| `tools`   | `Record<string, Tool>` | AI SDK tool definitions      |
| `options` | `ToolGuardOptions?`    | Allow/deny, limits, approval |

**Returns:** Same tool record shape with wrapped `execute` functions.

**See:** [Tool guards](../features/tool-guards.md)

---

### `resolveConfig(config?)`

Resolves `ShieldConfig` to a fully merged `ResolvedShieldConfig` without wrapping a model.

**See:** [Configuration](../architecture/configuration.md)

---

### Session helpers

| Function                          | Description                                                 |
| --------------------------------- | ----------------------------------------------------------- |
| `createShieldContext(sessionId?)` | Initialize or reset session state (default ID: `"default"`) |
| `getOrCreateSession(sessionId?)`  | Get existing session or create new                          |
| `resetSession(sessionId)`         | Delete session from store                                   |
| `createRequestContext(options)`   | Build per-request context from `ShieldProviderOptions`      |
| `sessionStore`                    | In-memory `Map<string, SessionState>` (advanced use)        |

**See:** [Cost tracking](../features/cost-tracking.md)

---

## Error classes

All extend `AISDKError` from `@ai-sdk/provider`.

### `ShieldBlockedError`

Guard blocked the request (input or output).

| Property  | Type     | Description                                 |
| --------- | -------- | ------------------------------------------- |
| `guard`   | `string` | Guard name (`injection`, `pii`, `keywords`) |
| `summary` | `string` | Human-readable reason                       |

---

### `ShieldBudgetError`

Session cost budget exceeded.

| Property       | Type     | Description                |
| -------------- | -------- | -------------------------- |
| `sessionId`    | `string` | Session key                |
| `totalCostUsd` | `number` | Current or projected total |
| `maxCostUsd`   | `number` | Configured limit           |

---

### `ShieldRepairError`

Structured output repair exhausted all attempts.

| Property      | Type      | Description            |
| ------------- | --------- | ---------------------- |
| `partialText` | `string`  | Last model output      |
| `attempts`    | `number`  | Total attempts made    |
| `lastError`   | `string`  | Final validation error |
| `usage`       | `object?` | Merged token usage     |

---

### `ShieldToolError`

Tool policy violation.

| Property   | Type     | Description   |
| ---------- | -------- | ------------- |
| `toolName` | `string` | Blocked tool  |
| `reason`   | `string` | Policy reason |

---

## Types

### `ShieldConfig`

Top-level configuration passed to `shield()`.

```ts
interface ShieldConfig {
  mode?: ShieldMode;
  guardrails?: GuardrailsConfig;
  cost?: CostConfig;
  audit?: AuditConfig;
}
```

### `ShieldMode`

`'balanced' | 'strict' | 'cheap' | 'local' | 'custom'`

### `GuardAction`

`'block' | 'redact' | 'warn'`

### `GuardrailsConfig`

```ts
interface GuardrailsConfig {
  input?: {
    injection?: InjectionGuardConfig;
    pii?: PiiGuardConfig;
    keywords?: KeywordsGuardConfig;
  };
  output?: {
    repair?: RepairConfig;
    pii?: PiiGuardConfig;
    keywords?: KeywordsGuardConfig;
  };
}
```

### `RepairConfig`

```ts
interface RepairConfig {
  enabled?: boolean;
  maxAttempts?: number;
  includePartialInRetry?: boolean; // default: true
}
```

### `CostConfig`

```ts
interface CostConfig {
  maxCostPerSession?: number;
  trackOnly?: boolean;
  warnAtPercent?: number;
  pricing?: Record<string, ModelPricing>;
  defaultPricing?: ModelPricing;
}
```

### `AuditConfig`

```ts
interface AuditConfig {
  enabled?: boolean;
  logLevel?: 'basic' | 'detailed';
  sink?: (log: AuditLog) => void | Promise<void>;
  console?: boolean;
}
```

### `ShieldProviderOptions`

Per-request options via `providerOptions.aiShield`:

```ts
interface ShieldProviderOptions {
  sessionId?: string;
  userId?: string;
  requestId?: string;
  approved?: boolean;
  metadata?: Record<string, unknown>;
  outputSchema?: z.ZodType;
}
```

### `SessionState`

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

### `AuditLog`

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

### `AuditEventType`

`'request.start' | 'request.complete' | 'request.blocked' | 'guard.triggered' | 'repair.attempt' | 'repair.success' | 'repair.failed' | 'cost.recorded' | 'budget.exceeded' | 'budget.warn' | 'tool.executed' | 'tool.blocked'`

### `ToolGuardOptions`

```ts
interface ToolGuardOptions {
  allow?: string[];
  deny?: string[];
  maxCallsPerRequest?: number;
  requireApproval?: boolean;
  requestId?: string;
  sessionId?: string;
  userId?: string;
  onBlocked?: (toolName: string, reason: string) => void;
  auditSink?: (log: AuditLog) => void | Promise<void>;
}
```

### Other exported types

| Type                   | Description                                |
| ---------------------- | ------------------------------------------ | ----------- |
| `ResolvedShieldConfig` | Fully merged config from `resolveConfig()` |
| `RequestContext`       | Internal per-request state                 |
| `GuardResult`          | Result from a guard function               |
| `ModelPricing`         | `{ inputPer1M?, outputPer1M? }`            |
| `LanguageModel`        | Alias for `LanguageModelV3`                |
| `ShieldRuntime`        | Shared middleware runtime (advanced)       |
| `AuditLogLevel`        | `'basic'                                   | 'detailed'` |

## Feature cross-reference

| Symbol        | Feature doc                                              |
| ------------- | -------------------------------------------------------- |
| Input guards  | [input-guardrails.md](../features/input-guardrails.md)   |
| Output guards | [output-guardrails.md](../features/output-guardrails.md) |
| Repair        | [structured-output.md](../features/structured-output.md) |
| Cost          | [cost-tracking.md](../features/cost-tracking.md)         |
| Audit         | [audit-logging.md](../features/audit-logging.md)         |
| Tools         | [tool-guards.md](../features/tool-guards.md)             |
