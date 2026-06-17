import { generateText, streamText } from 'ai';
import { describe, expect, it } from 'vitest';

import { ShieldBlockedError } from '../../src/errors.js';
import { shield } from '../../src/shield.js';
import { loadFixtures } from '../helpers/load-adversarial-fixtures.js';
import { createMockModel } from '../helpers/mock-model.js';

const fixtures = loadFixtures('pii');

describe('adversarial PII corpus', () => {
  it.each(fixtures.filter((f) => f.prompt))(
    '$id input PII handling',
    async (fixture) => {
      const prompts: unknown[] = [];
      const model = createMockModel({
        text: (p) => {
          prompts.push(p);
          return 'ok';
        },
      });

      const mode = fixture.modes?.strict === 'expect_block' ? 'strict' : 'balanced';
      const safeModel = shield(model, { mode, audit: { console: false } });

      if (fixture.modes?.strict === 'expect_block') {
        await expect(
          generateText({
            model: safeModel,
            prompt: fixture.prompt!,
            providerOptions: { aiShield: { sessionId: 'pii-corpus' } },
          }),
        ).rejects.toBeInstanceOf(ShieldBlockedError);
        return;
      }

      await generateText({
        model: safeModel,
        prompt: fixture.prompt!,
        providerOptions: { aiShield: { sessionId: 'pii-corpus' } },
      });

      if (fixture.modes?.balanced === 'expect_redact') {
        expect(JSON.stringify(prompts)).toContain('[REDACTED_PII:');
      }
    },
  );

  it.each(fixtures.filter((f) => f.output))(
    '$id output PII block in strict stream',
    async (fixture) => {
      const model = createMockModel({ text: fixture.output! });
      const safeModel = shield(model, {
        mode: 'strict',
        audit: { console: false },
      });

      await expect(
        streamText({
          model: safeModel,
          prompt: 'Give contact',
          providerOptions: { aiShield: { sessionId: 'pii-out' } },
        }).text,
      ).rejects.toThrow();
    },
  );
});
