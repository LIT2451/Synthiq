import { describe, test, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderSite } from '../scripts/build.mjs';
import { initMenu, initFilter, initReveal } from '../js/main.js';
import { initContactForm } from '../js/contact.js';
import { loadConfig } from '../scripts/lib/site.mjs';
import { findTraces } from '../scripts/lib/checks.mjs';

const config = loadConfig(new URL('../site.config.json', import.meta.url).pathname);

// Built pages (rendered in memory with a fixed year) + the real browser scripts in jsdom.
// Requirements 1.1–1.8, 2.5, 3.5, 5.2–5.7.
const PAGES = ['index.html', 'about.html', 'services.html', 'portfolio.html', 'contact.html'];
let files;
beforeAll(() => {
  ({ files } = renderSite({ year: 2026 }));
});
const load = (file) => new JSDOM(files[file]).window;
const all = (d, sel) => [...d.querySelectorAll(sel)];
const main = (d) => d.querySelector('main');

describe('page structure', () => {
  test('all 5 pages and 404 are built', () => {
    for (const f of [...PAGES, '404.html']) expect(files[f], f).toBeTruthy();
  });

  test('Home: hero with 2 CTAs, 4 metrics, 3 services, 3 reasons, 6+ tech, CTA band', () => {
    const d = load('index.html').document;
    const hero = d.querySelector('.hero');
    expect(hero.querySelector('h1')).toBeTruthy();
    expect(hero.querySelector('.lead')).toBeTruthy();
    expect(all(hero, '.btn')).toHaveLength(2);
    expect(all(d, '.metrics .metric')).toHaveLength(4);
    expect(all(d, '.bento .card').length).toBeGreaterThanOrEqual(3);
    expect(all(d, '.why-item').length).toBeGreaterThanOrEqual(3);
    expect(all(d, '.stack-chips .chip').length).toBeGreaterThanOrEqual(6);
    expect(d.querySelector('.cta-band')).toBeTruthy();
  });

  test('About: story, 4 metrics, mission + 4 values, 4-step process, CTA band', () => {
    const d = load('about.html').document;
    expect(d.querySelector('.story')).toBeTruthy();
    expect(all(d, '.metrics .metric')).toHaveLength(4);
    expect(d.getElementById('mission-title')).toBeTruthy();
    expect(all(d.getElementById('mission-title').closest('section'), '.card')).toHaveLength(4);
    expect(all(d, '.timeline-step')).toHaveLength(4);
    expect(d.querySelector('.cta-band')).toBeTruthy();
  });

  test('Services: 6 services with 3+ points, 2 named solutions, 3 engagement models, CTA band', () => {
    const d = load('services.html').document;
    const services = all(d, '.service-card');
    expect(services).toHaveLength(6);
    for (const s of services) {
      expect(s.querySelector('h3').textContent.trim()).not.toBe('');
      expect(s.querySelector('p').textContent.trim()).not.toBe('');
      expect(all(s, '.ticks li').length).toBeGreaterThanOrEqual(3);
    }
    const solutions = all(d, '.solution h3').map((h) => h.textContent.trim());
    expect(solutions).toEqual(['Synthiq Relay', 'Synthiq Pilot']);
    const models = all(d.getElementById('models-title').closest('section'), '.card h3').map((h) => h.textContent.trim());
    expect(models).toEqual(['Dedicated team', 'Fixed price', 'Time & material']);
    expect(d.querySelector('.cta-band')).toBeTruthy();
  });

  test('Portfolio: metrics, featured project, All + 4 filters, 8 complete case studies', () => {
    const d = load('portfolio.html').document;
    expect(all(d, '.metrics .metric').length).toBeGreaterThan(0);
    expect(all(d, '.featured')).toHaveLength(1);
    const filters = all(d, 'button[data-filter]').map((b) => b.dataset.filter);
    expect(filters).toEqual(['all', 'ai', 'telecom', 'enterprise', 'fintech']);
    const cases = all(d, '[data-category]');
    expect(cases).toHaveLength(8);
    for (const c of cases) {
      expect(c.querySelector('.case-field')).toBeTruthy();
      expect(c.querySelector('h3')).toBeTruthy();
      expect(c.querySelector('p:not(.case-result)')).toBeTruthy();
      expect(c.querySelector('.case-result').textContent).toMatch(/\d/);
      expect(all(c, '.chips .chip').length).toBeGreaterThan(0);
    }
    for (const cat of filters.slice(1)) expect(cases.filter((c) => c.dataset.category === cat)).toHaveLength(2);
  });

  test('Contact: contact card with configured details, 3 next steps, form', () => {
    const d = load('contact.html').document;
    const card = d.querySelector('.contact-card');
    expect(card).toBeTruthy();
    expect(d.querySelector('.contact-fallback')).toBeNull();
    for (const v of [config.email, config.phone, config.address, config.taxId, config.hours]) {
      expect(card.textContent).toContain(v);
    }
    expect(d.querySelector('form[data-contact-form]').dataset.email).toBe(config.email);
    expect(all(d, '.steps li')).toHaveLength(3);
    const form = d.querySelector('form[data-contact-form]');
    expect(form).toBeTruthy();
    for (const f of ['name', 'email', 'company', 'service', 'message']) {
      expect(d.querySelector(`label[for="${f}"]`), f).toBeTruthy();
    }
  });

  test('404 links back to the home page', () => {
    const d = load('404.html').document;
    expect(main(d).querySelector('a[href="index.html"]')).toBeTruthy();
  });
});

describe('shared header and footer', () => {
  test.each(PAGES)('%s: 5 nav items, one aria-current, logo, favicon, footer year', (file) => {
    const d = load(file).document;
    const nav = all(d, '.nav-list a');
    expect(nav.map((a) => a.textContent.trim())).toEqual(['Home', 'About', 'Services', 'Portfolio', 'Contact']);
    const current = all(d, '.nav-list a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('href')).toBe(file);
    expect(d.querySelector('.header-cta').getAttribute('href')).toBe('contact.html');
    expect(d.querySelector('.brand img[src="images/logo-mark.png"]')).toBeTruthy();
    expect(d.querySelector('.footer-logo img[src="images/logo-full.png"]')).toBeTruthy();
    expect(d.querySelector('link[rel="icon"][href="images/favicon-32.png"]')).toBeTruthy();
    expect(d.querySelector('link[rel="apple-touch-icon"]')).toBeTruthy();
    expect(d.querySelector('.footer-copy').textContent).toContain('© 2026 Synthiq');
  });

  test.each([...PAGES, '404.html'])('%s: contact details in mobile panel and footer, links match config', (file) => {
    const d = load(file).document;
    for (const sel of ['.mobile-contact', '.footer-contact']) {
      const box = d.querySelector(sel);
      expect(box, sel).toBeTruthy();
      for (const v of [config.email, config.phone, config.address, config.taxId, config.hours]) {
        expect(box.textContent, `${sel} ${v}`).toContain(v);
      }
    }
    const mailto = all(d, 'a[href^="mailto:"]').map((a) => a.getAttribute('href'));
    const tel = all(d, 'a[href^="tel:"]').map((a) => a.getAttribute('href'));
    expect(mailto.length).toBeGreaterThan(0);
    expect(tel.length).toBeGreaterThan(0);
    expect(mailto.every((h) => h === `mailto:${config.email}`)).toBe(true);
    expect(tel.every((h) => h === `tel:${config.phone.replace(/[^\d+]/g, '')}`)).toBe(true);
    const social = all(d, '.footer-social a').map((a) => a.getAttribute('href'));
    expect(social).toEqual([config.social.linkedin, config.social.github, config.social.facebook]);
  });
});

describe('demo company details', () => {
  test('use Hanoi details and contain no trace of the old company', () => {
    expect(config.email).toBe('hello@synthiqdigital.com');
    expect(config.phone).toMatch(/^\+84 24 \d{4} \d{4}$/);
    expect(config.address).toMatch(/Hanoi/);
    for (const v of [config.email, config.phone, config.address, config.taxId, config.hours, ...Object.values(config.social)]) {
      expect(findTraces(v), v).toEqual([]);
      expect(v.trim(), 'non-empty').not.toBe('');
    }
  });
});

describe('behaviour on built pages', () => {
  test('mobile menu opens on click and closes on Esc', () => {
    const w = load('index.html');
    const d = w.document;
    initMenu(d);
    const toggle = d.querySelector('.menu-toggle');
    const panel = d.getElementById(toggle.getAttribute('aria-controls'));
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.classList.contains('is-open')).toBe(true);
    d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.classList.contains('is-open')).toBe(false);
  });

  test('portfolio filter: Telecom shows 2 cases, All shows 8', () => {
    const d = load('portfolio.html').document;
    initFilter(d);
    const visible = () => all(d, '[data-category]').filter((c) => !c.hidden);
    d.querySelector('button[data-filter="telecom"]').click();
    expect(visible()).toHaveLength(2);
    expect(visible().every((c) => c.dataset.category === 'telecom')).toBe(true);
    d.querySelector('button[data-filter="all"]').click();
    expect(visible()).toHaveLength(8);
  });

  function contactPage(email) {
    const w = load('contact.html');
    const d = w.document;
    const form = d.querySelector('form[data-contact-form]');
    form.dataset.email = email;
    const navigated = [];
    initContactForm(form, { navigate: (url) => navigated.push(url) });
    const set = (values) => {
      for (const [k, v] of Object.entries(values)) form.elements.namedItem(k).value = v;
    };
    const submit = () => form.querySelector('button[type="submit"]').click();
    return { w, d, form, navigated, set, submit, status: form.querySelector('[role="status"]') };
  }
  const VALID = { name: 'Ana Tran', email: 'ana@example.com', message: 'We need an SMS gateway.' };

  test('empty submit shows 3 errors and focuses name', () => {
    const { d, navigated, submit } = contactPage('');
    submit();
    for (const f of ['name', 'email', 'message']) {
      expect(d.getElementById(`${f}-error`).textContent.trim(), f).not.toBe('');
      expect(d.getElementById(f).getAttribute('aria-invalid')).toBe('true');
    }
    expect(d.activeElement).toBe(d.getElementById('name'));
    expect(navigated).toEqual([]);
  });

  test('no inbox configured: "being set up" message, values kept, no navigation', () => {
    const { w, form, navigated, set, submit, status } = contactPage('');
    const before = w.location.href;
    set(VALID);
    submit();
    expect(status.textContent).toMatch(/being set up/);
    for (const [k, v] of Object.entries(VALID)) expect(form.elements.namedItem(k).value).toBe(v);
    expect(navigated).toEqual([]);
    expect(w.location.href).toBe(before);
  });

  test('inbox configured: navigates to a mailto URL', () => {
    const { navigated, set, submit } = contactPage('hello@example.com');
    set(VALID);
    submit();
    expect(navigated).toHaveLength(1);
    expect(navigated[0].startsWith('mailto:hello@example.com?')).toBe(true);
  });
});

describe('without JavaScript', () => {
  test.each(PAGES)('%s: no content is hidden in the built HTML', (file) => {
    const d = load(file).document;
    expect(all(main(d), '[hidden]')).toEqual([]);
    expect(all(d, '[style*="opacity"]')).toEqual([]);
    expect(d.querySelector('.mobile-panel').hasAttribute('hidden')).toBe(false);
  });

  test('initReveal does not create an observer under reduced motion', () => {
    const d = load('index.html').document;
    let created = 0;
    const win = {
      matchMedia: (q) => ({ matches: q === '(prefers-reduced-motion: reduce)' }),
      IntersectionObserver: class { constructor() { created += 1; } observe() {} },
    };
    expect(initReveal(d, win)).toBeNull();
    expect(created).toBe(0);
    expect(all(d, '.reveal').every((el) => el.classList.contains('is-visible'))).toBe(true);
  });
});
