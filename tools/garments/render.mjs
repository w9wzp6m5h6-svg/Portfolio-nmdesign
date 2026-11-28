/**
 * Rend les vêtements de PORTANT (SVG paramétriques) en WebP transparents.
 *   node tools/garments/render.mjs
 * Sortie : public/media/works/portant/garments/<pièce>-<largeur>.webp
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { GARMENTS } from './garments.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const OUT = 'public/media/works/portant/garments';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
for (const [name, make] of Object.entries(GARMENTS)) {
  const svg = make().replace('width="600" height="1000"', 'width="1200" height="2000"');
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
  const buf = await page.locator('svg').screenshot({ omitBackground: true });
  for (const w of [480, 900]) {
    await sharp(buf).resize({ width: w }).webp({ quality: 84, alphaQuality: 88, effort: 6 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
  console.log('✓', name);
}
await browser.close();
