/**
 * Captures des sites des concepts (ÉLAN, PORTANT) pour les études de cas.
 *   npx vite --port 5174 &
 *   node tools/capture/concepts.mjs [http://localhost:5174]
 * Sortie : public/media/works/screens/ui_<concept>_d|m-*.webp, public/media/works/portant/portant_rack-*.webp
 */
import { createRequire } from 'node:module';
import sharp from 'sharp';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const BASE = process.argv[2] || 'http://localhost:5174';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function save(buf, path, widths) {
  for (const w of widths) await sharp(buf).resize({ width: w }).webp({ quality: 84, effort: 6 }).toFile(`${path}-${w}.webp`);
  console.log('✓', path);
}
async function shoot(url, ctxOpts, prep) {
  const ctx = await browser.newContext({ ...ctxOpts, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  if (prep) await prep(page);
  const buf = await page.screenshot();
  await ctx.close();
  return buf;
}
const desk = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const mob = { ...devices['iPhone 13'], viewport: { width: 390, height: 845 } };
const hideBar = (page) => page.addStyleTag({ content: '.concept-bar{display:none!important}' });

// ÉLAN : la canette s'arrête de face pour la capture
const elanPrep = async (page) => { await hideBar(page); await page.evaluate(() => { document.querySelector('[data-can-tool="front"]')?.click(); window.scrollTo(0, 0); }); await page.waitForTimeout(1600); };
await save(await shoot(`${BASE}/concepts/elan/`, desk, elanPrep), 'public/media/works/screens/ui_elan_d', [800, 1400]);
await save(await shoot(`${BASE}/concepts/elan/`, mob, elanPrep), 'public/media/works/screens/ui_elan_m', [800]);

// PORTANT
const ptPrep = async (page) => { await hideBar(page); await page.waitForTimeout(800); };
await save(await shoot(`${BASE}/concepts/portant/`, desk, ptPrep), 'public/media/works/screens/ui_portant_d', [800, 1400]);
await save(await shoot(`${BASE}/concepts/portant/`, mob, ptPrep), 'public/media/works/screens/ui_portant_m', [800]);

// PORTANT : le portant seul, comme une photo de showroom (16:10)
const rackShot = await shoot(`${BASE}/concepts/portant/`, { viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.4 }, async (page) => {
  await page.addStyleTag({ content: `
    .concept-bar,.pt-nav,.pt-hero__head,.pt-rack__ui,.pt-rack__hint,.pt-rack__caption{display:none!important}
    .pt-hero{padding:150px 0 0!important}.pt-rack{--pt-w:330px!important;--rail-top:64px!important}
    .pt-rack__stage{height:1000px!important}` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  // une poussée de la tringle, puis on laisse les cintres se poser sur la troisième pièce
  await page.keyboard.press('Tab');
  await page.evaluate(() => document.querySelector('.pt-item__hit[data-i="2"]').focus());
  await page.keyboard.press('Enter');
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(2600);
});
await save(rackShot, 'public/media/works/portant/portant_rack', [800, 1400, 2200]);
await browser.close();
