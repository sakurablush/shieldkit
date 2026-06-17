import type { AuditLog, AuditLogLevel, ResolvedShieldConfig } from '../types.js';

export function createAuditEmitter(config: ResolvedShieldConfig['audit']) {
  return (event: Omit<AuditLog, 'timestamp'> & { timestamp?: string }) => {
    if (!config.enabled) {
      return;
    }

    const log: AuditLog = {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    };

    if (config.console) {
      writeConsoleAudit(log, config.logLevel);
    }

    if (config.sink) {
      void Promise.resolve(config.sink(log)).catch(() => undefined);
    }
  };
}

function writeConsoleAudit(log: AuditLog, level: AuditLogLevel): void {
  const payload =
    level === 'detailed'
      ? log
      : {
          type: log.type,
          timestamp: log.timestamp,
          sessionId: log.sessionId,
          modelId: log.modelId,
        };

  console.info('[ai-shield]', JSON.stringify(payload));
}
