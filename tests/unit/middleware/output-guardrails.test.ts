import { streamText } from 'ai';
import { describe, expect, it } from 'vitest';

import type { AuditLog } from '../../../src/types.js';
import { shield } from '../../../src/shield.js';
import { createMockModel } from '../../helpers/mock-model.js';

describe('output guardrails stream path', () => {
  it('redacts PII in streamed output', async () => {
    const model = createMockModel({ text: 'Reach me at secret@example.com today.' });
    const safeModel = shield(model, {
      guardrails: {
        input: {
          injection: { enabled: false },
          pii: { enabled: false },
          keywords: { enabled: false, deny: [] },
        },
        output: {
          repair: { enabled: false },
          pii: { enabled: true, action: 'redact' },
          keywords: { enabled: false, deny: [] },
        },
      },
      audit: { console: false },
    });

    const result = streamText({
      model: safeModel,
      prompt: 'Give contact info',
    });

    const text = await result.text;
    expect(text).toContain('[REDACTED_PII:email]');
    expect(text).not.toContain('secret@example.com');
  });

  it('blocks forbidden keywords in streamed output', async () => {
    const model = createMockModel({ text: 'This output mentions forbidden content.' });
    const safeModel = shield(model, {
      guardrails: {
        input: {
          injection: { enabled: false },
          pii: { enabled: false },
          keywords: { enabled: false, deny: [] },
        },
        output: {
          repair: { enabled: false },
          pii: { enabled: false },
          keywords: { enabled: true, deny: ['forbidden'], action: 'block' },
        },
      },
      audit: { console: false },
    });

    await expect(
      streamText({
        model: safeModel,
        prompt: 'Say something',
      }).text,
    ).rejects.toThrow();
  });

  it('emits guard audit events for streamed output', async () => {
    const auditLogs: AuditLog[] = [];
    const model = createMockModel({ text: 'Email: leak@corp.com' });

    const safeModel = shield(model, {
      guardrails: {
        input: {
          injection: { enabled: false },
          pii: { enabled: false },
          keywords: { enabled: false, deny: [] },
        },
        output: {
          repair: { enabled: false },
          pii: { enabled: true, action: 'redact' },
          keywords: { enabled: false, deny: [] },
        },
      },
      audit: {
        console: false,
        sink: (log) => {
          auditLogs.push(log);
        },
      },
    });

    await streamText({ model: safeModel, prompt: 'test' }).text;

    expect(auditLogs.some((log) => log.type === 'guard.triggered')).toBe(true);
  });
});
