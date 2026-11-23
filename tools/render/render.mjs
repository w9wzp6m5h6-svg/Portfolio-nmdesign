/**
 * Usage: node tools/render/render.mjs <scene> [w] [h]   (needs `npx vite` running on :5173)
 * Writes tools/render/out/<scene>.png
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';
const [scene, w = 1600, h = 1000, extra = ""] = process.argv.slice(2);
const base = process.env.RIG_URL || 'http://localhost:5173';
mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
await page.goto(`${base}/tools/render/index.html?scene=${scene}&w=${w}&h=${h}${extra ? "&" + extra : ""}`);
await page.waitForFunction(() => window.__done || window.__error, null, { timeout: 600000 });
const err = await page.evaluate(() => window.__error);
if (err) { console.error(err); process.exit(1); }
await page.locator('canvas').screenshot({ path: new URL(`./out/${scene}.png`, import.meta.url).pathname });
console.log('rendered', scene);
await browser.close();
