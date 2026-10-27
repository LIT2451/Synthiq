import { describe, test, expect } from 'vitest';
import { render, parsePage, escapeHtml, RenderError } from '../scripts/lib/render.mjs';

describe('render', () => {
  test('replaces keys and dotted paths', () => {
    expect(render('Hi {{name}} / {{social.github}}', { name: 'Synthiq', social: { github: 'gh' } })).toBe('Hi Synthiq / gh');
  });

  test('if / else with nesting', () => {
    const tpl = '{{#if a}}A{{#if b}}B{{else}}nb{{/if}}{{else}}na{{/if}}';
    expect(render(tpl, { a: 'x', b: '' })).toBe('Anb');
    expect(render(tpl, { a: 'x', b: 'y' })).toBe('AB');
    expect(render(tpl, { a: '', b: 'y' })).toBe('na');
    expect(render('{{#if f}}yes{{else}}no{{/if}}', { f: false })).toBe('no');
  });

  test('expands nested partials', () => {
    const partials = { outer: '<o>{{> inner}}</o>', inner: '{{v}}' };
    expect(render('{{> outer}}', { v: 'z' }, partials)).toBe('<o>z</o>');
  });

  test('values are not re-interpreted as tags', () => {
    expect(render('{{v}}', { v: '{{other}}' })).toBe('&#123;&#123;other&#125;&#125;');
  });

  test('unbalanced blocks throw', () => {
    expect(() => render('{{#if a}}x', { a: 'y' })).toThrow(RenderError);
    expect(() => render('x{{/if}}', {})).toThrow(RenderError);
    expect(() => render('{{else}}', {})).toThrow(RenderError);
  });
});

describe('parsePage', () => {
  test('reads front matter and body', () => {
    const { meta, body } = parsePage('---\ntitle: T\ndescription: D: with colon\npath: /\nsitemap: false\n---\n<h1>x</h1>\n');
    expect(meta).toEqual({ title: 'T', description: 'D: with colon', path: '/', sitemap: false });
    expect(body).toBe('<h1>x</h1>\n');
  });
});

describe('errors', () => {
  test.each(['title', 'description', 'path'])('front matter without %s throws', (key) => {
    const fields = { title: 'T', description: 'D', path: '/' };
    delete fields[key];
    const fm = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n');
    expect(() => parsePage(`---\n${fm}\n---\nbody`)).toThrow(new RegExp(key));
  });

  test('page without front matter throws', () => {
    expect(() => parsePage('<h1>x</h1>')).toThrow(RenderError);
  });

  test('unknown key throws', () => {
    expect(() => render('{{missing}}', {})).toThrow(/unknown key "missing"/);
    expect(() => render('{{a.b}}', { a: {} })).toThrow(RenderError);
  });

  test('unknown partial throws', () => {
    expect(() => render('{{> nope}}', {}, {})).toThrow(/unknown partial "nope"/);
  });

  test('partial cycle throws', () => {
    const partials = { a: '{{> b}}', b: '{{> a}}' };
    expect(() => render('{{> a}}', {}, partials)).toThrow(/cycle: a > b > a/);
    expect(() => render('{{> self}}', {}, { self: 'x{{> self}}' })).toThrow(RenderError);
  });

  test('partials deeper than 5 levels throw, 5 levels are allowed', () => {
    const chain = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`p${i}`, i < n - 1 ? `{{> p${i + 1}}}` : 'end']));
    expect(render('{{> p0}}', {}, chain(5))).toBe('end');
    expect(() => render('{{> p0}}', {}, chain(6))).toThrow(/deeper than 5/);
  });
});

describe('escapeHtml', () => {
  test.each([
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ["'", '&#39;'],
  ])('escapes %s', (input, expected) => {
    expect(escapeHtml(input)).toBe(expected);
  });

  test('escapes special characters', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });
});
