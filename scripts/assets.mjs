// Generates brand images in images/ from the owner's logo at Logo/Logo.png (never modified):
// trim transparent edges, split mark/wordmark at the transparent band, lighten the wordmark if it
// is below 3:1 on --bg, then write the logo, favicon and share-image variants.
//
//   node scripts/assets.mjs
import { mkdirSync, existsSync, readFileSync, renameSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  findGap, rowAlphaCounts, recolorDark, averageColor, largestComponent, splitByMask,
} from './lib/logo.mjs';
import { contrastRatio } from './lib/checks.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BG = '#06111C';
const INK = '#E8F3F6';
const ACCENT = '#19D3B5';
const NAVY = '#0B3A66';
const MIN_LOGO_CONTRAST = 3;
// Rows/columns with a few faint pixels still count as transparent when trimming and splitting.
const ALPHA_THRESHOLD = 8;

export class AssetError extends Error {}

const raw = async (img) => {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { pixels: new Uint8Array(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height };
};
const fromRaw = ({ pixels, width, height }) => sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } });

// Bounding box of pixels with alpha above the threshold.
function contentBox({ pixels, width, height }) {
  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  return bottom < 0 ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

const crop = (img, box) => {
  const out = new Uint8Array(box.width * box.height * 4);
  for (let y = 0; y < box.height; y += 1) {
    const from = ((box.top + y) * img.width + box.left) * 4;
    out.set(img.pixels.subarray(from, from + box.width * 4), y * box.width * 4);
  }
  return { pixels: out, width: box.width, height: box.height };
};
const trim = (img) => {
  const box = contentBox(img);
  if (!box) throw new AssetError('Logo/Logo.png has no visible pixels');
  return crop(img, box);
};

// Isometric grid (30° lines) used behind the share image; mirrors images/iso-grid.svg styling.
function isoGridSvg(width, height, step = 48) {
  const lines = [];
  const slope = Math.tan(Math.PI / 6);
  for (let c = -height; c < width + height; c += step) {
    lines.push(`M${c} 0 L${c + height / slope} ${height}`, `M${c} ${height} L${c + height / slope} 0`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="glow" cx="72%" cy="40%" r="60%">
      <stop offset="0" stop-color="${NAVY}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" x2="1">
      <stop offset="0" stop-color="${BG}" stop-opacity="1"/>
      <stop offset="0.55" stop-color="${BG}" stop-opacity="0.2"/>
      <stop offset="1" stop-color="${BG}" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${BG}"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <path d="${lines.join(' ')}" stroke="${ACCENT}" stroke-opacity="0.12" stroke-width="1" fill="none"/>
  <rect width="100%" height="100%" fill="url(#fade)"/>
</svg>`;
}

const textSvg = (width, height) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    .t { font-family: Sora, Manrope, "Segoe UI", Helvetica, Arial, sans-serif; font-weight: 700; fill: ${INK}; }
    .s { font-family: Manrope, "Segoe UI", Helvetica, Arial, sans-serif; font-weight: 600; fill: ${ACCENT}; }
    .m { font-family: Menlo, Consolas, monospace; font-weight: 600; fill: ${ACCENT}; letter-spacing: 3px; }
  </style>
  <text class="m" x="0" y="28" font-size="18">// SOFTWARE ENGINEERING PARTNER</text>
  <text class="t" x="0" y="96" font-size="44">Software, networks</text>
  <text class="t" x="0" y="152" font-size="44">and cloud, built to</text>
  <text class="t" x="0" y="208" font-size="44">keep moving.</text>
  <text class="s" x="0" y="262" font-size="26">synthiqdigital.com</text>
</svg>`;

// Writes to a temp file first so a failed run never leaves a half-written image behind.
async function save(pipeline, path) {
  const tmp = `${path}.tmp`;
  await pipeline.toFile(tmp);
  renameSync(tmp, path);
}

export async function buildAssets({ root = ROOT, log = console.log } = {}) {
  const src = join(root, 'Logo/Logo.png');
  if (!existsSync(src)) throw new AssetError('Logo/Logo.png does not exist');
  const input = readFileSync(src);
  const meta = await sharp(input).metadata();
  if (!meta.hasAlpha) throw new AssetError('Logo/Logo.png has no alpha channel; a transparent background is required');

  const logo = trim(await raw(sharp(input)));
  const { width, height } = logo;

  // Mark mask: rows above the transparent band; when the mark's tip dips into the wordmark rows
  // (no band), the mark is the largest connected shape and the letters are the rest.
  const gap = findGap(rowAlphaCounts(logo.pixels, width, height, ALPHA_THRESHOLD));
  let mask;
  if (gap) {
    mask = new Uint8Array(width * height);
    mask.fill(1, 0, gap.start * width);
  } else {
    mask = largestComponent(logo.pixels, width, height, ALPHA_THRESHOLD);
    log('no transparent band between mark and wordmark; split by connected shape');
  }
  const { inside: markPixels, outside: wordPixels } = splitByMask(logo.pixels, mask);
  if (!contentBox({ pixels: wordPixels, width, height })) {
    throw new AssetError('could not separate the wordmark from the mark in Logo/Logo.png');
  }
  const mark = trim({ pixels: markPixels, width, height });

  let word = wordPixels;
  const before = contrastRatio(averageColor(word), BG);
  if (before < MIN_LOGO_CONTRAST) {
    word = recolorDark(word, INK);
    const after = contrastRatio(averageColor(word), BG);
    log(`wordmark contrast ${before.toFixed(2)}:1 -> ${after.toFixed(2)}:1 after recolouring`);
    if (after < MIN_LOGO_CONTRAST) {
      throw new AssetError(`wordmark contrast is ${after.toFixed(2)}:1 after recolouring (need ${MIN_LOGO_CONTRAST}:1)`);
    }
  }
  // Full logo: original mark pixels + (possibly recoloured) wordmark pixels.
  const full = { pixels: Uint8Array.from(word), width, height };
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) full.pixels.set(logo.pixels.subarray(i * 4, i * 4 + 4), i * 4);
  }

  const out = join(root, 'images');
  mkdirSync(out, { recursive: true });
  const fullPng = await fromRaw(full).png().toBuffer();
  const markPng = await fromRaw(mark).png().toBuffer();
  const squareMark = (size, pad = 0) => sharp(markPng)
    .resize(size - 2 * pad, size - 2 * pad, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } });

  const fullH = sharp(fullPng).resize({ height: 160 });
  await save(fullH.clone().webp({ quality: 90, alphaQuality: 100 }), join(out, 'logo-full.webp'));
  await save(fullH.clone().png({ compressionLevel: 9, palette: true, quality: 95 }), join(out, 'logo-full.png'));
  await save(squareMark(96).webp({ quality: 90, alphaQuality: 100 }), join(out, 'logo-mark.webp'));
  await save(squareMark(96).png({ compressionLevel: 9, palette: true, quality: 95 }), join(out, 'logo-mark.png'));
  await save(sharp(markPng).resize({ width: 640, height: 640, fit: 'inside' }).webp({ quality: 88, alphaQuality: 100 }),
    join(out, 'logo-mark-hero.webp'));
  await save(squareMark(32, 1).png({ compressionLevel: 9 }), join(out, 'favicon-32.png'));
  // Resize first, then flatten in a second pipeline so the padding is opaque too.
  const touch = await squareMark(180, 22).png().toBuffer();
  await save(sharp(touch).flatten({ background: BG }).removeAlpha().png({ compressionLevel: 9 }),
    join(out, 'apple-touch-icon.png'));

  // Share image: grid background, full logo on the right, tagline on the left.
  // Text column x 72–660, logo column from x 720 to the right margin.
  const logoOg = await sharp(fullPng).resize({ width: 408, height: 400, fit: 'inside' }).png().toBuffer();
  const logoOgMeta = await sharp(logoOg).metadata();
  const og = sharp(Buffer.from(isoGridSvg(1200, 630))).composite([
    { input: Buffer.from(textSvg(600, 290)), left: 72, top: 170 },
    { input: logoOg, left: 1200 - 72 - logoOgMeta.width, top: Math.round((630 - logoOgMeta.height) / 2) },
  ]);
  const ogPng = await og.png().toBuffer();
  await save(sharp(ogPng).flatten({ background: BG }).removeAlpha().png({ compressionLevel: 9, palette: true, quality: 90 }),
    join(out, 'og.png'));

  const files = ['logo-full.webp', 'logo-full.png', 'logo-mark.webp', 'logo-mark.png', 'logo-mark-hero.webp',
    'favicon-32.png', 'apple-touch-icon.png', 'og.png'];
  return { files, gap, wordmarkContrast: before };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { files } = await buildAssets();
    console.log(`Wrote ${files.length} images: ${files.map((f) => `images/${f}`).join(', ')}`);
  } catch (err) {
    console.error(`assets failed: ${err.message}`);
    process.exit(1);
  }
}
