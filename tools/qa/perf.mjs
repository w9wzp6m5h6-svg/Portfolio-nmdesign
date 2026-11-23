/**
 * Rough performance snapshot of the production build (vite preview on :4173):
 * paint timings + transferred bytes before / after scrolling the whole page.
 * Note: headless Chromium renders WebGL on the CPU (SwiftShader), so frame
 * rates here say nothing about real GPUs — only loading numbers are meaningful.
 */
import { createRequire } from 'node:module';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:4173';

for (const [label, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['mobile', devices['iPhone 13']]]) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage(opts);
  let bytes = 0; const byType = {};
  page.on('response', async (r) => {
    try {
      const len = (await r.body()).length;
      bytes += len;
      const t = r.request().resourceType();
      byType[t] = (byType[t] || 0) + len;
    } catch { /* redirects */ }
  });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const paint = await page.evaluate(() => Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)])));
  const initial = bytes;
  const initialTypes = { ...byType };
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 700) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(500); }
  await page.waitForTimeout(3000);
  const kb = (n) => `${Math.round(n / 1024)} kB`;
  console.log(`\n[${label}] paint: ${JSON.stringify(paint)}`);
  console.log(`[${label}] initial transfer: ${kb(initial)}  ${Object.entries(initialTypes).map(([k, v]) => `${k}=${kb(v)}`).join(' ')}`);
  console.log(`[${label}] after full scroll: ${kb(bytes)}  ${Object.entries(byType).map(([k, v]) => `${k}=${kb(v)}`).join(' ')}`);
  await browser.close();
}
