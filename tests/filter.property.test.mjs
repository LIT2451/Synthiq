import { test, expect } from 'vitest';
import fc from 'fast-check';
import { filterCases } from '../js/main.js';

// P5: for every list of items with a category among the 4 fields and every choice, `all` returns the
// whole list; category c returns exactly the items of c in order; the 4 results together are the list.
const CATEGORIES = ['ai', 'telecom', 'enterprise', 'fintech'];
const items = fc.array(
  fc.record({ category: fc.constantFrom(...CATEGORIES), title: fc.string() }),
  { maxLength: 40 },
).map((list) => list.map((item, id) => ({ ...item, id })));

test('P5: filtering case studies', () => {
  fc.assert(
    fc.property(items, fc.constantFrom('all', ...CATEGORIES), (list, choice) => {
      expect(filterCases(list, 'all')).toEqual(list);

      const picked = filterCases(list, choice);
      const expected = choice === 'all' ? list : list.filter((item) => item.category === choice);
      expect(picked).toEqual(expected);
      for (let i = 1; i < picked.length; i += 1) expect(picked[i].id).toBeGreaterThan(picked[i - 1].id);

      const union = CATEGORIES.flatMap((c) => filterCases(list, c)).sort((a, b) => a.id - b.id);
      expect(union).toEqual(list);
    }),
    { numRuns: 300 },
  );
});
