/**
 * Captures generated artwork (Afterimage stills, Oscillo identity) to PNG.
 *   node tools/capture/run.mjs <piece> <w> <h> <outName> [extra query]
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const [piece, w, h, name, extra = ''] = process.argv.slice(2);
const base = process.env.BASE || 'http://localhost:5173';
mkdirSync(new URL('../render/out/', import.meta.url), { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
await page.goto(`${base}/tools/capture/index.html?piece=${piece}&w=${w}&h=${h}&${extra}`);
await page.waitForFunction(() => window.__done || window.__error, null, { timeout: 600000 });
const err = await page.evaluate(() => window.__error);
if (err) { console.error(err); process.exit(1); }
await page.locator('canvas').screenshot({ path: new URL(`../render/out/${name}.png`, import.meta.url).pathname });
console.log('captured', name);
await browser.close();
