// Shared behaviour for every page: mobile menu, portfolio filter, reveal-on-scroll.
// Loaded as an ES module, so it runs after the document is parsed. Every hidden state in CSS sits
// under the `.js` class, so with JavaScript off all content stays visible (5.6).

const ALL = 'all';

// Pure: items whose `category` equals the chosen one, in their original order; `all` keeps everything.
export function filterCases(items, category) {
  if (category === ALL) return items.slice();
  return items.filter((item) => item.category === category);
}

export function initMenu(root = document) {
  const toggle = root.querySelector('.menu-toggle');
  const panel = toggle && root.getElementById(toggle.getAttribute('aria-controls'));
  if (!panel) return null;
  const closeBtn = panel.querySelector('.menu-close');
  const label = toggle.querySelector('.visually-hidden');

  const isOpen = () => panel.classList.contains('is-open');
  function setOpen(open, { restoreFocus = false } = {}) {
    panel.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    if (open) {
      const first = panel.querySelector('a, button');
      if (first) first.focus();
    } else if (restoreFocus) {
      toggle.focus();
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen(), { restoreFocus: true }));
  if (closeBtn) closeBtn.addEventListener('click', () => setOpen(false, { restoreFocus: true }));
  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) setOpen(false, { restoreFocus: true });
  });
  return { open: () => setOpen(true), close: () => setOpen(false), isOpen };
}

// Filter buttons: <button class="chip" data-filter="all|<category>" aria-pressed>.
// Cards: [data-category]. Live region: [data-filter-status].
export function initFilter(root = document) {
  const buttons = [...root.querySelectorAll('button[data-filter]')];
  const cards = [...root.querySelectorAll('[data-category]')];
  if (!buttons.length || !cards.length) return null;
  const status = root.querySelector('[data-filter-status]');
  const items = cards.map((el) => ({ el, category: el.dataset.category }));

  function apply(category) {
    const shown = new Set(filterCases(items, category).map((item) => item.el));
    for (const { el } of items) el.hidden = !shown.has(el);
    for (const btn of buttons) btn.setAttribute('aria-pressed', String(btn.dataset.filter === category));
    if (status) status.textContent = `Showing ${shown.size} ${shown.size === 1 ? 'project' : 'projects'}`;
  }

  for (const btn of buttons) btn.addEventListener('click', () => apply(btn.dataset.filter));
  const pressed = buttons.find((btn) => btn.getAttribute('aria-pressed') === 'true');
  apply(pressed ? pressed.dataset.filter : ALL);
  return { apply };
}

// Adds .is-visible as elements scroll in. Without IntersectionObserver or with reduced motion,
// everything is shown at once and no observer is created.
export function initReveal(root = document, win = globalThis) {
  const els = [...root.querySelectorAll('.reveal')];
  const reduce = typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof win.IntersectionObserver !== 'function') {
    for (const el of els) el.classList.add('is-visible');
    return null;
  }
  const observer = new win.IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  for (const el of els) observer.observe(el);
  return observer;
}

if (typeof document !== 'undefined' && !globalThis.__SYNTHIQ_NO_AUTOINIT__) {
  initMenu();
  initFilter();
  initReveal();
}
