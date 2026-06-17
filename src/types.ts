import type { LanguageModelV3 } from '@ai-sdk/provider';
import type { z } from 'zod';

export type ShieldMode = 'balanced' | 'strict' | 'cheap' | 'local' | 'custom';

export type GuardAction = 'block' | 'redact' | 'warn';

export interface InjectionGuardConfig {
  enabled?: boolean;
  action?: GuardAction;
  threshold?: number;
}

export interface PiiGuardConfig {
  enabled?: boolean;
  action?: GuardAction;
}

export interface KeywordsGuardConfig {
  enabled?: boolean;
  deny?: string[];
  action?: GuardAction;
}

export interface InputGuardrailsConfig {
  injection?: InjectionGuardConfig;
  pii?: PiiGuardConfig;
  keywords?: KeywordsGuardConfig;
}

export interface RepairConfig {
  enabled?: boolean;
  maxAttempts?: number;
  /** When false, retry prompts omit the model's previous invalid output (safer for PII). Default: true. */
  includePartialInRetry?: boolean;
}

export interface OutputGuardrailsConfig {
  repair?: RepairConfig;
  pii?: PiiGuardConfig;
  keywords?: KeywordsGuardConfig;
}

export interface GuardrailsConfig {
  input?: InputGuardrailsConfig;
  output?: OutputGuardrailsConfig;
}

export interface ModelPricing {
  inputPer1M?: number;
  outputPer1M?: number;
}

export interface CostConfig {
  maxCostPerSession?: number;
  trackOnly?: boolean;
  warnAtPercent?: number;
  pricing?: Record<string, ModelPricing>;
  defaultPricing?: ModelPricing;
}

export type AuditLogLevel = 'basic' | 'detailed';

export type AuditEventType =
  | 'request.start'
  | 'request.complete'
  | 'request.blocked'
  | 'guard.triggered'
  | 'repair.attempt'
  | 'repair.success'
  | 'repair.failed'
  | 'cost.recorded'
  | 'budget.exceeded'
  | 'budget.warn'
  | 'tool.executed'
  | 'tool.blocked';

export interface AuditLog {
  type: AuditEventType;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  requestId?: string;
  modelId?: string;
  details?: Record<string, unknown>;
}

export interface AuditConfig {
  enabled?: boolean;
  logLevel?: AuditLogLevel;
  sink?: (log: AuditLog) => void | Promise<void>;
  console?: boolean;
}

export interface ShieldConfig {
  mode?: ShieldMode;
  guardrails?: GuardrailsConfig;
  cost?: CostConfig;
  audit?: AuditConfig;
}

export interface ResolvedShieldConfig {
  mode: ShieldMode;
  guardrails: Required<{
    input: Required<{
      injection: Required<InjectionGuardConfig>;
      pii: Required<PiiGuardConfig>;
      keywords: Required<KeywordsGuardConfig>;
    }>;
    output: Required<{
      repair: Required<RepairConfig>;
      pii: Required<PiiGuardConfig>;
      keywords: Required<KeywordsGuardConfig>;
    }>;
  }>;
  cost: Required<CostConfig> & {
    pricing: Record<string, ModelPricing>;
    defaultPricing: ModelPricing;
  };
  audit: Required<Omit<AuditConfig, 'sink'>> & Pick<AuditConfig, 'sink'>;
}

export interface GuardResult {
  guard: string;
  triggered: boolean;
  action: GuardAction;
  summary?: string;
  modifiedText?: string;
}

export interface ShieldProviderOptions {
  sessionId?: string;
  userId?: string;
  requestId?: string;
  approved?: boolean;
  metadata?: Record<string, unknown>;
  outputSchema?: z.ZodType;
}

export interface SessionState {
  sessionId: string;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
  budgetExceeded: boolean;
}

export interface RequestContext {
  sessionId: string;
  userId?: string;
  requestId: string;
  toolCallCounts: Record<string, number>;
  approved: boolean;
  metadata?: Record<string, unknown>;
  outputSchema?: z.ZodType;
}

export interface RepairResult {
  text: string;
  repaired: boolean;
  attempts: number;
  lastError?: string;
}

export interface ToolGuardOptions {
  allow?: string[];
  deny?: string[];
  maxCallsPerRequest?: number;
  requireApproval?: boolean;
  /** Correlates tool audit events with a model request (defaults to one ID per `guardTools()` call). */
  requestId?: string;
  sessionId?: string;
  userId?: string;
  onBlocked?: (toolName: string, reason: string) => void;
  auditSink?: (log: AuditLog) => void | Promise<void>;
}

export interface ShieldRuntime {
  config: ResolvedShieldConfig;
  sessionStore: Map<string, SessionState>;
  emitAudit: (log: Omit<AuditLog, 'timestamp'> & { timestamp?: string }) => void;
}

export type LanguageModel = LanguageModelV3;
