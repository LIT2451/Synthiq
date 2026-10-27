import { test, expect } from 'vitest';
import fc from 'fast-check';
import { sharedNgrams } from '../scripts/lib/checks.mjs';

// P7: Phát hiện câu trùng 8 từ.
// Với mọi hai văn bản a, b: sharedNgrams(a, b) không rỗng khi và chỉ khi tồn tại dãy 8 từ liên tiếp
// (sau chuẩn hoá chữ thường, bỏ dấu câu) có trong cả hai; với b là a chèn thêm một đoạn 8 từ của a,
// luôn không rỗng.

const N = 8;
// Tiny vocabulary so random texts share 8-word runs often enough to exercise both sides of "iff".
const VOCAB = ['cloud', 'edge', 'data'];
const SEPS = [' ', '  ', ', ', '. ', ' - ', '; ', '! ', '\n', ' (', ') ', ' "', '" '];

const randomCase = (w) => fc.array(fc.boolean(), { minLength: w.length, maxLength: w.length })
  .map((flags) => [...w].map((c, i) => (flags[i] ? c.toUpperCase() : c)).join(''));

// A text is generated as its normalised word list plus a rendering with random case and punctuation.
const wordsArb = fc.array(fc.constantFrom(...VOCAB), { maxLength: 24 });
const renderArb = (words) => fc.tuple(
  fc.tuple(...words.map(randomCase)),
  fc.array(fc.constantFrom(...SEPS), { minLength: words.length + 1, maxLength: words.length + 1 }),
).map(([cased, seps]) => seps[0] + cased.map((w, i) => w + seps[i + 1]).join(''));
const textArb = wordsArb.chain((words) => (words.length ? renderArb(words) : fc.constantFrom('', ' ', '.,!'))
  .map((text) => ({ words, text })));

// Oracle: direct comparison of every pair of windows.
const shareRun = (a, b) => {
  for (let i = 0; i + N <= a.length; i += 1) {
    for (let j = 0; j + N <= b.length; j += 1) {
      if (a.slice(i, i + N).every((w, k) => w === b[j + k])) return true;
    }
  }
  return false;
};

test('P7a: sharedNgrams is non-empty iff the texts share 8 consecutive words', () => {
  fc.assert(
    fc.property(textArb, textArb, (a, b) => {
      expect(sharedNgrams(a.text, b.text).length > 0).toBe(shareRun(a.words, b.words));
    }),
    { numRuns: 300 },
  );
});

test('P7b: inserting an 8-word run of a into b is always detected', () => {
  fc.assert(
    fc.property(
      fc.array(fc.constantFrom(...VOCAB, 'mesh', 'relay'), { minLength: N, maxLength: 30 })
        .chain((aWords) => fc.record({
          a: renderArb(aWords).map((text) => ({ words: aWords, text })),
          start: fc.integer({ min: 0, max: aWords.length - N }),
          other: textArb,
          at: fc.nat(),
        })),
      ({ a, start, other, at }) => {
        const run = a.words.slice(start, start + N);
        const pos = at % (other.words.length + 1);
        const bWords = [...other.words.slice(0, pos), ...run, ...other.words.slice(pos)];
        const b = bWords.join(' ').toUpperCase();
        const shared = sharedNgrams(a.text, b);
        expect(shared).toContain(run.join(' '));
      },
    ),
    { numRuns: 300 },
  );
});
