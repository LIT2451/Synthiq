// Brand config loading and site-wide derived values.
import { readFileSync } from 'node:fs';

export class ConfigError extends Error {
  constructor(message) {
    super(`site.config.json: ${message}`);
    this.name = 'ConfigError';
  }
}

const CONTACT_FIELDS = ['email', 'phone', 'address', 'taxId', 'hours'];
const SOCIAL_FIELDS = ['linkedin', 'github', 'facebook'];

// Validates a parsed config object. Empty strings mean "not provided yet".
export function validateConfig(config) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new ConfigError('must be a JSON object');
  }
  for (const key of ['name', 'domain']) {
    if (typeof config[key] !== 'string' || config[key].trim() === '') {
      throw new ConfigError(`"${key}" is required`);
    }
  }
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(config.domain)) {
    throw new ConfigError(`"domain" is not a bare host name: "${config.domain}"`);
  }
  for (const key of CONTACT_FIELDS) {
    if (config[key] !== undefined && typeof config[key] !== 'string') {
      throw new ConfigError(`"${key}" must be a string`);
    }
  }
  const social = config.social ?? {};
  if (typeof social !== 'object' || social === null || Array.isArray(social)) {
    throw new ConfigError('"social" must be an object');
  }
  for (const key of SOCIAL_FIELDS) {
    if (social[key] !== undefined && typeof social[key] !== 'string') {
      throw new ConfigError(`"social.${key}" must be a string`);
    }
    if (social[key] && !/^https:\/\//.test(social[key])) {
      throw new ConfigError(`"social.${key}" must be an https:// URL`);
    }
  }
  return {
    name: config.name.trim(),
    domain: config.domain.trim().toLowerCase(),
    ...Object.fromEntries(CONTACT_FIELDS.map((k) => [k, (config[k] ?? '').trim()])),
    social: Object.fromEntries(SOCIAL_FIELDS.map((k) => [k, (social[k] ?? '').trim()])),
  };
}

export function loadConfig(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    throw new ConfigError(`cannot read ${path} (${err.code ?? err.message})`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ConfigError(`invalid JSON (${err.message})`);
  }
  return validateConfig(parsed);
}

// Maps a page path to its output file: "/" -> "index.html", "/about" -> "about.html".
export function fileForPath(path) {
  if (path === '/') return 'index.html';
  const slug = path.replace(/^\//, '');
  if (!/^[a-z0-9-]+$/.test(slug)) throw new ConfigError(`invalid page path "${path}"`);
  return `${slug}.html`;
}

export function canonicalUrl(url, path) {
  return path === '/' ? `${url}/` : `${url}/${fileForPath(path)}`;
}

export function buildContext(config, pageMeta = {}, { year = new Date().getFullYear() } = {}) {
  const url = `https://${config.domain}`;
  const hasContact = CONTACT_FIELDS.some((k) => config[k] !== '');
  const hasSocial = SOCIAL_FIELDS.some((k) => config.social[k] !== '');
  const path = pageMeta.path ?? '/';
  const nav = pageMeta.nav ?? '';
  return {
    ...config,
    url,
    year: String(year),
    phoneHref: config.phone.replace(/[^\d+]/g, ''),
    hasContact,
    hasSocial,
    page: {
      title: pageMeta.title ?? '',
      description: pageMeta.description ?? '',
      path,
      canonical: canonicalUrl(url, path),
      scripts: pageMeta.scripts ?? '',
      contactScript: pageMeta.scripts === 'contact',
    },
    // One flag per nav item so templates can mark the active link.
    nav: Object.fromEntries(['home', 'about', 'services', 'portfolio', 'contact'].map((k) => [k, k === nav])),
  };
}

const xmlEscape = (s) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

// pages: [{ path, sitemap }]; pages with sitemap === false are skipped.
export function sitemapXml(url, pages) {
  const entries = pages
    .filter((p) => p.sitemap !== false)
    .map((p) => `  <url>\n    <loc>${xmlEscape(canonicalUrl(url, p.path))}</loc>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
}

export function robotsTxt(url) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`;
}
