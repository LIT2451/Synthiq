import { describe, test, expect } from 'vitest';
import { findTraces, findBadFileNames, findMissingRefs, checkContactLinks } from '../scripts/lib/checks.mjs';

// Test inputs are assembled from fragments so this file holds no literal trace.
const j = (...p) => p.join('');

describe('findTraces', () => {
  test.each([
    j('DV', 'Technic'),
    j('dv', 'technic.com'),
    j('DV ', 'Technic Solutions'),
    j('dongle', '@example.org'),
    j('MST: 0111', '058171'),
    j('+84 915 ', '708 055'),
    j('0915', '708055'),
    j('Yen ', 'Hoa Ward'),
    j('Cau ', 'Giay District'),
    j('Open', 'Claw'),
    j('Her', 'mes agent'),
    j('by ', 'Nous Research'),
    j('Sol', 'vet - IT Solutions'),
    j('template', 'monster.com'),
    j('authors/dr', 'theme/'),
  ])('finds %s', (text) => {
    expect(findTraces(`clean line\n${text}`)).toEqual([expect.objectContaining({ line: 2 })]);
  });

  test('reports every pattern on the same line', () => {
    expect(findTraces(j('template', 'monster.com/authors/dr', 'theme')).length).toBe(2);
  });

  test('reports line numbers and ignores clean text', () => {
    expect(findTraces('Synthiq builds software.\nNo traces here, nervous? anonymous!')).toEqual([]);
    const hits = findTraces(['a', 'b', j('<img alt="DV', 'Technic">'), j('/* ', 'sol', 'vet */')].join('\n'));
    expect(hits.map((h) => h.line)).toEqual([3, 4]);
  });
});

describe('findBadFileNames', () => {
  test('flags banned file names', () => {
    const paths = [
      'images/logo-full.png',
      j('images/logo-dv', 'technic-white.svg'),
      j('images/services/her', 'mes-dashboard.png'),
      j('images/', 'nous', '-logo.png'),
      'images/logo copy 2.png',
      'css/site.css',
    ];
    expect(findBadFileNames(paths)).toEqual(paths.slice(1, 5));
  });
});

describe('findMissingRefs', () => {
  const files = new Set(['index.html', 'about.html', 'css/site.css', 'images/logo-mark.png', 'images/logo-mark.webp']);
  const exists = (p) => files.has(p);

  test('reports missing internal refs with line numbers', () => {
    const html = [
      '<link href="css/site.css?v=1">',
      '<a href="about.html#team">About</a>',
      '<a href="./missing.html">x</a>',
      '<img src="images/nope.png" alt="">',
      '<source srcset="images/logo-mark.webp 1x, images/logo-mark@2x.webp 2x">',
      '<a href="https://example.com">e</a><a href="#main">s</a><a href="mailto:a@b.co">m</a><a href="tel:+1">t</a>',
      '<a href="/">home</a>',
    ].join('\n');
    expect(findMissingRefs(html, 'index.html', exists)).toEqual([
      { line: 3, ref: './missing.html' },
      { line: 4, ref: 'images/nope.png' },
      { line: 5, ref: 'images/logo-mark@2x.webp' },
    ]);
  });
});

describe('checkContactLinks', () => {
  test('accepts matching links and flags mismatches or unset fields', () => {
    const html = '<a href="mailto:hello@synthiqdigital.com?subject=Hi">e</a>\n<a href="tel:+84900111222">p</a>';
    expect(checkContactLinks(html, { email: 'hello@synthiqdigital.com', phone: '+84 900 111 222' })).toEqual([]);
    expect(checkContactLinks(html, { email: 'other@synthiqdigital.com', phone: '+84 900 111 222' })).toHaveLength(1);
    expect(checkContactLinks(html, { email: '', phone: '' })).toEqual([
      'line 1: mailto link present but no email is configured',
      'line 2: tel link present but no phone is configured',
    ]);
  });
});
