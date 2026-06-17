import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAuditEmitter } from '../../../src/utils/audit.js';

describe('audit emitter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes basic console audit when enabled', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const emit = createAuditEmitter({
      enabled: true,
      console: true,
      logLevel: 'basic',
    });

    emit({ type: 'request.start', modelId: 'm1' });

    expect(info).toHaveBeenCalled();
    const payload = JSON.parse(String(info.mock.calls[0]?.[1]));
    expect(payload.type).toBe('request.start');
  });

  it('writes detailed console audit with full payload', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const emit = createAuditEmitter({
      enabled: true,
      console: true,
      logLevel: 'detailed',
    });

    emit({ type: 'cost.recorded', modelId: 'm1', details: { costUsd: 0.01 } });

    const logged = info.mock.calls[0]?.[1];
    expect(String(logged)).toContain('costUsd');
  });

  it('swallows sink errors without throwing', async () => {
    const emit = createAuditEmitter({
      enabled: true,
      console: false,
      logLevel: 'basic',
      sink: () => Promise.reject(new Error('sink failed')),
    });

    expect(() => emit({ type: 'request.start' })).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));
  });

  it('no-ops when audit is disabled', () => {
    const sink = vi.fn();
    const emit = createAuditEmitter({
      enabled: false,
      console: false,
      logLevel: 'basic',
      sink,
    });
    emit({ type: 'request.start' });
    expect(sink).not.toHaveBeenCalled();
  });
});
