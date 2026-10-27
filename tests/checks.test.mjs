import { describe, test, expect } from 'vitest';
import { findTraces, findBadFileNames } from '../scripts/lib/checks.mjs';

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
