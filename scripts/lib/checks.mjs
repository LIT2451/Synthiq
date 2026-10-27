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
