import { describe, expect, it } from 'vitest';

import { deepMerge } from '../../../src/utils/deep-merge.js';

describe('deepMerge', () => {
  it('merges nested objects', () => {
    const base = { a: { x: 1, y: 2 }, b: 3 };
    const result = deepMerge(base, { a: { y: 99 }, c: 4 });
    expect(result).toEqual({ a: { x: 1, y: 99 }, b: 3, c: 4 });
  });

  it('skips undefined override values', () => {
    const base = { a: 1, b: 2 };
    const result = deepMerge(base, { a: undefined, b: 5 });
    expect(result).toEqual({ a: 1, b: 5 });
  });

  it('replaces arrays instead of merging them', () => {
    const base = { items: [1, 2] };
    const result = deepMerge(base, { items: [3] });
    expect(result.items).toEqual([3]);
  });
});
