import { generateText } from 'ai';

import {
  ShieldBlockedError,
  ShieldBudgetError,
  ShieldRepairError,
} from '../../src/errors.js';
import { shield } from '../../src/shield.js';
import type { AuditLog, ShieldMode } from '../../src/types.js';
import { createAuditCapture } from './audit-capture.js';
import { createMockModel } from './mock-model.js';
import { snapshotPrompt } from './prompt-snapshot.js';

export type ShieldOutcome =
  | 'ok'
  | 'blocked'
  | 'budget'
  | 'repair_error'
  | 'tool_error'
  | 'error';

export interface PathResult {
  modelInvoked: boolean;
  outcome: ShieldOutcome;
  inputSnapshot?: string;
  outputText?: string;
  errorName?: string;
}

export interface ContrastResult {
  fixtureId: string;
  mode: ShieldMode;
  raw: PathResult;
  shielded: PathResult & { auditEvents: AuditLog[] };
  delta: string;
}

function classifyError(error: unknown): ShieldOutcome {
  if (error instanceof ShieldBlockedError) return 'blocked';
  if (error instanceof ShieldBudgetError) return 'budget';
  if (error instanceof ShieldRepairError) return 'repair_error';
  return 'error';
}

async function runRawPath(prompt: string): Promise<PathResult> {
  let invoked = false;
  const model = createMockModel({
    text: (p) => {
      invoked = true;
      return snapshotPrompt(p);
    },
  });

  try {
    const result = await generateText({ model, prompt });
    return {
      modelInvoked: invoked,
      outcome: 'ok',
      outputText: result.text,
    };
  } catch (error) {
    return {
      modelInvoked: invoked,
      outcome: classifyError(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
    };
  }
}

async function runShieldedPath(
  prompt: string,
  mode: ShieldMode,
): Promise<PathResult & { auditEvents: AuditLog[] }> {
  let invoked = false;
  let lastPrompt: unknown;
  const capture = createAuditCapture();

  const model = createMockModel({
    text: (p) => {
      invoked = true;
      lastPrompt = p;
      return 'shielded-ok';
    },
  });

  const safeModel = shield(model, {
    mode,
    audit: { console: false, sink: capture.sink },
  });

  try {
    const result = await generateText({
      model: safeModel,
      prompt,
      providerOptions: { aiShield: { sessionId: `contrast-${mode}` } },
    });
    return {
      modelInvoked: invoked,
      outcome: 'ok',
      inputSnapshot: snapshotPrompt(lastPrompt),
      outputText: result.text,
      auditEvents: capture.logs,
    };
  } catch (error) {
    return {
      modelInvoked: invoked,
      outcome: classifyError(error),
      inputSnapshot: snapshotPrompt(lastPrompt),
      errorName: error instanceof Error ? error.name : 'Unknown',
      auditEvents: capture.logs,
    };
  }
}

function buildDelta(raw: PathResult, shielded: PathResult): string {
  if (shielded.outcome === 'blocked' && raw.modelInvoked) {
    return 'Shield blocked the request; raw path reached the model.';
  }
  if (shielded.outcome === 'blocked' && !raw.modelInvoked) {
    return 'Shield blocked before model invocation; raw path also blocked or failed.';
  }
  if (
    shielded.outcome === 'ok' &&
    raw.outcome === 'ok' &&
    shielded.inputSnapshot?.includes('[REDACTED')
  ) {
    return 'Shield redacted input; raw path sent prompt unchanged.';
  }
  if (shielded.outcome === 'ok' && raw.outcome === 'ok') {
    return 'Both paths completed; compare input/output snapshots.';
  }
  return `Raw: ${raw.outcome}; Shield: ${shielded.outcome}.`;
}

export async function runContrast(options: {
  fixtureId: string;
  prompt: string;
  mode: ShieldMode;
}): Promise<ContrastResult> {
  const raw = await runRawPath(options.prompt);
  const shielded = await runShieldedPath(options.prompt, options.mode);

  return {
    fixtureId: options.fixtureId,
    mode: options.mode,
    raw,
    shielded,
    delta: buildDelta(raw, shielded),
  };
}
