/** Screenshots a section from its top, N viewports.  node tools/qa/section.mjs <id> [desktop|mobile] [n] */
import { createRequire } from 'node:module';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [id, which = 'desktop', n = 3] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage(which === 'mobile' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
const top = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top + scrollY, id);
const vh = await page.evaluate(() => innerHeight);
for (let i = 0; i < +n; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), top + i * vh * 0.9);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `tools/qa/out/sec-${id}-${which}-${i}.png` });
}
await browser.close();
