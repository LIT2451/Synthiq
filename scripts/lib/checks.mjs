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
