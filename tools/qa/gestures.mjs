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

// skip intro
await page.goto(BASE + '/');
await page.waitForTimeout(500);
const t0 = Date.now();
await page.click('.loader__skip', { force: true }).catch(() => {});
await page.waitForFunction(() => !document.querySelector('.loader'), null, { timeout: 8000 }).catch(() => {});
ok('skip intro removes the loader quickly', !(await page.evaluate(() => !!document.querySelector('.loader'))), `${Date.now() - t0} ms`);

// 3D gestures
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

// repeat visit: shortened intro
const p2 = await ctx.newPage();
await p2.goto(BASE + '/');
const t1 = Date.now();
await p2.waitForFunction(() => !document.querySelector('.loader'), null, { timeout: 15000 });
ok('repeat visit: shorter intro', Date.now() - t1 < 4000, `${Date.now() - t1} ms`);
ok('no JS errors', errs.length === 0, errs.join(' | '));
await browser.close();
