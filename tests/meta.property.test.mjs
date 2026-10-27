import { test, expect } from 'vitest';
import fc from 'fast-check';
import { checkPageMeta } from '../scripts/lib/checks.mjs';
import { escapeHtml } from '../scripts/lib/render.mjs';

// P9: Kiểm tra metadata khớp mô hình.
// Với mọi title độ dài 0–80 và description độ dài 0–200 sinh ngẫu nhiên chèn vào head mẫu:
// checkPageMeta báo lỗi title khi và chỉ khi độ dài = 0 hoặc > 60, báo lỗi description khi và chỉ khi
// ngoài [70, 160]; thiếu canonical/og:* hoặc canonical khác domain luôn bị báo.

const url = 'https://synthiqdigital.com';
const FILES = ['index.html', 'about.html', 'services.html', 'portfolio.html', 'contact.html', '404.html'];
const canonicalFor = (file) => (file === 'index.html' ? `${url}/` : `${url}/${file}`);

// Includes characters that must be escaped in HTML, so lengths are checked on decoded text.
// Inner spaces only: the checker trims surrounding whitespace, so edges stay non-space.
const edge = fc.constantFrom(...'abcXYZ019|&<>"\'{}-.,'.split(''));
const inner = fc.oneof(edge, fc.constant(' '));
// Length drawn uniformly so every side of each boundary (0, 60, 70, 160) is hit often.
const textArb = (max) => fc.integer({ min: 0, max }).chain((n) => {
  if (n === 0) return fc.constant('');
  if (n === 1) return edge;
  return fc.tuple(edge, fc.array(inner, { minLength: n - 2, maxLength: n - 2 }), edge)
    .map(([a, mid, b]) => a + mid.join('') + b);
});

const OPTIONAL = ['canonical', 'og:title', 'og:description', 'og:url', 'og:image'];
const scenarioArb = fc.record({
  file: fc.constantFrom(...FILES),
  title: textArb(80),
  desc: textArb(200),
  omit: fc.subarray(OPTIONAL),
  foreignCanonical: fc.boolean(),
});

const buildHead = ({ file, title, desc, omit, foreignCanonical }) => {
  const canonical = foreignCanonical ? `https://example.com/${file}` : canonicalFor(file);
  const t = escapeHtml(title);
  const d = escapeHtml(desc);
  const tags = {
    canonical: `<link rel="canonical" href="${canonical}">`,
    'og:title': `<meta property="og:title" content="${t || 'Synthiq'}">`,
    'og:description': `<meta property="og:description" content="${d || 'Synthiq'}">`,
    'og:url': `<meta property="og:url" content="${canonicalFor(file)}">`,
    'og:image': `<meta property="og:image" content="${url}/images/og.png">`,
  };
  return [
    '<!doctype html>',
    '<html lang="en"><head>',
    `<title>${t}</title>`,
    `<meta name="description" content="${d}">`,
    ...OPTIONAL.filter((k) => !omit.includes(k)).map((k) => tags[k]),
    '</head><body></body></html>',
  ].join('\n');
};

test('P9: checkPageMeta matches the metadata model', () => {
  fc.assert(
    fc.property(scenarioArb, (s) => {
      const errors = checkPageMeta(buildHead(s), { url, file: s.file });
      const has = (re) => errors.some((e) => re.test(e));

      expect(has(/<title>/)).toBe(s.title.length === 0 || s.title.length > 60);
      expect(has(/meta description/)).toBe(s.desc.length < 70 || s.desc.length > 160);

      expect(has(/canonical/)).toBe(s.omit.includes('canonical') || s.foreignCanonical);
      for (const prop of OPTIONAL.slice(1)) {
        expect(has(new RegExp(`missing ${prop}\\b`))).toBe(s.omit.includes(prop));
      }

      const expectedCount = (s.title.length === 0 || s.title.length > 60 ? 1 : 0)
        + (s.desc.length < 70 || s.desc.length > 160 ? 1 : 0)
        + (s.omit.includes('canonical') || s.foreignCanonical ? 1 : 0)
        + OPTIONAL.slice(1).filter((p) => s.omit.includes(p)).length;
      expect(errors).toHaveLength(expectedCount);
    }),
    { numRuns: 300 },
  );
});
