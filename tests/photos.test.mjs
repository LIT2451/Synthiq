import { describe, test, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderSite } from '../scripts/build.mjs';
import { validateEntry, sourceUrl } from '../scripts/photos.mjs';

// Unsplash photos: source list, generated files and their use on each page.
// Requirements 1.4, 1.5.
const ROOT = new URL('..', import.meta.url).pathname;
const LIST = JSON.parse(readFileSync(join(ROOT, 'scripts/photos.json'), 'utf8'));
const MAX = 400 * 1024;

// Photos each page must show, by file name in scripts/photos.json.
const EXPECTED = {
  'index.html': ['hero-team'],
  'about.html': ['about-meeting'],
  'services.html': ['solution-relay', 'solution-pilot'],
  'portfolio.html': ['featured-datacenter', 'case-ai', 'case-telecom', 'case-enterprise', 'case-fintech'],
  'contact.html': ['contact-office'],
};

let files;
beforeAll(() => {
  ({ files } = renderSite({ year: 2026 }));
});

const totalSize = (dir) => readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => {
  const p = join(dir, e.name);
  return sum + (e.isDirectory() ? totalSize(p) : statSync(p).size);
}, 0);

describe('photo source list', () => {
  test('every entry is valid and file names are unique', () => {
    for (const entry of LIST) expect(() => validateEntry(entry)).not.toThrow();
    expect(new Set(LIST.map((p) => p.file)).size).toBe(LIST.length);
  });

  test('downloads only from images.unsplash.com', () => {
    for (const p of LIST) expect(new URL(sourceUrl(p.id)).host).toBe('images.unsplash.com');
  });

  test('rejects bad entries', () => {
    const ok = LIST[0];
    expect(() => validateEntry({ ...ok, file: '../x' })).toThrow(/file name/);
    expect(() => validateEntry({ ...ok, id: 'evil.com/x' })).toThrow(/id/);
    expect(() => validateEntry({ ...ok, width: 5 })).toThrow(/width/);
    expect(() => validateEntry({ ...ok, alt: ' ' })).toThrow(/alt/);
  });
});

describe('generated photo files', () => {
  test.each(LIST.map((p) => p.file))('%s: webp and jpg exist and are each <= 400 KB', (file) => {
    for (const ext of ['webp', 'jpg']) {
      const path = join(ROOT, 'images/photos', `${file}.${ext}`);
      expect(existsSync(path), path).toBe(true);
      expect(statSync(path).size).toBeLessThanOrEqual(MAX);
    }
  });

  test('images/ stays under 6 MB', () => {
    expect(totalSize(join(ROOT, 'images'))).toBeLessThan(6 * 1024 * 1024);
  });
});

describe('photos on pages', () => {
  test.each(Object.entries(EXPECTED))('%s shows its photos as picture with webp + jpg', (page, names) => {
    const d = new JSDOM(files[page]).window.document;
    for (const name of names) {
      const entry = LIST.find((p) => p.file === name);
      const imgs = [...d.querySelectorAll(`picture img[src="images/photos/${name}.jpg"]`)];
      expect(imgs.length, name).toBeGreaterThan(0);
      for (const img of imgs) {
        const source = img.closest('picture').querySelector('source[type="image/webp"]');
        expect(source.getAttribute('srcset')).toBe(`images/photos/${name}.webp`);
        expect(img.getAttribute('alt')).toBe(entry.alt);
        expect(Number(img.getAttribute('width'))).toBe(entry.width);
        expect(Number(img.getAttribute('height'))).toBe(entry.height);
        if (name === 'hero-team') {
          expect(img.hasAttribute('loading')).toBe(false);
          expect(img.getAttribute('fetchpriority')).toBe('high');
        } else {
          expect(img.getAttribute('loading')).toBe('lazy');
        }
      }
    }
  });

  test('every photo in the list is used somewhere', () => {
    const html = Object.values(files).join('\n');
    for (const p of LIST) expect(html, p.file).toContain(`images/photos/${p.file}.jpg`);
  });
});
