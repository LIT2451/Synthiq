import { test, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { render, escapeHtml } from '../scripts/lib/render.mjs';
import { validateConfig, buildContext } from '../scripts/lib/site.mjs';
import { checkContactLinks } from '../scripts/lib/checks.mjs';

// P8: Thông tin liên hệ chỉ hiện khi có.
// Với mọi config (mỗi trường liên hệ rỗng hoặc có giá trị): HTML build ra từ partial
// contact-items/footer chứa nhãn và link mailto:/tel: của trường khi và chỉ khi trường có giá trị,
// và checkContactLinks trả rỗng.

const read = (name) => readFileSync(new URL(`../src/partials/${name}.html`, import.meta.url), 'utf8');
const partials = { 'contact-items': read('contact-items'), footer: read('footer') };

const LABELS = { email: 'Email', phone: 'Phone', address: 'Office', hours: 'Hours', taxId: 'Tax ID' };
const SOCIAL = { linkedin: 'LinkedIn', github: 'GitHub', facebook: 'Facebook' };

const maybe = (arb) => fc.oneof(fc.constant(''), arb);
const textArb = fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim() !== '');
const configArb = fc.record({
  email: maybe(fc.emailAddress()),
  phone: maybe(fc.stringMatching(/^\+?[0-9]{2,3}( [0-9]{3}){2,3}$/)),
  address: maybe(textArb),
  hours: maybe(textArb),
  taxId: maybe(fc.stringMatching(/^[0-9]{10}$/)),
  social: fc.record({
    linkedin: maybe(fc.webUrl({ validSchemes: ['https'] })),
    github: maybe(fc.webUrl({ validSchemes: ['https'] })),
    facebook: maybe(fc.webUrl({ validSchemes: ['https'] })),
  }),
});

test('P8: contact items appear if and only if configured', () => {
  fc.assert(
    fc.property(configArb, (raw) => {
      const config = validateConfig({ name: 'Synthiq', domain: 'synthiqdigital.com', ...raw });
      const ctx = buildContext(config, { path: '/' }, { year: 2026 });

      for (const tpl of ['{{> contact-items}}', '{{> footer}}']) {
        const html = render(tpl, ctx, partials);
        const showContact = tpl.includes('contact-items') || ctx.hasContact;

        for (const [field, label] of Object.entries(LABELS)) {
          const present = showContact && config[field] !== '';
          expect(html.includes(`contact-${field === 'taxId' ? 'tax' : field}"`)).toBe(present);
          expect(html.includes(`>${label}</span>`)).toBe(present);
          if (present) expect(html).toContain(escapeHtml(config[field]));
        }

        // mailto:/tel: links exist iff the field is set, and point at the configured value.
        const mailtos = [...html.matchAll(/href="mailto:([^"]*)"/g)].map((m) => m[1]);
        const tels = [...html.matchAll(/href="tel:([^"]*)"/g)].map((m) => m[1]);
        expect(mailtos).toEqual(showContact && config.email ? [escapeHtml(config.email)] : []);
        expect(tels).toEqual(showContact && config.phone ? [config.phone.replace(/[^\d+]/g, '')] : []);
        for (const t of tels) expect(t).toMatch(/^\+?\d+$/);

        expect(checkContactLinks(html, config)).toEqual([]);

        // No empty labels or empty links ever.
        expect(html).not.toMatch(/href=""/);
        expect(html).not.toMatch(/<span>\s*<\/span>/);
      }

      // Footer: contact block and social links follow their own fields.
      const footer = render('{{> footer}}', ctx, partials);
      expect(footer.includes('footer-contact')).toBe(ctx.hasContact);
      for (const [key, label] of Object.entries(SOCIAL)) {
        expect(footer.includes(`>${label}</a>`)).toBe(config.social[key] !== '');
      }
      expect(footer.includes('footer-social')).toBe(Object.values(config.social).some((v) => v !== ''));
      expect(footer).toContain('&copy; 2026 Synthiq');
    }),
    { numRuns: 200 },
  );
});
