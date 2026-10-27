import { describe, test, expect } from 'vitest';
import { statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { averageColor, largestComponent, splitByMask, findGap, rowAlphaCounts } from '../scripts/lib/logo.mjs';
import { stackCentered } from '../scripts/assets.mjs';
import { contrastRatio } from '../scripts/lib/checks.mjs';

// Reads the images written by `npm run assets` (2.5, 2.7, 6.2).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const img = (name) => join(ROOT, 'images', name);

const EXPECTED = [
  ['logo-full.webp', 'webp', { height: 160 }],
  ['logo-full.png', 'png', { height: 160 }],
  ['logo-mark.webp', 'webp', { width: 96, height: 96 }],
  ['logo-mark.png', 'png', { width: 96, height: 96 }],
  ['logo-mark-hero.webp', 'webp', { max: 640 }],
  ['favicon-32.png', 'png', { width: 32, height: 32 }],
  ['apple-touch-icon.png', 'png', { width: 180, height: 180, opaque: true }],
  ['og.png', 'png', { width: 1200, height: 630, opaque: true }],
];

describe('generated brand images', () => {
  test.each(EXPECTED)('%s has the expected format and size', async (name, format, want) => {
    const meta = await sharp(img(name)).metadata();
    expect(meta.format).toBe(format);
    if (want.width) expect(meta.width).toBe(want.width);
    if (want.height) expect(meta.height).toBe(want.height);
    if (want.max) expect(Math.max(meta.width, meta.height)).toBe(want.max);
    if (want.opaque) expect((await sharp(img(name)).stats()).isOpaque).toBe(true);
    expect(statSync(img(name)).size).toBeLessThanOrEqual(400 * 1024);
  });

  test('wordmark in logo-full.png reaches 3:1 on --bg', async () => {
    const { data, info } = await sharp(img('logo-full.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = new Uint8Array(data);
    const mask = largestComponent(pixels, info.width, info.height, 8);
    const { outside: word } = splitByMask(pixels, mask);
    expect(contrastRatio(averageColor(word), '#06111C')).toBeGreaterThanOrEqual(3);
  });

  test('logo-full leaves a transparent gap of at least 6% between mark and wordmark', async () => {
    const { data, info } = await sharp(img('logo-full.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const gap = findGap(rowAlphaCounts(new Uint8Array(data), info.width, info.height, 8));
    expect(gap).not.toBeNull();
    expect((gap.end - gap.start) / info.height).toBeGreaterThanOrEqual(0.06);
  });

  test('stackCentered centres both parts and leaves exactly `gap` empty rows', () => {
    const solid = (w, h) => ({ pixels: new Uint8Array(w * h * 4).fill(255), width: w, height: h });
    const out = stackCentered(solid(2, 3), solid(6, 2), 4);
    expect([out.width, out.height]).toEqual([6, 9]);
    const alpha = (x, y) => out.pixels[(y * out.width + x) * 4 + 3];
    expect([alpha(1, 0), alpha(2, 0), alpha(3, 0), alpha(4, 0)]).toEqual([0, 255, 255, 0]);
    for (let y = 3; y < 7; y += 1) for (let x = 0; x < 6; x += 1) expect(alpha(x, y)).toBe(0);
    expect(alpha(0, 7)).toBe(255);
  });

  test('the source logo is left untouched', () => {
    const hash = createHash('sha1').update(readFileSync(join(ROOT, 'Logo/Logo.png'))).digest('hex');
    expect(hash).toBe('60981719275293aada55b23076da27ae13c5e695');
  });
});
