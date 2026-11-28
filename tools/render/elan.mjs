/**
 * Rendus fixes de la canette ÉLAN, produits par le même moteur que la scène 3D du site.
 *   npx vite --port 5174 &   (le banc passe par le serveur de développement)
 *   node tools/render/elan.mjs [http://localhost:5174]
 * Sortie : public/media/works/elan/*.webp (transparents pour les canettes seules).
 */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { VARIANTS } from '../../src/concepts/elan/data.js';

const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.argv[2] || 'http://localhost:5174';
const OUT = 'public/media/works/elan';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 2400, height: 2400 }, deviceScaleFactor: 1 });

async function still(params) {
  const q = new URLSearchParams(params).toString();
  await page.goto(`${BASE}/tools/render/elan.html?${q}`);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
  await page.waitForTimeout(200);
  return page.locator('#c').screenshot({ omitBackground: true });
}

async function save(buf, name, widths) {
  for (const w of widths) {
    await sharp(buf).resize({ width: w }).webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
  console.log('✓', name);
}

// une canette par saveur, de trois quarts
const cans = {};
for (const v of VARIANTS) {
  cans[v.id] = await still({ variant: v.id, w: 1400, h: 1750, yaw: 0.35 });
  await save(cans[v.id], `elan_can_${v.id}`, [800, 1400]);
}
// détails
await save(await still({ variant: 'sanguine', w: 1400, h: 1400, yaw: 0.5, pitch: 0.9, dist: 5.4, aim: 0.5 }), 'elan_detail_top', [800, 1400]);
await save(await still({ variant: 'sanguine', w: 1400, h: 1750, yaw: 2.05 }), 'elan_detail_back', [800, 1400]);

// la gamme alignée, sur crème (couverture du projet) : canettes recadrées, légèrement serrées
const W = 2200; const H = 1375;
const trimmed = [];
for (const v of VARIANTS) {
  const t = await sharp(cans[v.id]).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  trimmed.push(await sharp(t.data).resize({ height: 1060 }).toBuffer({ resolveWithObject: true }));
}
const step = Math.round(trimmed[0].info.width * 0.74);
const total = step * (trimmed.length - 1) + trimmed[0].info.width;
const comps = trimmed.map((t, i) => ({ input: t.data, left: Math.round((W - total) / 2 + i * step), top: Math.round((H - t.info.height) / 2 + 40) }));
const lineup = await sharp({ create: { width: W, height: H, channels: 4, background: '#efe9e2' } }).composite(comps).png().toBuffer();
await save(lineup, 'elan_lineup', [800, 1400, 2200]);

// face à face : la saveur cobalt sur le fond orange de la marque
const duoCan = await still({ variant: 'myrtille', w: 1100, h: 1375, yaw: -0.45, pitch: 0.12, dist: 7.3 });
const duo = await sharp({ create: { width: W, height: H, channels: 4, background: '#ff5a1f' } })
  .composite([{ input: duoCan, left: Math.round(W / 2 - 550), top: 0 }]).png().toBuffer();
await save(duo, 'elan_duo', [800, 1400, 2200]);

await browser.close();
