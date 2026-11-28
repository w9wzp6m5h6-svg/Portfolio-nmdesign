/**
 * Gesture checks on any build (no dev-only hooks): pixel differences on the 3D canvas
 * after drag / keyboard / zoom, skip-intro button, shortened intro on repeat visit.
 *   BASE=http://localhost:4173 node tools/qa/gestures.mjs
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:4173';
const ok = (l, c, x = '') => console.log(`${c ? 'PASS' : 'FAIL'}  ${l}${x ? ' — ' + x : ''}`);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

// arrivée : aucun écran bloquant, le titre et les actions sont là tout de suite
await page.goto(BASE + '/');
await page.waitForTimeout(1300);
ok('no blocking intro: hero title and actions visible within 1.3 s', await page.evaluate(() => {
  const t = document.querySelector('.hero__title').getBoundingClientRect();
  const a = document.querySelector('.hero__actions .btn');
  return !document.querySelector('.intro') && t.height > 0 && getComputedStyle(a).visibility === 'visible' && +getComputedStyle(a.closest('[data-hero-fade]')).opacity > 0.9;
}));

// 3D gestures (le lab est sur la page Projets)
await page.goto(BASE + '/projets/');
await page.evaluate(() => document.getElementById('object').scrollIntoView());
await page.waitForFunction(() => document.querySelector('.object').classList.contains('is-ready'), null, { timeout: 60000 });
await page.waitForTimeout(1500);
const canvas = page.locator('.object__gl');
const shot = async () => (await canvas.screenshot()).toString('base64');
const diff = (a, b) => a !== b;
const box = await canvas.boundingBox();
let before = await shot();
await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
await page.mouse.down();
await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.45, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(1500);
let after = await shot();
ok('mouse drag rotates the shoe', diff(before, after));
before = after;
await canvas.focus();
for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
await page.waitForTimeout(1500);
after = await shot();
ok('arrow keys rotate the shoe', diff(before, after));
before = after;
await page.click('[data-zoom="1"]');
await page.waitForTimeout(1500);
after = await shot();
ok('zoom button zooms', diff(before, after));
await page.click('[data-reset]');
await page.waitForTimeout(1000);
const enabled = await page.evaluate(() => [...document.querySelectorAll('.object__controls button')].every((b) => !b.disabled));
ok('all 3D controls enabled after load', enabled);

ok('no JS errors', errs.length === 0, errs.join(' | '));
await browser.close();
