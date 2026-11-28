/**
 * Intègre le site de L'Empreinte — Art Gallery (Cynthia Rimo) dans le portfolio,
 * à partir de son fichier HTML source, SANS le modifier.
 *
 *   node tools/integrate-gallery.mjs "chemin/vers/Cynthia Rimo — L'Empreinte Art Gallery, Valbonne(1).html"
 *
 * 1. ouvre le fichier dans Chromium (lecture seule) ;
 * 2. capture l'expérience : ordinateur (1440 × 900) en haut de page et à plusieurs
 *    hauteurs de défilement, puis téléphone (390 × 844) ;
 * 3. convertit les captures en WebP 800 / 1400 / 2200 px, sans métadonnées, dans
 *    public/media/works/rimo/ (rimo_d1, rimo_d2…, rimo_m1…) ;
 * 4. écrit tools/render/out/gallery-report.json : titre, description, titres de
 *    sections, liens (WhatsApp, réseaux, URL en ligne éventuelle), nombre d'images.
 *    Ce rapport sert à rédiger l'étude de cas à partir de ce que le site contient
 *    réellement — rien n'est inventé.
 * Ensuite : renseigner `card` et le bloc `captures` du projet « cynthia-rimo »
 * dans src/data/projects.js (voir README), puis npm run build.
 */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const input = process.argv[2];
if (!input || !existsSync(input)) {
  console.error('Usage : node tools/integrate-gallery.mjs "chemin/vers/fichier.html"');
  process.exit(1);
}
const OUT_PNG = resolve('tools/render/out');
const OUT_WEBP = resolve('public/media/works/rimo');
mkdirSync(OUT_PNG, { recursive: true });
mkdirSync(OUT_WEBP, { recursive: true });

const url = pathToFileURL(resolve(input)).href;
const browser = await chromium.launch();
const shots = [];

async function capture(viewport, prefix, stops) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.waitForLoadState('load'));
  await page.waitForTimeout(2500); // animations d'arrivée du site
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (const [i, ratio] of stops.entries()) {
    const y = Math.round(Math.max(0, height - viewport.height) * ratio);
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    await page.waitForTimeout(1200);
    const file = join(OUT_PNG, `${prefix}${i + 1}.png`);
    await page.screenshot({ path: file });
    shots.push({ name: `${prefix}${i + 1}`, file });
  }
  return page;
}

const desk = await capture({ width: 1440, height: 900 }, 'rimo_d', [0, 0.2, 0.45, 0.7]);
const report = await desk.evaluate(() => ({
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content || '',
  headings: [...document.querySelectorAll('h1, h2, h3')].map((h) => `${h.tagName} ${h.textContent.trim().replace(/\s+/g, ' ')}`).filter((t) => t.length > 3).slice(0, 60),
  links: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => /^https?:|^mailto:|^tel:|wa\.me|whatsapp/.test(h)))].slice(0, 80),
  images: document.images.length,
  canonical: document.querySelector('link[rel="canonical"]')?.href || '',
  ogUrl: document.querySelector('meta[property="og:url"]')?.content || '',
}));
await capture({ width: 390, height: 844 }, 'rimo_m', [0, 0.35]);
await browser.close();

for (const s of shots) {
  for (const w of s.name.startsWith('rimo_m') ? [800] : [800, 1400, 2200]) {
    await sharp(s.file).resize({ width: w }).webp({ quality: 82, effort: 6 }).toFile(join(OUT_WEBP, `${s.name}-${w}.webp`));
  }
  console.log('ok', s.name);
}
writeFileSync(join(OUT_PNG, 'gallery-report.json'), JSON.stringify(report, null, 2));
console.log(`\nRapport : tools/render/out/gallery-report.json\nCaptures : public/media/works/rimo/ (${shots.length} vues)`);
console.log(report.canonical || report.ogUrl ? `URL déclarée dans le fichier : ${report.canonical || report.ogUrl} (à vérifier avant de la publier)` : 'Aucune URL en ligne déclarée dans le fichier : ne pas inventer de lien.');
