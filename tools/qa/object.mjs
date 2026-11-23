/**
 * QA for the 3D object section: framing, hotspot focus, colourway sweep, X-Ray.
 *   node tools/qa/object.mjs [desktop|mobile] [outDir]
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const which = process.argv[2] || 'desktop';
const out = process.argv[3] || 'tools/qa/out';
const BASE = process.env.BASE || 'http://localhost:5173';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const opts = which === 'mobile' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } };
const page = await browser.newPage(opts);
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await page.evaluate(() => document.getElementById('object').scrollIntoView());
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/obj-${which}-a.png` });

const spots = await page.$$('.hotspot:not(.is-behind)');
console.log('visible hotspots', spots.length);
if (spots.length) {
  await spots[0].click({ force: true });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/obj-${which}-b.png` });
}
await page.click('[data-variant="midnight"]');
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/obj-${which}-c.png` });
await page.waitForTimeout(1500);
await page.click('[data-mode="xray"]');
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/obj-${which}-d.png` });
console.log(errs.join('\n') || 'no errors');
await browser.close();
