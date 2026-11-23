/** Ad-hoc probe: evaluates a JS snippet in the page after load. node tools/qa/probe.mjs "<js>" [waitMs] */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [code, wait = 4000] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +(process.env.VW || 1440), height: 900 } });
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto((process.env.BASE || 'http://localhost:5173') + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(+wait);
console.log(JSON.stringify(await page.evaluate(`(async () => { ${code} })()`), null, 1));
await browser.close();
