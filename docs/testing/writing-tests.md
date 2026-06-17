# Writing Tests

Patterns and conventions for adding tests to ai-shield.

## Test framework

- **Runner:** Vitest 4.x
- **Style:** `describe` / `it` blocks, no globals (`globals: false`)
- **Imports:** Explicit `import { describe, expect, it } from 'vitest'`

## Mock model helper

Use `createMockModel` from `tests/helpers/mock-model.ts` for deterministic model responses:

```ts
import { createMockModel } from '../../helpers/mock-model.js';
import { shield } from '../../src/shield.js';
import { generateText } from 'ai';

const model = shield(createMockModel({ text: 'Hello world' }), {
  mode: 'custom',
  audit: { console: false },
});

const result = await generateText({
  model,
  prompt: 'test',
  providerOptions: { aiShield: { sessionId: 'test-session' } },
});

expect(result.text).toContain('Hello world');
```

### Mock model options

| Option    | Type                                            | Purpose                              |
| --------- | ----------------------------------------------- | ------------------------------------ |
| `text`    | `string \| (prompt) => string`                  | Response text (static or dynamic)    |
| `modelId` | `string`                                        | Model identifier for cost estimation |
| `usage`   | `{ inputTokens?, outputTokens?, totalTokens? }` | Token counts in response             |

Dynamic text is useful for repair tests where the model should return invalid JSON on first call and valid JSON on retry:

```ts
createMockModel({
  text: (prompt) => {
    if (typeof prompt === 'string' && prompt.includes('validation error')) {
      return '{"valid": true}';
    }
    return 'not json';
  },
});
```

## Testing middleware in isolation

Middleware factories accept a `ShieldRuntime`. Build one from resolved config:

```ts
import { resolveConfig } from '../../src/config.js';
import { sessionStore } from '../../src/context.js';
import { createInputGuardrailMiddleware } from '../../src/middleware/input-guardrails.js';

const runtime = {
  config: resolveConfig({ mode: 'strict' }),
  sessionStore,
  emitAudit: vi.fn(),
};

const middleware = createInputGuardrailMiddleware(runtime);
```

For full integration through `shield()`, prefer the mock model approach — it exercises the entire chain.

## Testing audit events

Pass a custom sink or spy on `emitAudit`:

```ts
const auditLogs: AuditLog[] = [];
const model = shield(createMockModel({ text: 'ok' }), {
  mode: 'custom',
  audit: {
    console: false,
    sink: (log) => auditLogs.push(log),
  },
});

// ... run generateText ...

expect(auditLogs.some((l) => l.type === 'request.start')).toBe(true);
expect(auditLogs.some((l) => l.type === 'request.complete')).toBe(true);
```

## Testing errors

Assert specific error types:

```ts
import {
  ShieldBlockedError,
  ShieldBudgetError,
  ShieldRepairError,
  ShieldToolError,
} from '../../src/errors.js';

await expect(generateText({ model, prompt: injectionPrompt })).rejects.toBeInstanceOf(
  ShieldBlockedError,
);
```

## Session state

Reset or isolate sessions between tests:

```ts
import { createShieldContext, resetSession, sessionStore } from '../../src/context.js';

beforeEach(() => {
  sessionStore.clear();
});

// or per test:
createShieldContext('budget-test');
```

## Streaming tests

Use `streamText` and await `result.text` to consume the full stream:

```ts
const result = streamText({
  model,
  prompt: 'test',
  providerOptions: { aiShield: { sessionId: 'stream-test' } },
});

const text = await result.text;
expect(text).not.toContain('user@example.com');
```

Remember: shield buffers streams before output guards run.

## Verbose test logging

Use `TEST_VERBOSE=1` to print runtime decisions during tests (audit chains, contrast deltas, red team lines). Default CI runs are silent.

```bash
TEST_VERBOSE=1 npm run test:run
TEST_VERBOSE=1 npm run test -- tests/unit/middleware/cost-warn.test.ts
```

`CONTRAST_VERBOSE=1` is an alias. Helpers: `tests/helpers/test-logger.ts`, `tests/helpers/security-logger.ts`.

## Positive and negative cases

Every new capability should have at least:

1. **Positive** — allow, redact, repair success, or expected transform
2. **Negative** — block, budget exceeded, repair exhausted, or tool denied

Record both in [unit-coverage-audit.md](./unit-coverage-audit.md).

## Adding a new test

1. Place unit tests in `tests/unit/` mirroring `src/` structure
2. Name files `*.test.ts`
3. Update [verification-matrix.md](./verification-matrix.md) and [unit-coverage-audit.md](./unit-coverage-audit.md) with the new capability row
4. Run `npm run ci` before submitting

## Related docs

- [Running tests](./running-tests.md)
- [Verification matrix](./verification-matrix.md)
- [Unit coverage audit](./unit-coverage-audit.md)
