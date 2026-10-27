// Pure checks used by scripts/check.mjs. No file system access here.

// Strings that must never appear in the repo (source site brand, products and template author).
// Built from fragments so this file does not flag itself.
const j = (...parts) => parts.join('');
export const TRACE_PATTERNS = [
  new RegExp(j('dv', '[\\s_-]?', 'technic'), 'i'),
  new RegExp(j('dongle', '@'), 'i'),
  new RegExp(j('0111', '058', '171')),
  new RegExp(j('0?', '915', '[\\s.-]?', '708', '[\\s.-]?', '055')),
  new RegExp(j('yen', '\\s+', 'hoa'), 'i'),
  new RegExp(j('cau', '\\s+', 'giay'), 'i'),
  new RegExp(j('open', 'claw'), 'i'),
  new RegExp(j('her', 'mes'), 'i'),
  new RegExp(j('\\b', 'nous', '\\b'), 'i'),
  new RegExp(j('sol', 'vet'), 'i'),
  new RegExp(j('template', 'monster'), 'i'),
  new RegExp(j('dr', 'theme'), 'i'),
];

const BAD_NAME = new RegExp(j('dv', '[\\s_-]?', 'technic', '|', 'her', 'mes', '|', 'nous', '|', 'logo copy'), 'i');

// Returns every trace match as { line, match } with 1-based line numbers.
export function findTraces(text) {
  const hits = [];
  String(text).split(/\r?\n/).forEach((content, i) => {
    for (const pattern of TRACE_PATTERNS) {
      const m = pattern.exec(content);
      if (m) hits.push({ line: i + 1, match: m[0] });
    }
  });
  return hits;
}

// Returns the paths whose file or directory names contain a banned fragment.
export function findBadFileNames(paths) {
  return paths.filter((p) => BAD_NAME.test(p));
}

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

// All href/src/srcset values with their line numbers.
export function extractRefs(html) {
  const refs = [];
  for (const m of html.matchAll(/\s(href|src|srcset)\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const value = m[3] ?? m[4];
    const line = lineAt(html, m.index);
    if (m[1].toLowerCase() === 'srcset') {
      for (const part of value.split(',')) {
        const url = part.trim().split(/\s+/)[0];
        if (url) refs.push({ line, ref: url });
      }
    } else {
      refs.push({ line, ref: value });
    }
  }
  return refs;
}

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

// Resolves an internal ref against the directory of `file`; returns null for external refs.
export function resolveRef(ref, file) {
  const trimmed = ref.trim();
  if (trimmed === '' || EXTERNAL.test(trimmed)) return null;
  const path = trimmed.split(/[?#]/)[0];
  if (path === '') return null;
  const base = path.startsWith('/') ? [] : file.split('/').slice(0, -1);
  const parts = [...base];
  for (const seg of decodeURI(path).split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  const resolved = parts.join('/');
  return path.endsWith('/') || resolved === '' ? `${resolved ? `${resolved}/` : ''}index.html` : resolved;
}

// Internal href/src that point at files not in the site. `exists(path)` decides existence.
export function findMissingRefs(html, file, exists) {
  return extractRefs(html)
    .map((r) => ({ ...r, path: resolveRef(r.ref, file) }))
    .filter((r) => r.path !== null && !exists(r.path))
    .map(({ line, ref }) => ({ line, ref }));
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decodeEntities = (s) => s.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
  return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
});

// Attributes of every <tag ...> as plain objects with decoded values.
function tagsOf(html, name) {
  const out = [];
  for (const m of html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))) {
    const attrs = {};
    for (const a of m[1].matchAll(/([a-z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
      attrs[a[1].toLowerCase()] = decodeEntities(a[3] ?? a[4]);
    }
    out.push(attrs);
  }
  return out;
}

const META_TITLE_MAX = 60;
const META_DESC_MIN = 70;
const META_DESC_MAX = 160;

// Head metadata required by 6.1/6.2 for the page built into `file`; `url` is https://<domain>.
export function checkPageMeta(html, { url, file }) {
  const errors = [];
  const canonical = file === 'index.html' ? `${url}/` : `${url}/${file}`;

  const lang = tagsOf(html, 'html')[0]?.lang;
  if (lang !== 'en') errors.push(`<html lang> must be "en" (found ${lang === undefined ? 'none' : `"${lang}"`})`);

  const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : '';
  if (!title) errors.push('missing <title>');
  else if (title.length > META_TITLE_MAX) errors.push(`<title> is ${title.length} characters (max ${META_TITLE_MAX})`);

  const metas = tagsOf(html, 'meta');
  const meta = (key, value) => metas.find((m) => m[key] === value)?.content?.trim();

  const desc = meta('name', 'description');
  if (desc === undefined) errors.push('missing meta description');
  else if (desc.length < META_DESC_MIN || desc.length > META_DESC_MAX) {
    errors.push(`meta description is ${desc.length} characters (need ${META_DESC_MIN}-${META_DESC_MAX})`);
  }

  const link = tagsOf(html, 'link').find((l) => (l.rel ?? '').split(/\s+/).includes('canonical'));
  if (!link?.href) errors.push('missing canonical link');
  else if (link.href !== canonical) errors.push(`canonical is ${link.href} (expected ${canonical})`);

  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image']) {
    if (!meta('property', prop)) errors.push(`missing ${prop}`);
  }
  const ogUrl = meta('property', 'og:url');
  if (ogUrl && ogUrl !== canonical) errors.push(`og:url is ${ogUrl} (expected ${canonical})`);
  const ogImage = meta('property', 'og:image');
  if (ogImage && !(ogImage.startsWith(`${url}/`) && /\.(png|jpe?g)$/i.test(ogImage))) {
    errors.push(`og:image must be a PNG/JPEG on ${url} (found ${ogImage})`);
  }
  return errors;
}

// Lowercased words with punctuation removed (letters and digits of any script are kept).
export function normalizeWords(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const ngrams = (words, n) => {
  const out = new Set();
  for (let i = 0; i + n <= words.length; i += 1) out.add(words.slice(i, i + n).join(' '));
  return out;
};

// Every run of n consecutive normalised words that occurs in both texts, in order of first use in `a`.
export function sharedNgrams(a, b, n = 8) {
  const inB = ngrams(normalizeWords(b), n);
  return [...ngrams(normalizeWords(a), n)].filter((g) => inB.has(g));
}

// Token pairs [text, background] in css/site.css that must reach 4.5:1.
export const CONTRAST_PAIRS = [
  ['--ink', '--bg'],
  ['--ink', '--surface'],
  ['--muted', '--bg'],
  ['--muted', '--surface'],
  ['--accent', '--bg'],
  ['--on-accent', '--accent'],
];
export const MIN_CONTRAST = 4.5;

function luminance(hex) {
  const m = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(String(hex).trim());
  if (!m) throw new TypeError(`invalid hex colour "${hex}"`);
  const full = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// WCAG 2.x contrast ratio between two #rgb/#rrggbb colours (1–21).
export function contrastRatio(hexA, hexB) {
  const [hi, lo] = [luminance(hexA), luminance(hexB)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// mailto:/tel: links must match the configured email/phone, and must not exist when unset.
export function checkContactLinks(html, config) {
  const errors = [];
  const email = (config.email ?? '').toLowerCase();
  const phone = (config.phone ?? '').replace(/[^\d+]/g, '');
  for (const { line, ref } of extractRefs(html)) {
    const decoded = decodeEntities(ref);
    if (/^mailto:/i.test(decoded)) {
      const to = decoded.slice(7).toLowerCase();
      // The address may be followed by ?subject=… headers.
      const matches = to === email || to.startsWith(`${email}?`);
      if (!email) errors.push(`line ${line}: mailto link present but no email is configured`);
      else if (!matches) errors.push(`line ${line}: mailto:${decoded.slice(7)} does not match ${config.email}`);
    } else if (/^tel:/i.test(decoded)) {
      const num = decoded.slice(4);
      if (!phone) errors.push(`line ${line}: tel link present but no phone is configured`);
      else if (num !== phone) errors.push(`line ${line}: tel:${num} does not match ${phone}`);
    }
  }
  return errors;
}
