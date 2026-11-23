/**
 * Captures the concept UI screens (desktop 1440×900 @1.5x, mobile 390×844 @2x).
 *   node tools/mockups/run.mjs stride opale vanta rooms oscillo
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const base = process.env.BASE || 'http://localhost:5173';
const names = process.argv.slice(2);
const browser = await chromium.launch();
for (const n of names) {
  for (const [suffix, vp, dsf] of [['d', { width: 1440, height: 900 }, 1.5], ['m', { width: 390, height: 844 }, 2]]) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: dsf });
    page.on('pageerror', (e) => console.error('[pageerror]', n, e.message));
    await page.goto(`${base}/tools/mockups/${n}.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: new URL(`../render/out/ui_${n}_${suffix}.png`, import.meta.url).pathname });
    await page.close();
    console.log('captured', n, suffix);
  }
}
await browser.close();
