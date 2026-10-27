import { describe, test, expect } from 'vitest';
import { findGap, rowAlphaCounts, recolorDark, averageColor, relativeLuminance } from '../scripts/lib/logo.mjs';

// Tiny hand-built RGBA images. Each row string uses: '.' transparent, 'T' teal, 'N' navy,
// 'D' dark wordmark, 'h' half-transparent dark edge.
const PALETTE = {
  '.': [0, 0, 0, 0],
  T: [0x00, 0xe0, 0xc0, 255],
  N: [0x00, 0x40, 0x80, 255],
  D: [0x0a, 0x1a, 0x2a, 255],
  h: [0x0a, 0x1a, 0x2a, 128],
};
const image = (rows) => {
  const width = rows[0].length;
  const pixels = new Uint8Array(width * rows.length * 4);
  rows.forEach((row, y) => [...row].forEach((ch, x) => pixels.set(PALETTE[ch], (y * width + x) * 4)));
  return { pixels, width, height: rows.length };
};
const px = (pixels, i) => Array.from(pixels.slice(i * 4, i * 4 + 4));

describe('findGap', () => {
  test('finds the transparent band between mark and wordmark', () => {
    const { pixels, width, height } = image([
      '....',
      '.TT.',
      'TNNT',
      '....',
      '....',
      '....',
      '.DD.',
      '....',
    ]);
    const counts = rowAlphaCounts(pixels, width, height);
    expect(counts).toEqual([0, 2, 4, 0, 0, 0, 2, 0]);
    expect(findGap(counts)).toEqual({ start: 3, end: 5 });
  });

  test('picks the longest inner band and ignores transparent margins', () => {
    expect(findGap([0, 0, 3, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0])).toEqual({ start: 5, end: 7 });
    // Ties keep the first band.
    expect(findGap([1, 0, 0, 1, 0, 0, 1])).toEqual({ start: 1, end: 2 });
  });

  test('returns null without a band between two content regions', () => {
    expect(findGap([0, 2, 3, 4, 0, 0])).toBeNull();
    expect(findGap([0, 0, 0])).toBeNull();
    expect(findGap([])).toBeNull();
  });
});

describe('recolorDark', () => {
  const ink = '#E8F3F6';

  test('recolours dark pixels, keeps teal and alpha, leaves the input untouched', () => {
    const { pixels } = image(['.TDh']);
    const before = Uint8Array.from(pixels);
    const out = recolorDark(pixels, ink);

    expect(px(out, 0)).toEqual([0, 0, 0, 0]);
    expect(px(out, 1)).toEqual(PALETTE.T);
    expect(px(out, 2)).toEqual([0xe8, 0xf3, 0xf6, 255]);
    expect(px(out, 3)).toEqual([0xe8, 0xf3, 0xf6, 128]);
    expect(pixels).toEqual(before);
  });

  test('threshold follows relative luminance', () => {
    expect(relativeLuminance(...PALETTE.T.slice(0, 3))).toBeGreaterThan(0.2);
    expect(relativeLuminance(...PALETTE.D.slice(0, 3))).toBeLessThan(0.2);
    expect(() => recolorDark(new Uint8Array(4), 'white')).toThrow(/invalid colour/);
  });
});

describe('averageColor', () => {
  test('weights by alpha and skips transparent pixels', () => {
    const pixels = new Uint8Array([
      0, 0, 0, 0,
      200, 100, 0, 255,
      0, 100, 200, 85,
    ]);
    expect(averageColor(pixels)).toBe('#966432');
    expect(averageColor(new Uint8Array(8))).toBeNull();
  });
});
