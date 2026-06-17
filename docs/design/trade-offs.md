# Trade-offs

Explicit design decisions in shieldkit and their consequences.

## Regex-based injection detection

**Decision:** Weighted regex patterns with a cumulative score threshold (`src/guards/injection.ts`).

| Benefit                              | Cost                                             |
| ------------------------------------ | ------------------------------------------------ |
| Fast, deterministic, no external API | Not ML-grade; evolvable attacks may bypass       |
| Zero latency overhead                | False positives on benign text matching patterns |
| Easy to test and audit               | Requires threshold tuning per deployment         |

**Alternatives considered:** LLM-based classifiers (latency, cost, non-determinism), external WAF services (infrastructure dependency).

**Recommendation:** Use shieldkit injection guards as a first line; add provider-level safety and human review for high-risk applications.

## In-memory session store

**Decision:** `Map<string, SessionState>` in `src/context.ts`, keyed by `sessionId`.

| Benefit                                         | Cost                                   |
| ----------------------------------------------- | -------------------------------------- |
| Simple, no external dependency                  | Not shared across serverless instances |
| Fast lookups                                    | Budget resets on cold start            |
| Sufficient for single-process dev/small deploys | No persistence across restarts         |

**Mitigation:** Use sticky `sessionId` per user conversation; treat budgets as best-effort in multi-instance deployments; plan a pluggable store post-v1.

## Stream repair: buffer-then-emit

**Decision:** Collect the full stream, repair/validate, apply output guards, then re-emit (`src/middleware/output-guardrails.ts`).

| Benefit                            | Cost                                                 |
| ---------------------------------- | ---------------------------------------------------- |
| Correct JSON/schema validation     | Client sees no tokens until stream completes         |
| Output guards run on complete text | Higher time-to-first-token                           |
| Simpler than incremental repair    | Not suitable for real-time UX requiring early tokens |

**When to accept:** Structured output and guardrail correctness matter more than streaming UX.

## Repair retry bypasses middleware

**Decision:** First attempt uses full middleware chain; retries call `model.doGenerate()` directly (`src/middleware/repair.ts`).

| Benefit                                                                       | Cost                                                       |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Avoids re-running input guards on repair prompts (which contain prior output) | Retries skip pre-call budget check                         |
| Faster retries                                                                | Retries skip audit `request.start`                         |
| Prevents infinite guard/repair loops                                          | Retry prompts may contain sensitive text from prior output |

**Mitigation:** Set `includePartialInRetry: false` in strict mode; use `maxAttempts` limits; monitor via `repair.attempt` audit events.

## Heuristic token estimation

**Decision:** Pre-call budget checks use chars-per-token ratios per model (`src/utils/token-estimator.ts`), not provider tokenizer APIs.

| Benefit                   | Cost                                                   |
| ------------------------- | ------------------------------------------------------ |
| No tokenizer dependency   | Estimates can be wrong by 10–30%                       |
| Works offline with Ollama | May block slightly early or allow slightly over budget |
| Fast                      | Unknown models fall back to chars/4                    |

Post-call recording uses actual usage from the provider when available.

## Default pricing fallbacks

**Decision:** Unknown models use $0.15/$0.60 per 1M input/output tokens.

| Benefit                                 | Cost                                                         |
| --------------------------------------- | ------------------------------------------------------------ |
| Budget enforcement works out of the box | Inaccurate for expensive or free models                      |
| Override via `cost.pricing`             | Local Ollama models still accumulate "cost" at default rates |

Use `trackOnly: true` (local mode) when cost enforcement is not meaningful.

## Keyword deny lists

**Decision:** Word-boundary regex matching against a configurable deny list.

| Benefit             | Cost                                                    |
| ------------------- | ------------------------------------------------------- |
| Simple, predictable | Substring false positives without careful list curation |
| No ML dependency    | Easy to circumvent with spelling variants               |

## Audit to console by default

**Decision:** `audit.console: true` in balanced mode.

| Benefit                             | Cost                               |
| ----------------------------------- | ---------------------------------- |
| Immediate visibility in development | Console noise in production        |
| No sink required to get started     | Not structured for log aggregation |

Disable console (`console: false`) and use `audit.sink` in production.

## Related docs

- [Limitations](./limitations.md)
- [Request lifecycle](../architecture/request-lifecycle.md)
- [Verification matrix](../testing/verification-matrix.md)
