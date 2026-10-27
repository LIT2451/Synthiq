import { test, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';

test('site config uses the Synthiq domain', () => {
  const config = JSON.parse(readFileSync(new URL('../site.config.json', import.meta.url), 'utf8'));
  expect(config.domain).toBe('synthiqdigital.com');
});

test('fast-check runs', () => {
  fc.assert(fc.property(fc.string(), (s) => s.length >= 0), { numRuns: 100 });
});
