// Checks the built site against the spec: traces, file names, links, metadata, contact links,
// sitemap/robots/CNAME, image sizes, unused assets, external scripts, banned colours/fonts and
// token contrast. Prints "file:line: message" per problem; exit 1 on problems, 2 on bad usage.
//
//   node scripts/check.mjs [--root <dir>] [--source <dir>]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './lib/site.mjs';
import {
  findTraces, findBadFileNames, findMissingRefs, checkPageMeta, checkContactLinks,
  extractRefs, resolveRef, sharedNgrams, contrastRatio, CONTRAST_PAIRS, MIN_CONTRAST,
} from './lib/checks.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PAGES = ['index.html', 'about.html', 'services.html', 'portfolio.html', 'contact.html', '404.html'];
const SKIP_DIRS = new Set(['specs', 'node_modules', '.git', '.claude']);
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.pdf', '.zip']);
const ASSET_DIRS = ['css', 'js', 'fonts'];
// Files that live in asset folders without being referenced (licences, notes).
const UNREFERENCED_OK = /(^|\/)(OFL|LICENSE|README)(\.[a-z]+)?$/i;
const IMAGE_TOTAL_MAX = 6 * 1024 * 1024;
const IMAGE_FILE_MAX = 400 * 1024;
const BANNED_COLOURS = ['#0284c7', '#09001d', '#38bdf8', '#0369a1'];
const BANNED_FONTS = ['nunito', 'space grotesk'];

const toPosix = (p) => p.split(sep).join('/');
const lineAt = (text, index) => text.slice(0, index).split('\n').length;

// All files under `dir` as posix paths relative to it, skipping SKIP_DIRS at any depth.
function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...walk(join(dir, entry.name), base));
    } else if (entry.isFile()) {
      out.push(toPosix(relative(base, join(dir, entry.name))));
    }
  }
  return out.sort();
}

const isText = (path, buf) => !BINARY_EXT.has(extname(path).toLowerCase()) && !buf.includes(0);

// Visible text of an HTML page: drops scripts, styles, comments and tags, decodes common entities.
export function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#?\w+;/g, ' ');
}

// Best-effort line of the first word of an n-gram in the raw HTML.
function lineOfPhrase(html, phrase) {
  const words = phrase.split(' ').slice(0, 3).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const m = new RegExp(words.join('[^\\p{L}\\p{N}]+'), 'iu').exec(html);
  return m ? lineAt(html, m.index) : 1;
}

export function runCheck({ root = ROOT, source } = {}) {
  const problems = [];
  const notes = [];
  const report = (file, line, message) => problems.push(`${file}:${line}: ${message}`);
  const read = (p) => readFileSync(join(root, p), 'utf8');
  const exists = (p) => existsSync(join(root, p)) && statSync(join(root, p)).isFile();

  let config;
  try {
    config = loadConfig(join(root, 'site.config.json'));
  } catch (err) {
    report('site.config.json', 1, err.message);
    return { problems, notes };
  }
  const url = `https://${config.domain}`;
  const files = walk(root);

  // Traces in every text file, banned names in every path.
  for (const path of files) {
    const buf = readFileSync(join(root, path));
    if (!isText(path, buf)) continue;
    for (const { line, match } of findTraces(buf.toString('utf8'))) report(path, line, `trace "${match}"`);
  }
  for (const path of findBadFileNames(files)) report(path, 1, 'file name contains a banned fragment');

  // Pages: refs, metadata, contact links, alt text, external scripts.
  const referenced = new Set();
  const pageHtml = {};
  for (const page of PAGES) {
    if (!exists(page)) {
      report(page, 1, 'page is missing');
      continue;
    }
    const html = read(page);
    pageHtml[page] = html;
    for (const { line, ref } of findMissingRefs(html, page, exists)) report(page, line, `missing file for "${ref}"`);
    for (const { ref } of extractRefs(html)) {
      const p = resolveRef(ref, page);
      if (p) referenced.add(p);
    }
    const headLine = lineAt(html, Math.max(0, html.search(/<head\b/i)));
    for (const msg of checkPageMeta(html, { url, file: page })) report(page, headLine, msg);
    for (const msg of checkContactLinks(html, config)) {
      const [, line, rest] = /^line (\d+): (.*)$/.exec(msg) ?? [null, 1, msg];
      report(page, line, rest);
    }
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\salt\s*=/i.test(m[0])) report(page, lineAt(html, m.index), '<img> without alt');
    }
    for (const m of html.matchAll(/<script\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi)) {
      const src = m[1].trim();
      const external = /^(https?:)?\/\//i.test(src) && !src.replace(/^(https?:)?\/\//i, '').startsWith(`${config.domain}/`);
      if (external) report(page, lineAt(html, m.index), `script loaded from outside ${config.domain}: ${src}`);
    }
  }

  // sitemap.xml, robots.txt, CNAME.
  if (!exists('sitemap.xml')) report('sitemap.xml', 1, 'missing');
  else {
    const xml = read('sitemap.xml');
    const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => ({ loc: m[1].trim(), line: lineAt(xml, m.index) }));
    if (locs.length !== 5) report('sitemap.xml', 1, `expected 5 URLs, found ${locs.length}`);
    if (new Set(locs.map((l) => l.loc)).size !== locs.length) report('sitemap.xml', 1, 'duplicate URLs');
    for (const { loc, line } of locs) {
      if (!loc.startsWith(`${url}/`)) report('sitemap.xml', line, `URL not on ${url}: ${loc}`);
      else {
        const rel = loc.slice(url.length + 1);
        const file = rel === '' ? 'index.html' : rel;
        if (!exists(file) || file === '404.html') report('sitemap.xml', line, `URL does not map to a page: ${loc}`);
      }
    }
  }
  if (!exists('robots.txt')) report('robots.txt', 1, 'missing');
  else {
    const robots = read('robots.txt');
    if (!/^allow:\s*\/\s*$/im.test(robots)) report('robots.txt', 1, 'missing "Allow: /"');
    if (/^disallow:\s*\/\s*$/im.test(robots)) report('robots.txt', 1, '"Disallow: /" blocks crawling');
    if (!robots.split(/\r?\n/).some((l) => l.trim() === `Sitemap: ${url}/sitemap.xml`)) {
      report('robots.txt', 1, `missing "Sitemap: ${url}/sitemap.xml"`);
    }
  }
  if (!exists('CNAME')) report('CNAME', 1, 'missing');
  else if (read('CNAME').trim() !== config.domain) report('CNAME', 1, `must contain ${config.domain}`);

  // Image budget.
  let imageTotal = 0;
  for (const path of files.filter((f) => f.startsWith('images/'))) {
    const size = statSync(join(root, path)).size;
    imageTotal += size;
    if (size > IMAGE_FILE_MAX) report(path, 1, `image is ${Math.round(size / 1024)} KB (max ${IMAGE_FILE_MAX / 1024} KB)`);
  }
  if (imageTotal >= IMAGE_TOTAL_MAX) report('images', 1, `images total ${(imageTotal / 1048576).toFixed(2)} MB (max 6 MB)`);

  // CSS: refs (fonts, images), banned colours/fonts.
  const cssFiles = files.filter((f) => f.startsWith('css/') && f.endsWith('.css'));
  for (const css of cssFiles) {
    const text = read(css);
    for (const m of text.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
      const p = resolveRef(m[2], css);
      if (!p) continue;
      referenced.add(p);
      if (!exists(p)) report(css, lineAt(text, m.index), `missing file for "${m[2]}"`);
    }
    text.split(/\r?\n/).forEach((content, i) => {
      const lower = content.toLowerCase();
      for (const c of BANNED_COLOURS) if (lower.includes(c)) report(css, i + 1, `banned colour ${c}`);
      for (const f of BANNED_FONTS) if (lower.includes(f)) report(css, i + 1, `banned font "${f}"`);
    });
  }

  // Every css/js/fonts file must be used by a page (or by CSS).
  for (const path of files.filter((f) => ASSET_DIRS.some((d) => f.startsWith(`${d}/`)))) {
    if (!referenced.has(path) && !UNREFERENCED_OK.test(path)) report(path, 1, 'not referenced by any page');
  }

  // Token contrast.
  if (!exists('css/site.css')) report('css/site.css', 1, 'missing');
  else {
    const css = read('css/site.css');
    const tokens = {};
    for (const m of css.matchAll(/(--[\w-]+)\s*:\s*(#[\da-f]{3,6})\b/gi)) {
      if (!(m[1] in tokens)) tokens[m[1]] = { value: m[2], line: lineAt(css, m.index) };
    }
    for (const [fg, bg] of CONTRAST_PAIRS) {
      if (!tokens[fg] || !tokens[bg]) {
        report('css/site.css', 1, `token ${tokens[fg] ? bg : fg} is not defined`);
        continue;
      }
      const ratio = contrastRatio(tokens[fg].value, tokens[bg].value);
      if (ratio < MIN_CONTRAST) {
        report('css/site.css', tokens[fg].line, `${fg} on ${bg} is ${ratio.toFixed(2)}:1 (min ${MIN_CONTRAST}:1)`);
      }
    }
  }

  // Copy compared with the source site.
  if (source) {
    const srcFiles = walk(source).filter((f) => f.endsWith('.html'));
    const srcTexts = srcFiles.map((f) => ({ f, text: visibleText(readFileSync(join(source, f), 'utf8')) }));
    for (const [page, html] of Object.entries(pageHtml)) {
      const text = visibleText(html);
      for (const { f, text: srcText } of srcTexts) {
        for (const gram of sharedNgrams(text, srcText)) {
          report(page, lineOfPhrase(html, gram), `shares 8 words with source ${f}: "${gram}"`);
        }
      }
    }
  } else {
    notes.push('note: copy was not compared with the source site; run with --source <dir> to check 3.1');
  }

  return { problems, notes };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag !== '--root' && flag !== '--source') throw new Error(`unknown argument "${flag}"`);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`${flag} needs a directory`);
    args[flag.slice(2)] = resolve(value);
    i += 1;
  }
  return args;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
    for (const key of ['root', 'source']) {
      if (args[key] && !(existsSync(args[key]) && statSync(args[key]).isDirectory())) {
        throw new Error(`--${key} directory does not exist: ${args[key]}`);
      }
    }
  } catch (err) {
    console.error(`check: ${err.message}`);
    process.exit(2);
  }
  const { problems, notes } = runCheck(args);
  for (const n of notes) console.log(n);
  if (problems.length) {
    for (const p of problems) console.error(p);
    console.error(`check failed: ${problems.length} problem(s)`);
    process.exit(1);
  }
  console.log('check passed');
}
