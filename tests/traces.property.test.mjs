import { test, expect } from 'vitest';
import fc from 'fast-check';
import { findTraces, findBadFileNames } from '../scripts/lib/checks.mjs';

// P2: Phát hiện mọi dấu vết.
// Với mọi văn bản nhiều dòng sinh từ bảng chữ không chứa dấu vết, findTraces trả rỗng; với mọi
// văn bản như vậy chèn một mẫu dấu vết bất kỳ với kiểu hoa/thường ngẫu nhiên tại dòng k, kết quả
// chứa mục có line = k. Tương tự findBadFileNames với đường dẫn ngẫu nhiên.

const j = (...p) => p.join('');
const SAMPLES = [
  j('dv', 'technic'), j('dv ', 'technic'), j('dv-', 'technic'), j('dv', 'technic.com'),
  j('dongle', '@'), j('0111', '058171'), j('915 ', '708 055'), j('0915', '708055'),
  j('yen ', 'hoa'), j('cau ', 'giay'), j('open', 'claw'), j('her', 'mes'), j('nous'),
  j('sol', 'vet'), j('template', 'monster'), j('dr', 'theme'),
];
const NAME_SAMPLES = [j('dv', 'technic'), j('her', 'mes'), j('nous'), 'logo copy'];

// Alphabet without the letters/digits needed to spell any trace, so clean text is clean by construction.
const SAFE = 'bfijkpqwxyz2346 .,;:!?()-_/#<>"='.split('');
const lineArb = fc.string({ unit: fc.constantFrom(...SAFE), maxLength: 60 });
const linesArb = fc.array(lineArb, { minLength: 1, maxLength: 20 });

// Random casing of each character.
const randomCase = (s) => fc.array(fc.boolean(), { minLength: s.length, maxLength: s.length })
  .map((flags) => [...s].map((c, i) => (flags[i] ? c.toUpperCase() : c)).join(''));
const traceArb = fc.constantFrom(...SAMPLES).chain(randomCase);
const nameArb = fc.constantFrom(...NAME_SAMPLES).chain(randomCase);

// Wrap with separators so \b-bounded patterns stay word-bounded.
const insertArb = (lines, piece) => fc.record({
  k: fc.integer({ min: 0, max: lines.length - 1 }),
  at: fc.nat(),
}).map(({ k, at }) => {
  const line = lines[k];
  const pos = at % (line.length + 1);
  const copy = [...lines];
  copy[k] = `${line.slice(0, pos)} ${piece} ${line.slice(pos)}`;
  return { text: copy.join('\n'), line: k + 1 };
});

test('P2a: clean text never reports a trace', () => {
  fc.assert(
    fc.property(linesArb, (lines) => {
      expect(findTraces(lines.join('\n'))).toEqual([]);
    }),
    { numRuns: 300 },
  );
});

test('P2b: an inserted trace is always found on its line', () => {
  fc.assert(
    fc.property(
      linesArb.chain((lines) => traceArb.chain((t) => insertArb(lines, t))),
      ({ text, line }) => {
        const hits = findTraces(text);
        expect(hits.some((h) => h.line === line)).toBe(true);
        expect(hits.every((h) => h.line === line)).toBe(true);
      },
    ),
    { numRuns: 300 },
  );
});

const segArb = fc.string({ unit: fc.constantFrom(...'bfijkpqwxyz2346-_'.split('')), minLength: 1, maxLength: 12 });
const pathArb = fc.array(segArb, { minLength: 1, maxLength: 4 }).map((segs) => `${segs.join('/')}.png`);

test('P2c: findBadFileNames flags exactly the paths containing a banned name', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.oneof(
          pathArb.map((p) => ({ p, bad: false })),
          fc.tuple(pathArb, nameArb).map(([p, n]) => ({ p: p.replace(/([^/]*)\.png$/, `$1${n}.png`), bad: true })),
          fc.tuple(segArb, nameArb, pathArb).map(([a, n, rest]) => ({ p: `${a}/${n}/${rest}`, bad: true })),
        ),
        { maxLength: 15 },
      ),
      (items) => {
        expect(findBadFileNames(items.map((i) => i.p))).toEqual(items.filter((i) => i.bad).map((i) => i.p));
      },
    ),
    { numRuns: 300 },
  );
});
