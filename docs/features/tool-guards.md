# Tool Guards

## What it does

Wraps AI SDK tool `execute()` functions with invocation policies:

- **Allow list** — only named tools may run
- **Deny list** — named tools are blocked
- **Max calls per request** — limit invocations per tool
- **Require approval** — block until user approves via `experimental_context`

## How it works

`guardTools(tools, options)` in `src/tools/guard-tools.ts`:

1. Creates a `RequestContext` with `requestId`, `sessionId`, `toolCallCounts`
2. Wraps each tool's `execute` function
3. On each invocation, checks policies in order:
   - Allow list (if non-empty, tool must be listed)
   - Deny list
   - Approval (`requireApproval` + `hasToolApproval()`)
   - Max calls counter
4. Emits `tool.executed` or `tool.blocked` audit events
5. Calls original `execute` if all checks pass

### Approval detection

`hasToolApproval()` checks `experimental_context`:

```ts
// Either form works:
experimental_context: {
  approved: true;
}
experimental_context: {
  aiShield: {
    approved: true;
  }
}
```

Pass approval when the AI SDK invokes the tool after user confirmation in your UI.

### Audit correlation

One `requestId` is shared for all tools in a single `guardTools()` call. Pass the same `requestId` to `providerOptions.aiShield` to correlate with model audit events.

## Why this approach

Tools execute outside the model middleware chain — the AI SDK agent loop calls `execute` directly. Wrapping at the tool level is the correct interception point.

Policies are orthogonal to prompt/output guards: you may block dangerous tools while allowing benign generation.

## Configuration

```ts
import { guardTools, shield } from 'ai-shield';
import { tool, generateText } from 'ai';
import { z } from 'zod';

const tools = guardTools(
  {
    search: tool({
      description: 'Search the web',
      inputSchema: z.object({ q: z.string() }),
      execute: async ({ q }) => ({ results: [q] }),
    }),
    deleteFile: tool({
      description: 'Delete a file',
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => ({ deleted: path }),
    }),
  },
  {
    allow: ['search'],
    deny: ['deleteFile'],
    maxCallsPerRequest: 3,
    requireApproval: true,
    requestId: 'req-abc',
    sessionId: 'user-123',
    onBlocked: (toolName, reason) => console.warn(toolName, reason),
    auditSink: (log) => myLogger.info(log),
  },
);

await generateText({
  model: shield(baseModel),
  tools,
  prompt: 'Search for ai-shield',
  providerOptions: {
    aiShield: { sessionId: 'user-123', requestId: 'req-abc' },
  },
});
```

| Option               | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `allow`              | If set, only these tool names may execute     |
| `deny`               | Blocked tool names                            |
| `maxCallsPerRequest` | Per-tool call limit per agent request         |
| `requireApproval`    | Require `experimental_context.approved`       |
| `requestId`          | Audit correlation (auto-generated if omitted) |
| `sessionId`          | Audit correlation                             |
| `userId`             | Audit correlation                             |
| `onBlocked`          | Callback on policy violation                  |
| `auditSink`          | Custom audit handler for tool events          |

## Errors and edge cases

| Situation              | Behavior                                    |
| ---------------------- | ------------------------------------------- |
| Tool not in allow list | `ShieldToolError`: "Tool not in allow list" |
| Tool in deny list      | `ShieldToolError`: "Tool is denied"         |
| No approval            | `ShieldToolError`: "Tool requires approval" |
| Max calls exceeded     | `ShieldToolError`: "Max calls exceeded (N)" |
| Tool without `execute` | Passed through unwrapped                    |

`ShieldToolError` includes `toolName` and `reason`.

## Verification

| Test file                              | What it proves                                                    |
| -------------------------------------- | ----------------------------------------------------------------- |
| `tests/unit/tools/guard-tools.test.ts` | Allow, deny, max calls, approval, audit correlation, record shape |

See [Verification matrix](../testing/verification-matrix.md).

## Related docs

- [Audit logging](./audit-logging.md)
- [Examples](../examples/index.md)
- [API reference](../api/reference.md)
