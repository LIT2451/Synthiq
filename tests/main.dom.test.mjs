import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { filterCases, initMenu, initFilter, initReveal } from '../js/main.js';

// js/main.js against small DOM fixtures (1.6, 5.3, 5.6, NFR 5).
const dom = (body) => new JSDOM(`<!doctype html><body>${body}</body>`).window;

const MENU = `
  <button class="menu-toggle" aria-controls="mobile-menu" aria-expanded="false"><span class="visually-hidden">Open menu</span></button>
  <div class="mobile-panel" id="mobile-menu">
    <button class="menu-close">x</button>
    <a href="about.html">About</a>
  </div>`;

describe('initMenu', () => {
  test('toggle opens and closes, updating aria-expanded and returning focus', () => {
    const w = dom(MENU);
    const d = w.document;
    initMenu(d);
    const toggle = d.querySelector('.menu-toggle');
    const panel = d.getElementById('mobile-menu');
    toggle.click();
    expect(panel.classList.contains('is-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(d.activeElement).toBe(d.querySelector('.menu-close'));
    d.querySelector('.menu-close').click();
    expect(panel.classList.contains('is-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(d.activeElement).toBe(toggle);
  });

  test('Esc and clicking a link close the menu', () => {
    const w = dom(MENU);
    const d = w.document;
    const menu = initMenu(d);
    menu.open();
    d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(menu.isOpen()).toBe(false);
    expect(d.activeElement).toBe(d.querySelector('.menu-toggle'));
    menu.open();
    d.querySelector('#mobile-menu a').click();
    expect(menu.isOpen()).toBe(false);
  });

  test('locks page scroll with html.menu-open while open, whichever way it closes', () => {
    const w = dom(MENU);
    const d = w.document;
    const html = d.documentElement;
    const menu = initMenu(d);
    expect(html.classList.contains('menu-open')).toBe(false);
    d.querySelector('.menu-toggle').click();
    expect(html.classList.contains('menu-open')).toBe(true);
    d.querySelector('.menu-toggle').click();
    expect(html.classList.contains('menu-open')).toBe(false);
    menu.open();
    d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(html.classList.contains('menu-open')).toBe(false);
    menu.open();
    d.querySelector('.menu-close').click();
    expect(html.classList.contains('menu-open')).toBe(false);
    menu.open();
    d.querySelector('#mobile-menu a').click();
    expect(html.classList.contains('menu-open')).toBe(false);
  });

  test('returns null when the page has no menu', () => {
    expect(initMenu(dom('<p>x</p>').document)).toBeNull();
  });
});

describe('filterCases / initFilter', () => {
  test('filterCases keeps order and returns a copy for all', () => {
    const items = [{ category: 'a' }, { category: 'b' }, { category: 'a' }];
    expect(filterCases(items, 'a')).toEqual([items[0], items[2]]);
    const all = filterCases(items, 'all');
    expect(all).toEqual(items);
    expect(all).not.toBe(items);
  });

  test('clicking a filter hides other cards and updates aria-pressed and the live region', () => {
    const d = dom(`
      <button data-filter="all" aria-pressed="true">All</button>
      <button data-filter="telecom" aria-pressed="false">Telecom</button>
      <p data-filter-status aria-live="polite"></p>
      <article data-category="telecom"></article>
      <article data-category="fintech"></article>
      <article data-category="telecom"></article>`).document;
    initFilter(d);
    const [allBtn, telBtn] = d.querySelectorAll('button');
    const cards = [...d.querySelectorAll('article')];
    const status = d.querySelector('[data-filter-status]');
    expect(status.textContent).toBe('Showing 3 projects');
    telBtn.click();
    expect(cards.map((c) => c.hidden)).toEqual([false, true, false]);
    expect(telBtn.getAttribute('aria-pressed')).toBe('true');
    expect(allBtn.getAttribute('aria-pressed')).toBe('false');
    expect(status.textContent).toBe('Showing 2 projects');
    allBtn.click();
    expect(cards.every((c) => !c.hidden)).toBe(true);
  });
});

describe('initReveal', () => {
  const REVEAL = '<section class="reveal"></section><section class="reveal"></section>';

  test('reduced motion: no observer, everything visible', () => {
    const d = dom(REVEAL).document;
    let created = 0;
    const win = {
      matchMedia: () => ({ matches: true }),
      IntersectionObserver: class { constructor() { created += 1; } observe() {} },
    };
    expect(initReveal(d, win)).toBeNull();
    expect(created).toBe(0);
    expect([...d.querySelectorAll('.reveal')].every((el) => el.classList.contains('is-visible'))).toBe(true);
  });

  test('no IntersectionObserver: everything visible', () => {
    const d = dom(REVEAL).document;
    expect(initReveal(d, { matchMedia: () => ({ matches: false }) })).toBeNull();
    expect([...d.querySelectorAll('.reveal')].every((el) => el.classList.contains('is-visible'))).toBe(true);
  });

  test('with IntersectionObserver: reveals on intersection', () => {
    const d = dom(REVEAL).document;
    let callback;
    const observed = [];
    const win = {
      matchMedia: () => ({ matches: false }),
      IntersectionObserver: class {
        constructor(cb) { callback = cb; }
        observe(el) { observed.push(el); }
        unobserve() {}
      },
    };
    initReveal(d, win);
    expect(observed).toHaveLength(2);
    expect(observed[0].classList.contains('is-visible')).toBe(false);
    callback([{ isIntersecting: true, target: observed[0] }, { isIntersecting: false, target: observed[1] }]);
    expect(observed[0].classList.contains('is-visible')).toBe(true);
    expect(observed[1].classList.contains('is-visible')).toBe(false);
  });
});
