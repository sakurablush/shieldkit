import { describe, expect, it } from 'vitest';

import {
  appendUserMessage,
  createRequestId,
  extractPromptText,
  extractTextFromContent,
  getShieldProviderOptions,
  mergeShieldProviderOptions,
  redactPromptPii,
  replacePromptText,
  replaceTextInContent,
  stripMarkdownJsonFences,
} from '../../../src/utils/prompt.js';

describe('prompt utils', () => {
  it('extracts text from multi-part prompts', () => {
    const text = extractPromptText([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
    ]);
    expect(text).toContain('You are helpful');
    expect(text).toContain('Hello');
  });

  it('parses shield provider options', () => {
    const options = getShieldProviderOptions({
      aiShield: {
        sessionId: 's1',
        userId: 'u1',
        approved: true,
        metadata: { team: 'qa' },
      },
    });
    expect(options.sessionId).toBe('s1');
    expect(options.approved).toBe(true);
  });

  it('returns empty options for invalid provider payload', () => {
    expect(getShieldProviderOptions({ aiShield: 'bad' })).toEqual({});
  });

  it('merges shield provider options', () => {
    const merged = mergeShieldProviderOptions(
      { aiShield: { sessionId: 'a' } },
      { userId: 'b' },
    );
    expect(merged?.aiShield).toMatchObject({ sessionId: 'a', userId: 'b' });
  });

  it('redacts PII in prompt messages', () => {
    const redacted = redactPromptPii([
      { role: 'user', content: [{ type: 'text', text: 'Email me@corp.com' }] },
    ]);
    const part = redacted[0];
    expect(part.role).toBe('user');
    if (part.role === 'user') {
      const textPart = part.content.find((p) => p.type === 'text');
      expect(textPart?.type === 'text' && textPart.text).toContain(
        '[REDACTED_PII:email]',
      );
    }
  });

  it('transforms prompt text via replacePromptText', () => {
    const updated = replacePromptText(
      [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
      (t) => t.toUpperCase(),
    );
    const part = updated[0];
    if (part.role === 'user') {
      expect(part.content[0]).toMatchObject({ type: 'text', text: 'HI' });
    }
  });

  it('appends user messages and replaces content text', () => {
    const base = [{ role: 'user', content: [{ type: 'text', text: 'a' }] }] as const;
    const appended = appendUserMessage([...base], 'follow-up');
    expect(appended).toHaveLength(2);
    expect(replaceTextInContent([{ type: 'text', text: 'old' }], 'new')[0].text).toBe(
      'new',
    );
    expect(extractTextFromContent([{ type: 'text', text: 'x' }])).toBe('x');
  });

  it('strips markdown json fences and creates request ids', () => {
    expect(stripMarkdownJsonFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(createRequestId()).toMatch(/^req_\d+_[a-z0-9]+$/);
  });
});
