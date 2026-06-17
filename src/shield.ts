import { wrapLanguageModel, extractJsonMiddleware } from 'ai';

import { resolveConfig } from './config.js';
import { sessionStore } from './context.js';
import { createAuditLoggingMiddleware } from './middleware/audit-logging.js';
import { createCostTrackingMiddleware } from './middleware/cost-tracking.js';
import { createInputGuardrailMiddleware } from './middleware/input-guardrails.js';
import { createOutputGuardrailMiddleware } from './middleware/output-guardrails.js';
import type { LanguageModel, ShieldConfig, ShieldRuntime } from './types.js';
import { createAuditEmitter } from './utils/audit.js';

export function shield(model: LanguageModel, config?: ShieldConfig): LanguageModel {
  const resolved = resolveConfig(config);
  const emitAudit = createAuditEmitter(resolved.audit);

  const runtime: ShieldRuntime = {
    config: resolved,
    sessionStore,
    emitAudit,
  };

  const middleware = [
    createInputGuardrailMiddleware(runtime),
    createCostTrackingMiddleware(runtime),
    createAuditLoggingMiddleware(runtime),
    createOutputGuardrailMiddleware(runtime),
    extractJsonMiddleware(),
  ];

  return wrapLanguageModel({
    model,
    middleware,
  });
}
