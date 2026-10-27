// Pure pixel helpers for scripts/assets.mjs. Pixels are raw RGBA (4 bytes per pixel).

// Longest run of fully transparent rows that has content both above and below it.
// rowAlphaCounts[y] = number of non-transparent pixels in row y.
// Returns { start, end } (inclusive row indexes of the gap) or null when there is no such run.
export function findGap(rowAlphaCounts) {
  const rows = Array.from(rowAlphaCounts);
  const first = rows.findIndex((n) => n > 0);
  if (first === -1) return null;
  let last = rows.length - 1;
  while (rows[last] === 0) last -= 1;

  let best = null;
  let runStart = -1;
  for (let y = first; y <= last; y += 1) {
    if (rows[y] === 0) {
      if (runStart === -1) runStart = y;
    } else if (runStart !== -1) {
      if (!best || y - runStart > best.end - best.start + 1) best = { start: runStart, end: y - 1 };
      runStart = -1;
    }
  }
  return best;
}

// Non-transparent pixel count per row of a width×height RGBA buffer.
export function rowAlphaCounts(pixels, width, height, threshold = 0) {
  const counts = new Array(height).fill(0);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] > threshold) counts[y] += 1;
    }
  }
  return counts;
}

const toRgb = (colour) => {
  if (Array.isArray(colour)) return colour;
  const m = /^#?([\da-f]{6})$/i.exec(String(colour));
  if (!m) throw new TypeError(`invalid colour "${colour}"`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
};

const channel = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
// WCAG relative luminance of an sRGB colour given as 0–255 channels.
export const relativeLuminance = (r, g, b) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export const DARK_LUMINANCE = 0.2;

// Copy of `pixels` where every visible pixel darker than DARK_LUMINANCE gets the RGB of `light`.
// Alpha is kept, so anti-aliased edges stay smooth; brighter pixels (the teal) are untouched.
export function recolorDark(pixels, light) {
  const [r, g, b] = toRgb(light);
  const out = Uint8Array.from(pixels);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) continue;
    if (relativeLuminance(out[i], out[i + 1], out[i + 2]) < DARK_LUMINANCE) {
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
    }
  }
  return out;
}

// Mask (1 = member) of the largest 8-connected group of pixels with alpha above `threshold`.
// Used when the mark and wordmark share rows: the mark is one solid shape, letters are separate.
export function largestComponent(pixels, width, height, threshold = 0) {
  const label = new Int32Array(width * height).fill(-1);
  let best = { id: -1, size: 0 };
  const stack = [];
  for (let start = 0; start < width * height; start += 1) {
    if (label[start] !== -1 || pixels[start * 4 + 3] <= threshold) continue;
    label[start] = start;
    stack.push(start);
    let size = 0;
    while (stack.length) {
      const p = stack.pop();
      size += 1;
      const x = p % width;
      const y = (p - x) / width;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const q = ny * width + nx;
          if (label[q] === -1 && pixels[q * 4 + 3] > threshold) {
            label[q] = start;
            stack.push(q);
          }
        }
      }
    }
    if (size > best.size) best = { id: start, size };
  }
  const mask = new Uint8Array(width * height);
  if (best.id !== -1) for (let i = 0; i < mask.length; i += 1) if (label[i] === best.id) mask[i] = 1;
  return mask;
}

// Copies of `pixels` split by `mask`: { inside, outside }, the other side made fully transparent.
export function splitByMask(pixels, mask) {
  const inside = Uint8Array.from(pixels);
  const outside = Uint8Array.from(pixels);
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i]) outside[i * 4 + 3] = 0;
    else inside[i * 4 + 3] = 0;
  }
  return { inside, outside };
}

// Alpha-weighted average colour as "#rrggbb", or null for a fully transparent buffer.
export function averageColor(pixels) {
  let sum = 0;
  const acc = [0, 0, 0];
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (!a) continue;
    sum += a;
    for (let c = 0; c < 3; c += 1) acc[c] += pixels[i + c] * a;
  }
  if (!sum) return null;
  return `#${acc.map((v) => Math.round(v / sum).toString(16).padStart(2, '0')).join('')}`;
}
