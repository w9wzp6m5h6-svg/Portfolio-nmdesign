/**
 * Audit of the production build.
 *   node tools/qa/audit-dist.mjs [distDir=dist] [baseUrl]
 * Static: every path referenced by HTML / CSS / JS / project data exists in dist,
 *         no local machine paths, list of external URLs.
 * Runtime (when baseUrl is given): loads the site, scrolls everything, opens every
 *         project and scrolls it, waits for the 3D model; reports any failed request.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { createRequire } from 'node:module';

const dist = process.argv[2] || 'dist';
const base = process.argv[3];
let fail = 0;
const ok = (label, cond, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`); if (!cond) fail++; };

const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(relative(dist, p).split('\\').join('/')); } })(dist);
const has = (p) => files.includes(p.replace(/^\.\//, '').replace(/^\//, '').split(/[?#]/)[0]);

/* --- static references --- */
const refs = new Set();
// toutes les pages : chaque chemin relatif est résolu depuis le dossier de la page
const PAGES = ['index.html', 'projets/index.html', 'a-propos/index.html', 'offres/index.html'];
let html = '';
for (const pg of PAGES) {
  ok(`page présente : ${pg}`, files.includes(pg));
  if (!files.includes(pg)) continue;
  const h = readFileSync(join(dist, pg), 'utf8');
  html += h;
  const dir = pg.includes('/') ? pg.slice(0, pg.lastIndexOf('/') + 1) : '';
  for (const m of h.matchAll(/(?:href|src|content|srcset)="(\.{1,2}\/[^"#]*)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(' ')[0];
      if (!u) continue;
      const resolved = new URL(u, `http://x/${dir}`).pathname.slice(1);
      refs.add(resolved === '' || resolved.endsWith('/') ? resolved + 'index.html' : resolved);
    }
  }
}
for (const f of files.filter((f) => f.endsWith('.css'))) {
  for (const m of readFileSync(join(dist, f), 'utf8').matchAll(/url\(([^)]+)\)/g)) {
    const u = m[1].replace(/["']/g, '');
    if (!u.startsWith('data:')) refs.add('assets/' + u.replace(/^\.\//, ''));
  }
}
for (const f of files.filter((f) => f.endsWith('.js'))) {
  const src = readFileSync(join(dist, f), 'utf8');
  for (const m of src.matchAll(/["'`](?:\.\/)?((?:assets|media|models)\/[\w./-]+\.(?:js|css|webp|jpg|png|glb|woff2?|svg))["'`]/g)) refs.add(m[1]);
}
// project images are built from a template — enumerate them from the data module
const { projects } = await import(new URL('../../src/data/projects.js', import.meta.url).href).catch(() => ({ projects: null }));
if (projects) {
  const imgs = (im) => im.srcset.split(', ').map((e) => e.split(' ')[0]);
  for (const p of projects) {
    [p.cover, p.hero].filter(Boolean).forEach((im) => imgs(im).forEach((u) => refs.add(u)));
    for (const b of p.blocks) [b.src, b.desktop, b.mobile, ...(b.items || [])].filter((x) => x && x.srcset).forEach((im) => imgs(im).forEach((u) => refs.add(u)));
  }
}
const missing = [...refs].filter((r) => !has(r));
ok(`all ${refs.size} referenced files exist in ${dist}/`, missing.length === 0, missing.slice(0, 8).join(', '));
for (const need of ['index.html', 'favicon.svg', 'media/og.jpg', 'models/sneaker-hd.glb', 'models/sneaker-lite.glb']) ok(`present: ${need}`, has(need));
ok('fonts bundled (woff2)', files.filter((f) => f.endsWith('.woff2')).length >= 4, `${files.filter((f) => f.endsWith('.woff2')).length} files`);

const text = files.filter((f) => ['.html', '.js', '.css'].includes(extname(f))).map((f) => readFileSync(join(dist, f), 'utf8')).join('\n');
const local = text.match(/\/home\/user|\/tmp\/claude|localhost:\d+|file:\/\/\//g);
ok('no local machine paths in the build', !local, local ? [...new Set(local)].join(', ') : '');
const ext = [...new Set([...text.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]))];
console.log(`info  external hosts mentioned in code (not loaded unless used): ${ext.join(', ') || 'none'}`);
ok('no runtime CDN script/style tags', !/<(script|link)[^>]+(src|href)="https?:/.test(html));

/* --- runtime --- */
if (base) {
  const { chromium, devices } = createRequire(import.meta.url)('playwright');
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [label, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['mobile', devices['iPhone 13']]]) {
    const page = await browser.newPage(opts);
    const bad = []; const errs = []; const loaded = new Set();
    page.on('requestfailed', (r) => bad.push(`${r.url()} (${r.failure()?.errorText})`));
    page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); else loaded.add(r.url()); });
    page.on('pageerror', (e) => errs.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    // pages secondaires : chargement complet + images
    for (const path of ['', 'a-propos/', 'offres/']) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500);
      const H0 = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H0; y += 700) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(250); }
      await page.waitForTimeout(800);
      const br = await page.evaluate(() => [...document.querySelectorAll('main img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
      ok(`[${label}] /${path}: no broken images`, br.length === 0, br.join(', '));
    }
    // page Projets : toutes les études de cas + scène 3D
    await page.goto(base + 'projets/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 600) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(350); }
    await page.evaluate(() => document.getElementById('object').scrollIntoView());
    await page.waitForFunction(() => document.querySelector('.object').classList.contains('is-ready'), null, { timeout: 60000 }).catch(() => {});
    const ready = await page.evaluate(() => document.querySelector('.object').classList.contains('is-ready'));
    ok(`[${label}] 3D object loaded`, ready);
    for (const slug of (projects || []).map((p) => p.slug)) {
      await page.evaluate((s) => { location.hash = `#/work/${s}`; }, slug);
      await page.waitForTimeout(2600);
      const open = await page.evaluate(() => document.querySelector('.project').classList.contains('is-open'));
      const title = await page.evaluate(() => document.querySelector('#project-title')?.getAttribute('aria-label') || document.querySelector('#project-title')?.textContent);
      ok(`[${label}] project ${slug} opens`, open, title || '');
      const sh = await page.evaluate(() => document.querySelector('.project__scroller').scrollHeight);
      for (let y = 0; y < sh; y += 700) { await page.evaluate((y) => { document.querySelector('.project__scroller').scrollTop = y; }, y); await page.waitForTimeout(250); }
      await page.waitForTimeout(800);
      const broken = await page.evaluate(() => [...document.querySelectorAll('.project img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src));
      ok(`[${label}] ${slug}: no broken images`, broken.length === 0, broken.join(', '));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1500);
    }
    const brokenMain = await page.evaluate(() => [...document.querySelectorAll('main img')].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    ok(`[${label}] /projets/: no broken images`, brokenMain.length === 0, brokenMain.join(', '));
    const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
    ok(`[${label}] fonts loaded (2 familles, aucune mono)`, ['Archivo Variable', 'Instrument Serif'].every((f) => fonts.some((x) => x.includes(f))) && !fonts.some((x) => /mono/i.test(x)), [...new Set(fonts)].join(', '));
    ok(`[${label}] three.js chunk loaded`, [...loaded].some((u) => /three\.module-.*\.js/.test(u)));
    ok(`[${label}] no failed requests`, bad.length === 0, bad.slice(0, 6).join(' | '));
    ok(`[${label}] no JS errors`, errs.length === 0, errs.slice(0, 4).join(' | '));
    await page.close();
  }
  await browser.close();
}
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);
