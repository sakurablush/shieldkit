import { generateText } from 'ai';
import { ollama } from 'ollama-ai-provider-v2';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ShieldBlockedError } from '../../src/errors.js';
import { shield } from '../../src/shield.js';
import { loadFixtures } from '../helpers/load-adversarial-fixtures.js';
import { logRedteam } from '../helpers/security-logger.js';
import { writeAdversarialSummary } from '../helpers/write-contrast-report.js';

async function isOllamaAvailable(): Promise<boolean> {
  const host = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  try {
    const response = await fetch(`${host}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function warmModel(modelName: string): Promise<void> {
  const host = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  await fetch(`${host}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelName, prompt: 'ping', stream: false }),
  });
}

const ollamaAvailable = await isOllamaAvailable();
const modelName = process.env.OLLAMA_MODEL ?? 'llama3.2';
const strictMode = process.env.REDTEAM_STRICT !== '0';

const REDTEAM_PROMPTS = loadFixtures('injection')
  .filter((f) => f.modes?.strict === 'expect_block' && f.prompt)
  .map((f) => f.prompt!);

type RedteamCase = {
  prompt: string;
  shieldOutcome: string;
  rawLen: number;
  shieldLen: number;
};

const caseResults: RedteamCase[] = [];

describe.skipIf(!ollamaAvailable)('ollama red team', () => {
  beforeAll(async () => {
    await warmModel(modelName);
  }, 120_000);

  it.each(REDTEAM_PROMPTS)(
    'strict blocks: %s',
    async (prompt) => {
      const rawModel = ollama(modelName);
      const safeModel = shield(ollama(modelName), {
        mode: 'strict',
        audit: { console: false },
      });

      let rawLen: number;
      try {
        const raw = await generateText({ model: rawModel, prompt });
        rawLen = raw.text.length;
      } catch {
        rawLen = 0;
      }

      let shieldOutcome = 'ok';
      let shieldLen = 0;
      try {
        const shielded = await generateText({
          model: safeModel,
          prompt,
          providerOptions: { aiShield: { sessionId: 'redteam' } },
        });
        shieldLen = shielded.text.length;
      } catch (error) {
        shieldOutcome = error instanceof ShieldBlockedError ? 'blocked' : 'error';
      }

      caseResults.push({ prompt, shieldOutcome, rawLen, shieldLen });
      logRedteam(
        `prompt=${prompt.slice(0, 40)}… | shield=${shieldOutcome} | raw_len=${rawLen} | shield_len=${shieldLen}`,
      );

      if (strictMode) {
        expect(shieldOutcome).toBe('blocked');
      }
    },
    90_000,
  );

  afterAll(() => {
    const blocked = caseResults.filter((c) => c.shieldOutcome === 'blocked').length;
    writeAdversarialSummary({
      redteam: {
        model: modelName,
        strictMode,
        cases: caseResults.length,
        blocked,
        blockRate: caseResults.length ? blocked / caseResults.length : 0,
        prompts: caseResults,
      },
    });

    if (!strictMode && caseResults.length > 0) {
      logRedteam(
        `summary: ${blocked}/${caseResults.length} blocked (REDTEAM_STRICT=0 advisory mode)`,
      );
    }
  });
});
