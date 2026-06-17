import type { AuditLog } from '../../src/types.js';

export function createAuditCapture(): {
  logs: AuditLog[];
  sink: (log: AuditLog) => void;
} {
  const logs: AuditLog[] = [];
  return {
    logs,
    sink: (log) => {
      logs.push(log);
    },
  };
}

export function auditEventTypes(logs: AuditLog[]): string[] {
  return logs.map((log) => log.type);
}
