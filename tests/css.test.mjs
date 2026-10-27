import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck } from '../scripts/check.mjs';

// css/site.css + fonts/: no banned colours/fonts, token contrast passes, every font file is used,
// hidden reveal state only under .js and a reduced-motion block exists (2.1, 2.2, 5.6, NFR 5).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(ROOT, 'css/site.css'), 'utf8');
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

// css/site.css is linked from the layout in task 4.4; until then "not referenced" is expected.
test('check reports nothing for css/ and fonts/', () => {
  const { problems } = runCheck({ root: ROOT });
  const own = problems
    .filter((p) => /^(css|fonts)\//.test(p))
    .filter((p) => p !== 'css/site.css:1: not referenced by any page');
  expect(own).toEqual([]);
});

test('every @font-face source exists and only Sora/Manrope are declared', () => {
  const families = [...css.matchAll(/font-family:\s*"([^"]+)";\s*\n\s*font-style/g)].map((m) => m[1]);
  expect(new Set(families)).toEqual(new Set(['Sora', 'Manrope']));
  const srcs = [...css.matchAll(/url\("\.\.\/(fonts\/[^"]+)"\)/g)].map((m) => m[1]);
  expect(srcs).toHaveLength(5);
  for (const src of srcs) expect(existsSync(join(ROOT, src)), src).toBe(true);
  expect(existsSync(join(ROOT, 'fonts/OFL.txt'))).toBe(true);
});

test('reveal hides content only under .js and reduced motion is honoured', () => {
  for (const m of cssNoComments.matchAll(/([^{}]+)\{[^}]*opacity:\s*0;/g)) {
    expect(m[1].trim()).toMatch(/^\.js\b/);
  }
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  expect(css).toMatch(/:focus-visible/);
});
