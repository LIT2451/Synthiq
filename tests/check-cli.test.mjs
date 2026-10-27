import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, appendFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Runs scripts/check.mjs as a CLI against small sites written into tests/fixtures/.tmp-*.
const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, '../scripts/check.mjs');
const FIXTURES = join(HERE, 'fixtures');
const j = (...p) => p.join('');

const URL_ = 'https://synthiqdigital.com';
const PAGES = { index: '/', about: 'about', services: 'services', portfolio: 'portfolio', contact: 'contact', 404: '404' };
const DESC = 'Synthiq designs, builds and runs software for telecom operators and fast growing companies.';
const LEAD = 'Small senior teams ship cloud platforms, network tooling and AI features with you.';

const page = (name) => {
  const canonical = name === 'index' ? `${URL_}/` : `${URL_}/${name}.html`;
  return `<!doctype html>
<html lang="en">
<head>
  <title>${name} | Synthiq</title>
  <meta name="description" content="${DESC}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${name} | Synthiq">
  <meta property="og:description" content="${DESC}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${URL_}/images/og.png">
  <link rel="stylesheet" href="css/site.css">
  <script src="js/main.js" defer></script>
</head>
<body>
  <a href="#main">Skip</a>
  <nav><a href="index.html">Home</a> <a href="about.html?x=1#team">About</a> <a href="./contact.html">Contact</a></nav>
  <main id="main"><h1>${name}</h1><img src="images/og.png" alt="Synthiq">
    <p>${LEAD}</p>
  </main>
</body>
</html>
`;
};

const CSS = `:root {
  --bg: #06111C;
  --surface: #0C1C2C;
  --ink: #E8F3F6;
  --muted: #9AB2C1;
  --accent: #19D3B5;
  --on-accent: #04121C;
}
@font-face { font-family: "Sora"; src: url("../fonts/sora-600.woff2") format("woff2"); }
body { background: var(--bg); color: var(--ink); font-family: "Manrope", sans-serif; }
`;

function writeSite(dir) {
  rmSync(dir, { recursive: true, force: true });
  const put = (p, content) => {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), content);
  };
  put('site.config.json', JSON.stringify({
    name: 'Synthiq', domain: 'synthiqdigital.com', email: '', phone: '', address: '', taxId: '', hours: '',
    social: { linkedin: '', github: '', facebook: '' },
  }));
  for (const name of Object.keys(PAGES)) put(`${name}.html`, page(name));
  put('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset>\n${['', 'about.html', 'services.html', 'portfolio.html', 'contact.html']
    .map((p) => `  <url><loc>${URL_}/${p}</loc></url>`).join('\n')}\n</urlset>\n`);
  put('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${URL_}/sitemap.xml\n`);
  put('CNAME', 'synthiqdigital.com\n');
  put('css/site.css', CSS);
  put('js/main.js', 'document.documentElement.dataset.ready = "1";\n');
  put('fonts/sora-600.woff2', Buffer.from([0x77, 0x4f, 0x46, 0x32]));
  put('fonts/OFL.txt', 'SIL Open Font License 1.1\n');
  put('images/og.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]));
}

const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });

describe('scripts/check.mjs', () => {
  const clean = join(FIXTURES, '.tmp-clean');
  const broken = join(FIXTURES, '.tmp-broken');
  const source = join(FIXTURES, '.tmp-source');

  beforeAll(() => {
    writeSite(clean);
    writeSite(broken);
    // Trace on line 3 of about.html's body area and a broken link on the nav line.
    const about = readFileSync(join(broken, 'about.html'), 'utf8')
      .replace('<a href="./contact.html">', '<a href="./careers.html">')
      .replace('<h1>about</h1>', j('<h1>about ', 'DV', 'Technic</h1>'));
    writeFileSync(join(broken, 'about.html'), about);
    appendFileSync(join(broken, 'css/site.css'), j('.x { color: #0284', 'c7; }\n'));
    writeFileSync(join(broken, 'js/unused.js'), '// not linked\n');

    mkdirSync(source, { recursive: true });
    // Meta-only text is not visible copy, so only LEAD should be reported.
    writeFileSync(join(source, 'index.html'), `<meta name="description" content="${DESC}"><p>Old copy: ${LEAD}</p>`);
  });

  afterAll(() => {
    for (const dir of [clean, broken, source]) rmSync(dir, { recursive: true, force: true });
  });

  test('a clean site passes with exit 0', () => {
    const res = run('--root', clean);
    expect(res.stderr).toBe('');
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('check passed');
    expect(res.stdout).toContain('--source');
  });

  test('traces, broken links, banned colours and unused assets fail with file:line', () => {
    const res = run('--root', broken);
    expect(res.status).toBe(1);
    const lines = res.stderr.split('\n');
    const navLine = page('about').split('\n').findIndex((l) => l.includes('<nav>')) + 1;
    const h1Line = page('about').split('\n').findIndex((l) => l.includes('<h1>')) + 1;
    expect(lines).toContain(`about.html:${navLine}: missing file for "./careers.html"`);
    expect(lines).toContain(j(`about.html:${h1Line}: trace "DV`, `Technic"`));
    expect(lines).toContain(j('css/site.css:11: banned colour #0284', 'c7'));
    expect(lines).toContain('js/unused.js:1: not referenced by any page');
    expect(res.stderr).toMatch(/check failed: \d+ problem/);
  });

  test('--source reports copy shared with the source site', () => {
    const res = run('--root', clean, '--source', source);
    expect(res.status).toBe(1);
    const leadLine = page('index').split('\n').findIndex((l) => l.includes(LEAD)) + 1;
    expect(res.stderr).toContain(
      `index.html:${leadLine}: shares 8 words with source index.html: "small senior teams ship cloud platforms network tooling"`,
    );
    expect(res.stderr).not.toMatch(/synthiq designs build/);
  });

  test('a missing --source directory exits 2', () => {
    const res = run('--root', clean, '--source', join(FIXTURES, '.tmp-nope'));
    expect(res.status).toBe(2);
    expect(res.stderr).toMatch(/--source directory does not exist/);
  });
});
