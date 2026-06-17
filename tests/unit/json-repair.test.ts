import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { validateAndRepair } from '../../src/middleware/repair.js';
import { repairJson } from '../../src/utils/json-repair.js';

describe('json-repair', () => {
  it('strips markdown fences', () => {
    const result = repairJson('```json\n{"name":"Ada"}\n```');
    expect(result.repaired).toBe(true);
    expect(JSON.parse(result.text)).toEqual({ name: 'Ada' });
  });

  it('fixes trailing commas', () => {
    const result = repairJson('{"items":["a",],}');
    expect(result.repaired).toBe(true);
    expect(JSON.parse(result.text)).toEqual({ items: ['a'] });
  });

  it('closes unclosed objects', () => {
    const result = repairJson('{"name":"Ada"');
    expect(result.repaired).toBe(true);
    expect(JSON.parse(result.text)).toEqual({ name: 'Ada' });
  });
});

describe('validateAndRepair', () => {
  const schema = z.object({ name: z.string(), age: z.number() });

  it('validates against zod schema', () => {
    const result = validateAndRepair('{"name":"Ada","age":30}', schema);
    expect(result.valid).toBe(true);
  });

  it('reports schema errors', () => {
    const result = validateAndRepair('{"name":"Ada","age":"thirty"}', schema);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('age');
  });
});

describe('repair fixture corpus', () => {
  const fixtures = [
    ['fence', '```json\n{"ok":true}\n```', true],
    ['trailing comma', '{"a":1,}', true],
    ['unclosed', '{"a":1', true],
    ['plain valid', '{"a":1}', false],
  ] as const;

  it('repairs most malformed JSON fixtures', () => {
    let success = 0;
    for (const [, input] of fixtures) {
      const result = repairJson(input);
      try {
        JSON.parse(result.text);
        success += 1;
      } catch {
        // counted as failure
      }
    }
    expect(success / fixtures.length).toBeGreaterThanOrEqual(0.8);
  });
});
