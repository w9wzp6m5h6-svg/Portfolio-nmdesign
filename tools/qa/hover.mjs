/** Captures pointer interactions: hero flow distortion + project card hover. */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4500);
// sweep across the name
await page.mouse.move(200, 640);
for (let i = 0; i <= 24; i++) await page.mouse.move(200 + i * 40, 640 + Math.sin(i / 3) * 60, { steps: 2 });
await page.screenshot({ path: 'tools/qa/out/hover-hero.png' });
// card hover
await page.evaluate(() => document.getElementById('work').scrollIntoView());
await page.waitForTimeout(3000);
const box = await page.locator('.card__link[data-slug="stride"] .card__media').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
await page.waitForTimeout(1300);
await page.screenshot({ path: 'tools/qa/out/hover-card.png' });
await browser.close();
console.log('done');
