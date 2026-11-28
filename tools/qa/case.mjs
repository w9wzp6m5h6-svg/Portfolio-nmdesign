/** Captures one case study top to bottom.  node tools/qa/case.mjs <slug> [desktop|mobile] */
import { createRequire } from 'node:module';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [slug, which = 'desktop'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage(which === 'mobile' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
await page.evaluate(() => document.getElementById('work').scrollIntoView());
await page.waitForTimeout(2500);
await page.click(`.scene__link[data-project="${slug}"]`);
await page.waitForTimeout(3000);
const sh = await page.evaluate(() => document.querySelector('.project__scroller').scrollHeight);
const vh = await page.evaluate(() => innerHeight);
let i = 0;
for (let y = 0; y < sh && i < 10; y += vh, i++) {
  await page.evaluate((y) => { document.querySelector('.project__scroller').scrollTop = y; }, y);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `tools/qa/out/case-${slug}-${which}-${i}.png` });
}
console.log(slug, which, 'frames', i, errs.length ? errs.join(' | ') : 'no errors');
await browser.close();
