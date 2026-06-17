# Limitations

What shieldkit does **not** guarantee. Read this before deploying to production.

## Security scope

shieldkit provides **basic compliance helpers**, not a complete security program.

| Provided                                             | Not provided                         |
| ---------------------------------------------------- | ------------------------------------ |
| Heuristic prompt injection detection                 | Guaranteed jailbreak prevention      |
| Regex PII detection (email, phone, SSN, credit card) | Comprehensive data loss prevention   |
| Keyword deny lists                                   | Content moderation at scale          |
| Audit event emission                                 | SIEM integration, retention policies |
| Session cost budgets (in-memory)                     | Billing enforcement across instances |

**This is not legal advice.** Compliance requirements (GDPR, HIPAA, PCI) depend on your full system design, data flows, and organizational controls.

## Injection guard limitations

- Pattern-based detection only; novel attacks may not match
- Threshold tuning required (`0.4` strict, `0.5` default, `0.6` local)
- `warn` action logs but does not block
- Repair retry prompts can re-send model output that bypassed input guards on retry

## PII guard limitations

Detected types: email, phone (US-style), SSN, credit card (with Luhn validation).

Not detected: names, addresses, medical records, API keys, custom entity types, non-English formats.

Redaction replaces matches with `[REDACTED_PII:type]` — the model may still infer sensitive context from surrounding text.

## Serverless and multi-instance deployments

Session state lives in a process-local `Map`:

- Each serverless instance tracks its own budget
- Cold starts reset in-memory state unless you call `createShieldContext` per request
- `sessionId` must be consistent per user conversation for best-effort budgeting

**Workaround:** Use sticky sessions, or treat `maxCostPerSession` as approximate until a pluggable persistent store ships.

## Streaming UX

Streaming is **buffered** for repair and output guards. Clients do not receive partial tokens during guard processing. Not suitable when sub-second time-to-first-token is critical.

## Repair loop limitations

- Retries bypass input guards and pre-call budget checks
- `maxAttempts` caps total tries (first attempt + retries)
- Schema validation requires valid JSON after repair; severely malformed output may still fail
- `shieldStreamText` merges `outputSchema` into provider options but has no dedicated test coverage

## Provider coverage

- Tested primarily with mock models (unit) and Ollama (integration)
- No automated tests against OpenAI, Anthropic, or Google APIs in CI
- Provider-specific response formats may affect repair behavior

## Tool guards

- Approval requires `experimental_context` (experimental AI SDK hook)
- `guardTools` does not inspect tool **results**, only invocation policy
- No sandboxing of tool execution

## Audit logging

- `basic` vs `detailed` levels control field verbosity, not retention
- Custom sinks are fire-and-forget (errors in async sinks are swallowed in tool guards)
- No built-in PII scrubbing in audit payloads — guard `details` may contain matched patterns

## Production hardening recommendations

1. Add provider-level safety features (OpenAI moderation, Anthropic safety, etc.)
2. Use `strict` mode with `includePartialInRetry: false` for sensitive data
3. Configure custom `audit.sink` to your logging pipeline
4. Set per-model `cost.pricing` for accurate budgets
5. Enable keyword deny lists for domain-specific terms
6. Add human-in-the-loop approval for high-risk tools
7. Do not rely solely on regex PII for regulatory compliance

## Related docs

- [Trade-offs](./trade-offs.md)
- [Verification matrix](../testing/verification-matrix.md)
- [Configuration](../architecture/configuration.md)
