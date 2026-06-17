import { describe, expect, it } from 'vitest';

import {
  loadAllFixtureCategories,
  loadFixtures,
} from '../helpers/load-adversarial-fixtures.js';

describe('adversarial fixture integrity', () => {
  it('loads every JSON category without duplicate ids', () => {
    const categories = loadAllFixtureCategories();
    expect(categories.length).toBeGreaterThanOrEqual(6);

    const seen = new Set<string>();
    for (const category of categories) {
      for (const fixture of loadFixtures(category)) {
        expect(fixture.id, `${category}/${fixture.id}`).toBeTruthy();
        expect(seen.has(fixture.id), `duplicate id ${fixture.id}`).toBe(false);
        seen.add(fixture.id);
      }
    }
  });
});
