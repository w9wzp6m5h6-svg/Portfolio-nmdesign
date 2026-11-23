/**
 * QA screenshots + console error capture.
 *   node tools/qa/shoot.mjs [viewport=desktop|tablet|mobile] [outDir]
 * Needs the dev or preview server (BASE env, default http://localhost:5173).
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const which = process.argv[2] || 'desktop';
const out = process.argv[3] || 'tools/qa/out';
const BASE = process.env.BASE || 'http://localhost:5173';
mkdirSync(out, { recursive: true });

const vps = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  wide: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  laptop: { viewport: { width: 1280, height: 760 }, deviceScaleFactor: 1 },
  tablet: { ...devices['iPad (gen 7)'] },
  mobile: { ...devices['iPhone 13'] },
  android: { ...devices['Pixel 7'] },
};

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext(vps[which]);
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => errors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4200);
await page.screenshot({ path: `${out}/${which}-0-hero.png` });

const H = await page.evaluate(() => document.documentElement.scrollHeight);
const vh = vps[which].viewport.height;
const stops = process.env.STOPS ? +process.env.STOPS : Math.ceil(H / vh);
for (let i = 1; i < stops; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * vh);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/${which}-${i}.png` });
}
console.log('height', H, 'stops', stops);
console.log(errors.length ? errors.join('\n') : 'no console errors');
await browser.close();
