import { describe, test, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import {
  validateConfig, loadConfig, buildContext, sitemapXml, robotsTxt, fileForPath, canonicalUrl, ConfigError,
} from '../scripts/lib/site.mjs';

const base = { name: 'Synthiq', domain: 'synthiqdigital.com' };

describe('config', () => {
  test('repo config loads with the Synthiq domain', () => {
    const config = loadConfig(fileURLToPath(new URL('../site.config.json', import.meta.url)));
    expect(config.domain).toBe('synthiqdigital.com');
    expect(config.name).toBe('Synthiq');
  });

  test.each([
    [{ domain: 'synthiqdigital.com' }, /"name" is required/],
    [{ name: 'Synthiq' }, /"domain" is required/],
    [{ name: 'Synthiq', domain: '  ' }, /"domain" is required/],
    [{ name: 'Synthiq', domain: 'https://synthiqdigital.com' }, /bare host name/],
    [{ ...base, email: 42 }, /"email" must be a string/],
    [{ ...base, social: [] }, /"social" must be an object/],
    [{ ...base, social: { github: 'http://x.com' } }, /https:\/\//],
    [null, /JSON object/],
  ])('rejects invalid config %#', (config, message) => {
    expect(() => validateConfig(config)).toThrow(message);
    expect(() => validateConfig(config)).toThrow(ConfigError);
  });

  test('missing file and bad JSON report a config error', () => {
    expect(() => loadConfig('/nonexistent/site.config.json')).toThrow(/cannot read/);
  });

  test('fills absent optional fields with empty strings', () => {
    const c = validateConfig(base);
    expect(c.email).toBe('');
    expect(c.social).toEqual({ linkedin: '', github: '', facebook: '' });
  });
});

describe('buildContext', () => {
  test('derives url, fixed year, phone href and flags', () => {
    const c = validateConfig({ ...base, phone: '+84 900 111 222' });
    const ctx = buildContext(c, { path: '/about', nav: 'about', title: 'About' }, { year: 2026 });
    expect(ctx.url).toBe('https://synthiqdigital.com');
    expect(ctx.year).toBe('2026');
    expect(ctx.phoneHref).toBe('+84900111222');
    expect(ctx.hasContact).toBe(true);
    expect(ctx.hasSocial).toBe(false);
    expect(ctx.page.canonical).toBe('https://synthiqdigital.com/about.html');
    expect(ctx.nav).toEqual({ home: false, about: true, services: false, portfolio: false, contact: false });
  });

  test('hasContact is false when no contact field is set', () => {
    expect(buildContext(validateConfig(base)).hasContact).toBe(false);
  });
});

describe('paths', () => {
  test('maps paths to files and canonical URLs', () => {
    expect(fileForPath('/')).toBe('index.html');
    expect(fileForPath('/portfolio')).toBe('portfolio.html');
    expect(canonicalUrl('https://synthiqdigital.com', '/')).toBe('https://synthiqdigital.com/');
    expect(() => fileForPath('/../etc')).toThrow(ConfigError);
  });
});

describe('sitemap and robots', () => {
  const pages = ['/', '/about', '/services', '/portfolio', '/contact'].map((path) => ({ path }));

  test('sitemap lists exactly the 5 pages and skips sitemap:false', () => {
    const xml = sitemapXml('https://synthiqdigital.com', [...pages, { path: '/404', sitemap: false }]);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([
      'https://synthiqdigital.com/',
      'https://synthiqdigital.com/about.html',
      'https://synthiqdigital.com/services.html',
      'https://synthiqdigital.com/portfolio.html',
      'https://synthiqdigital.com/contact.html',
    ]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  });

  test('robots allows crawling and points to the sitemap', () => {
    const txt = robotsTxt('https://synthiqdigital.com');
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Sitemap: https://synthiqdigital.com/sitemap.xml');
  });
});
