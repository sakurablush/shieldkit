import type { ResolvedShieldConfig, ShieldConfig, ShieldMode } from './types.js';
import { deepMerge } from './utils/deep-merge.js';

const DEFAULT_PRICING = {
  inputPer1M: 0.15,
  outputPer1M: 0.6,
};

const MODE_PRESETS: Record<Exclude<ShieldMode, 'custom'>, Partial<ShieldConfig>> = {
  balanced: {
    guardrails: {
      input: {
        injection: { enabled: true, action: 'block' },
        pii: { enabled: true, action: 'redact' },
        keywords: { enabled: false, deny: [], action: 'block' },
      },
      output: {
        repair: { enabled: true, maxAttempts: 2 },
        pii: { enabled: true, action: 'redact' },
        keywords: { enabled: false, deny: [], action: 'warn' },
      },
    },
    cost: {
      maxCostPerSession: 1,
      trackOnly: false,
      warnAtPercent: 80,
    },
    audit: {
      enabled: true,
      logLevel: 'basic',
      console: true,
    },
  },
  strict: {
    guardrails: {
      input: {
        injection: { enabled: true, action: 'block', threshold: 0.4 },
        pii: { enabled: true, action: 'block' },
        keywords: { enabled: false, deny: [], action: 'block' },
      },
      output: {
        repair: { enabled: true, maxAttempts: 3, includePartialInRetry: false },
        pii: { enabled: true, action: 'block' },
        keywords: { enabled: false, deny: [], action: 'block' },
      },
    },
    cost: {
      maxCostPerSession: 0.5,
      trackOnly: false,
      warnAtPercent: 70,
    },
    audit: {
      enabled: true,
      logLevel: 'detailed',
      console: true,
    },
  },
  cheap: {
    guardrails: {
      input: {
        injection: { enabled: true, action: 'warn' },
        pii: { enabled: false, action: 'redact' },
        keywords: { enabled: false, deny: [], action: 'block' },
      },
      output: {
        repair: { enabled: true, maxAttempts: 1 },
        pii: { enabled: false, action: 'warn' },
        keywords: { enabled: false, deny: [], action: 'warn' },
      },
    },
    cost: {
      maxCostPerSession: 0.1,
      trackOnly: false,
      warnAtPercent: 90,
    },
    audit: {
      enabled: true,
      logLevel: 'basic',
      console: false,
    },
  },
  local: {
    guardrails: {
      input: {
        injection: { enabled: true, action: 'warn', threshold: 0.6 },
        pii: { enabled: true, action: 'redact' },
        keywords: { enabled: false, deny: [], action: 'warn' },
      },
      output: {
        repair: { enabled: true, maxAttempts: 3 },
        pii: { enabled: true, action: 'redact' },
        keywords: { enabled: false, deny: [], action: 'warn' },
      },
    },
    cost: {
      trackOnly: true,
      warnAtPercent: 100,
    },
    audit: {
      enabled: true,
      logLevel: 'detailed',
      console: true,
    },
  },
};

const BASE_DEFAULTS: ShieldConfig = {
  mode: 'balanced',
  guardrails: {
    input: {
      injection: { enabled: true, action: 'block', threshold: 0.5 },
      pii: { enabled: true, action: 'redact' },
      keywords: { enabled: false, deny: [], action: 'block' },
    },
    output: {
      repair: { enabled: true, maxAttempts: 2 },
      pii: { enabled: true, action: 'redact' },
      keywords: { enabled: false, deny: [], action: 'warn' },
    },
  },
  cost: {
    maxCostPerSession: 1,
    trackOnly: false,
    warnAtPercent: 80,
    defaultPricing: DEFAULT_PRICING,
    pricing: {},
  },
  audit: {
    enabled: true,
    logLevel: 'basic',
    console: true,
  },
};

export function resolveConfig(config?: ShieldConfig): ResolvedShieldConfig {
  const mode = config?.mode ?? 'balanced';
  const preset = mode === 'custom' ? {} : MODE_PRESETS[mode];
  const merged = deepMerge(
    deepMerge(
      BASE_DEFAULTS as Record<string, unknown>,
      preset as Record<string, unknown>,
    ),
    (config ?? {}) as Record<string, unknown>,
  ) as ShieldConfig;

  const trackOnly = merged.cost?.trackOnly ?? false;

  return {
    mode,
    guardrails: {
      input: {
        injection: {
          enabled: merged.guardrails?.input?.injection?.enabled ?? true,
          action: merged.guardrails?.input?.injection?.action ?? 'block',
          threshold: merged.guardrails?.input?.injection?.threshold ?? 0.5,
        },
        pii: {
          enabled: merged.guardrails?.input?.pii?.enabled ?? true,
          action: merged.guardrails?.input?.pii?.action ?? 'redact',
        },
        keywords: {
          enabled: merged.guardrails?.input?.keywords?.enabled ?? false,
          deny: merged.guardrails?.input?.keywords?.deny ?? [],
          action: merged.guardrails?.input?.keywords?.action ?? 'block',
        },
      },
      output: {
        repair: {
          enabled: merged.guardrails?.output?.repair?.enabled ?? true,
          maxAttempts: merged.guardrails?.output?.repair?.maxAttempts ?? 2,
          includePartialInRetry:
            merged.guardrails?.output?.repair?.includePartialInRetry ?? true,
        },
        pii: {
          enabled: merged.guardrails?.output?.pii?.enabled ?? true,
          action: merged.guardrails?.output?.pii?.action ?? 'redact',
        },
        keywords: {
          enabled: merged.guardrails?.output?.keywords?.enabled ?? false,
          deny: merged.guardrails?.output?.keywords?.deny ?? [],
          action: merged.guardrails?.output?.keywords?.action ?? 'warn',
        },
      },
    },
    cost: {
      maxCostPerSession: trackOnly
        ? Number.POSITIVE_INFINITY
        : (merged.cost?.maxCostPerSession ?? 1),
      trackOnly,
      warnAtPercent: merged.cost?.warnAtPercent ?? 80,
      pricing: merged.cost?.pricing ?? {},
      defaultPricing: merged.cost?.defaultPricing ?? DEFAULT_PRICING,
    },
    audit: {
      enabled: merged.audit?.enabled ?? true,
      logLevel: merged.audit?.logLevel ?? 'basic',
      sink: merged.audit?.sink,
      console: merged.audit?.console ?? true,
    },
  };
}
