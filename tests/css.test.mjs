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

test('check reports nothing for css/ and fonts/', () => {
  const { problems } = runCheck({ root: ROOT });
  expect(problems.filter((p) => /^(css|fonts)\//.test(p))).toEqual([]);
});

test('mobile panel and main nav are hidden only under .js', () => {
  for (const m of cssNoComments.matchAll(/([^{}]+)\{[^}]*display:\s*none;/g)) {
    const sel = m[1].trim();
    if (/main-nav/.test(sel)) expect(sel).toMatch(/^\.js\b/);
  }
});

// All rule bodies whose selector list matches `re`, joined.
const bodies = (re) => [...cssNoComments.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .filter((m) => re.test(m[1].trim())).map((m) => m[2]).join('\n');

test('header blur sits on ::before so the fixed mobile panel covers the viewport', () => {
  expect(bodies(/^\.site-header$/)).not.toMatch(/backdrop-filter/);
  expect(bodies(/^\.site-header::before$/)).toMatch(/backdrop-filter/);
  // No ancestor of the panel may create a containing block for position: fixed.
  for (const sel of [/^\.site-header$/, /^\.header-inner$/]) {
    expect(bodies(sel)).not.toMatch(/\b(transform|filter|backdrop-filter|perspective|contain)\s*:/);
  }
  const panel = bodies(/^\.js \.mobile-panel$/);
  expect(panel).toMatch(/position:\s*fixed/);
  expect(panel).toMatch(/inset:\s*0/);
  expect(panel).toMatch(/visibility:\s*hidden/);
  expect(panel).toMatch(/pointer-events:\s*none/);
  expect(panel).toMatch(/transition:/);
  expect(bodies(/^\.js \.mobile-panel\.is-open$/)).toMatch(/visibility:\s*visible/);
  expect(bodies(/^html\.menu-open$/)).toMatch(/overflow:\s*hidden/);
});

test('menu toggle turns into an X when aria-expanded is true', () => {
  const sel = '.menu-toggle[aria-expanded="true"] .menu-toggle-bars';
  const esc = sel.replace(/[.[\]"]/g, '\\$&');
  expect(bodies(new RegExp(`^${esc}$`))).toMatch(/background-color:\s*transparent/);
  expect(bodies(new RegExp(`^${esc}::before$`))).toMatch(/rotate\(45deg\)/);
  expect(bodies(new RegExp(`^${esc}::after$`))).toMatch(/rotate\(-45deg\)/);
});

test('every @font-face source exists and only Sora/Manrope are declared', () => {
  const families = [...css.matchAll(/font-family:\s*"([^"]+)";\s*\n\s*font-style/g)].map((m) => m[1]);
  expect(new Set(families)).toEqual(new Set(['Sora', 'Manrope']));
  const srcs = [...css.matchAll(/url\("\.\.\/(fonts\/[^"]+)"\)/g)].map((m) => m[1]);
  expect(srcs).toHaveLength(5);
  for (const src of srcs) expect(existsSync(join(ROOT, src)), src).toBe(true);
  expect(existsSync(join(ROOT, 'fonts/OFL.txt'))).toBe(true);
});

test('timeline rules beat the ol[class] reset and the line stops at the last circle', () => {
  // .timeline alone (0,1,0) loses to ol[class] (0,1,1), which zeroed the padding the numbers sit in.
  expect(cssNoComments).not.toMatch(/(^|[\s,}])\.timeline(::before)?\s*\{/);
  const rule = (sel) => cssNoComments.match(new RegExp(`${sel.replace(/[.()]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g')) ?? [];
  expect(rule('ol.timeline').join('')).toMatch(/padding:\s*0 0 0 2\.75rem/);
  expect(rule('ol.timeline').join('')).toMatch(/padding:\s*3\.5rem 0 0/);
  const lines = rule('ol.timeline::before').join('');
  expect(lines).toMatch(/left:\s*calc\(1rem - 1px\)/);
  expect(lines).toMatch(/right:\s*calc\(\(100% - 6rem\) \/ 4 - 1rem\)/);
});

test('reveal hides content only under .js and reduced motion is honoured', () => {
  for (const m of cssNoComments.matchAll(/([^{}]+)\{[^}]*opacity:\s*0;/g)) {
    expect(m[1].trim()).toMatch(/^\.js\b/);
  }
  expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  expect(css).toMatch(/:focus-visible/);
});
