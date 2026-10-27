import { describe, test, expect } from 'vitest';
import { statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { averageColor, largestComponent, splitByMask } from '../scripts/lib/logo.mjs';
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

  test('logo-full keeps the source aspect ratio of the trimmed logo', async () => {
    const full = await sharp(img('logo-full.png')).metadata();
    // Trimmed source is about 1066×940 (x 232–1297, y 56–995).
    expect(full.width / full.height).toBeCloseTo(1066 / 940, 1);
  });

  test('the source logo is left untouched', () => {
    const hash = createHash('sha1').update(readFileSync(join(ROOT, 'Logo/Logo.png'))).digest('hex');
    expect(hash).toBe('60981719275293aada55b23076da27ae13c5e695');
  });
});
