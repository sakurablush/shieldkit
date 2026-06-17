import { describe, expect, it, vi } from 'vitest';

import { resolveConfig } from '../../../src/config.js';
import { ShieldBlockedError } from '../../../src/errors.js';
import {
  applyOutputGuardsToGenerateResult,
  applyOutputTextGuards,
} from '../../../src/utils/output-guards.js';
import { createAuditEmitter } from '../../../src/utils/audit.js';
import { logAuditEvents } from '../../helpers/test-logger.js';

describe('output guards', () => {
  const baseConfig = resolveConfig({
    guardrails: {
      input: {
        injection: { enabled: false },
        pii: { enabled: false },
        keywords: { enabled: false, deny: [] },
      },
      output: {
        repair: { enabled: false },
        pii: { enabled: true, action: 'redact' },
        keywords: { enabled: true, deny: ['forbidden'], action: 'block' },
      },
    },
  });

  it('redacts PII in generate output text', () => {
    const events: Array<{ type: string }> = [];
    const emitAudit = createAuditEmitter({
      enabled: true,
      console: false,
      logLevel: 'basic',
      sink: (log) => events.push(log),
    });

    const next = applyOutputTextGuards({
      text: 'Contact leak@corp.com',
      outputConfig: baseConfig.guardrails.output,
      emitAudit,
      shieldOptions: { sessionId: 'out-gen' },
      modelId: 'mock',
    });

    expect(next).toContain('[REDACTED_PII:email]');
    logAuditEvents('output-guards', events);
    expect(events.some((e) => e.type === 'guard.triggered')).toBe(true);
  });

  it('blocks forbidden keywords in generate output', () => {
    const emitAudit = vi.fn();
    expect(() =>
      applyOutputTextGuards({
        text: 'This is forbidden content',
        outputConfig: baseConfig.guardrails.output,
        emitAudit,
        shieldOptions: {},
        modelId: 'mock',
      }),
    ).toThrow(ShieldBlockedError);
  });

  it('applies guards to generate result content', () => {
    const emitAudit = vi.fn();
    const result = applyOutputGuardsToGenerateResult(
      { content: [{ type: 'text', text: 'mail@test.com' }] },
      {
        outputConfig: baseConfig.guardrails.output,
        emitAudit,
        shieldOptions: {},
        modelId: 'mock',
      },
    );
    const text = result.content.find((p) => p.type === 'text')?.text;
    expect(text).toContain('[REDACTED_PII:email]');
  });
});
