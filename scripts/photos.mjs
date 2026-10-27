// Downloads the Unsplash photos listed in scripts/photos.json, crops them and writes
// images/photos/<file>.webp + .jpg, each kept under the 400 KB image budget.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'images', 'photos');
const MAX_BYTES = 400 * 1024;
const QUALITIES = [72, 64, 56, 48];

export function validateEntry(entry) {
  const { file, id, width, height, alt } = entry ?? {};
  if (!/^[a-z0-9-]+$/.test(file ?? '')) throw new Error(`bad file name: ${JSON.stringify(file)}`);
  if (!/^\d{10,13}-[0-9a-f]{12}$/.test(id ?? '')) throw new Error(`${file}: bad Unsplash photo id`);
  for (const [k, v] of [['width', width], ['height', height]]) {
    if (!Number.isInteger(v) || v < 200 || v > 2000) throw new Error(`${file}: ${k} must be 200–2000`);
  }
  if (typeof alt !== 'string' || alt.trim() === '') throw new Error(`${file}: alt is required`);
  return entry;
}

export const sourceUrl = (id) => `https://images.unsplash.com/photo-${id}?w=2000&q=90&fm=jpg`;

async function encode(img, format) {
  for (const quality of QUALITIES) {
    const buf = format === 'webp'
      ? await img.clone().webp({ quality }).toBuffer()
      : await img.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
    if (buf.length <= MAX_BYTES) return buf;
  }
  throw new Error(`cannot get ${format} under ${MAX_BYTES / 1024} KB`);
}

async function main() {
  const list = JSON.parse(readFileSync(join(ROOT, 'scripts', 'photos.json'), 'utf8')).map(validateEntry);
  mkdirSync(OUT, { recursive: true });
  for (const p of list) {
    const res = await fetch(sourceUrl(p.id));
    if (!res.ok) throw new Error(`${p.file}: download failed (HTTP ${res.status})`);
    const img = sharp(Buffer.from(await res.arrayBuffer()))
      .resize(p.width, p.height, { fit: 'cover', position: 'attention' });
    for (const format of ['webp', 'jpg']) {
      const buf = await encode(img, format === 'jpg' ? 'jpeg' : 'webp');
      writeFileSync(join(OUT, `${p.file}.${format}`), buf);
      console.log(`images/photos/${p.file}.${format}  ${Math.round(buf.length / 1024)} KB`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`photos: ${err.message}`);
    process.exit(1);
  });
}
