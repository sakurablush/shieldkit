# Security Policy

ai-shield provides **basic guardrails** for AI SDK applications. It is not a complete security product. Read [limitations](./design/limitations.md) before relying on it for compliance or threat prevention.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a vulnerability

If you believe you have found a security issue in ai-shield:

1. **Do not** open a public GitHub issue for exploitable vulnerabilities.
2. Contact the repository maintainer privately with:
   - A description of the issue
   - Steps to reproduce
   - Impact assessment
   - Affected versions
3. Allow reasonable time for a fix before public disclosure.

Use GitHub **Security → Advisories → Report a vulnerability** when available.

## Scope

### In scope

- Bypass of input/output guardrails when used as documented
- Session budget or audit logging flaws
- Tool guard bypass (`guardTools`)
- Structured output repair leaking sensitive data unexpectedly

### Out of scope

- Prompt injection that defeats regex/heuristic guards (documented limitation)
- Provider API security
- Consumer misconfiguration (disabled guards, missing `sessionId`, etc.)

## Production recommendations

1. Use `strict` mode with `includePartialInRetry: false` when outputs may contain PII
2. Combine with provider-level safety features
3. Route audit logs to a retained, access-controlled sink
4. Treat serverless budgets as best-effort — see [limitations](./design/limitations.md)
5. Require human approval for high-risk tools

## Related

- [Limitations](./design/limitations.md)
- [Trade-offs](./design/trade-offs.md)
- [Verification matrix](./testing/verification-matrix.md)
