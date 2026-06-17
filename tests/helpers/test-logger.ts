const verbose =
  process.env.TEST_VERBOSE === '1' || process.env.CONTRAST_VERBOSE === '1';

export function isTestVerbose(): boolean {
  return verbose;
}

export function logTest(scope: string, message: string, data?: unknown): void {
  if (!verbose) {
    return;
  }
  const prefix = `[test:${scope}]`;
  if (data !== undefined) {
    console.log(prefix, message, JSON.stringify(data, null, 2));
  } else {
    console.log(prefix, message);
  }
}

export function logAuditEvents(scope: string, events: Array<{ type: string }>): void {
  if (!verbose) {
    return;
  }
  logTest(scope, events.map((e) => e.type).join(' -> '));
}
