import { test, expect } from 'vitest';
import fc from 'fast-check';
import { findMissingRefs } from '../scripts/lib/checks.mjs';

// P3: Kiểm tra link khớp mô hình.
// Với mọi tập file tồn tại S và danh sách ref nội bộ R chèn vào HTML (kèm query `?`, hash `#`, `./`),
// findMissingRefs trả đúng các ref có đường dẫn chuẩn hoá không thuộc S; ref mailto:, tel:,
// http(s)://, #… không bao giờ bị báo thiếu.

const segArb = fc.string({ unit: fc.constantFrom(...'abcxyz0129-_'.split('')), minLength: 1, maxLength: 8 });
const pathArb = fc.tuple(fc.array(segArb, { maxLength: 3 }), segArb, fc.constantFrom('html', 'css', 'js', 'png', 'webp'))
  .map(([dirs, name, ext]) => [...dirs, `${name}.${ext}`].join('/'));

// An internal ref to `path`, decorated the way real pages write links.
const internalArb = (path) => fc.record({
  dot: fc.boolean(),
  query: fc.option(segArb.map((s) => `?v=${s}`), { nil: '' }),
  hash: fc.option(segArb.map((s) => `#${s}`), { nil: '' }),
  attr: fc.constantFrom('href', 'src', 'srcset'),
}).map(({ dot, query, hash, attr }) => {
  const ref = `${dot ? './' : ''}${path}${query}${hash}`;
  return { attr, ref, path, internal: true };
});

const externalArb = fc.oneof(
  fc.emailAddress().map((e) => `mailto:${e}`),
  fc.stringMatching(/^\+?[0-9]{6,12}$/).map((n) => `tel:${n}`),
  fc.webUrl({ validSchemes: ['http', 'https'] }),
  segArb.map((s) => `#${s}`),
).filter((ref) => !/[\s,"]/.test(ref))
  .map((ref) => ({ attr: 'href', ref, internal: false }));

const scenarioArb = fc.uniqueArray(pathArb, { minLength: 1, maxLength: 12 }).chain((pool) =>
  fc.record({
    existing: fc.subarray(pool),
    refs: fc.array(fc.oneof(fc.constantFrom(...pool).chain(internalArb), externalArb), { maxLength: 15 }),
  }));

const tag = ({ attr, ref }) => (attr === 'srcset' ? `<source srcset="${ref} 1x">` : `<a ${attr}="${ref}">x</a>`);

test('P3: findMissingRefs reports exactly the internal refs outside the file set', () => {
  fc.assert(
    fc.property(scenarioArb, ({ existing, refs }) => {
      const S = new Set(existing);
      const html = ['<!doctype html>', ...refs.map(tag)].join('\n');
      const expected = refs
        .map((r, i) => ({ ...r, line: i + 2 }))
        .filter((r) => r.internal && !S.has(r.path))
        .map(({ line, ref }) => ({ line, ref }));

      const missing = findMissingRefs(html, 'index.html', (p) => S.has(p));
      expect(missing).toEqual(expected);
      for (const m of missing) expect(m.ref).not.toMatch(/^(mailto:|tel:|https?:\/\/|#)/);
    }),
    { numRuns: 200 },
  );
});
