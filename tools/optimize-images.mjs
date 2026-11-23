/**
 * Converts rendered PNGs into responsive WebP sets.
 *   node tools/optimize-images.mjs
 * Reads tools/render/out/*.png using the MAP below, writes
 * public/media/works/<project>/<name>-<width>.webp
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';

const SRC = 'tools/render/out';
const OUT = 'public/media/works';
const WIDTHS = [800, 1400, 2200];

const MAP = {
  stride: ['shoe_cover', 'shoe_profile', 'shoe_detail', 'shoe_beach', 'shoe_midnight'],
  opale: ['glasses_cover', 'glasses_front', 'glasses_top'],
  vanta: ['car_cover', 'car_side', 'car_front', 'car_top', 'car_wheel'],
  rooms: ['interior_cover', 'interior_chair', 'interior_pouf'],
  afterimage: ['art_cover', 'art_a', 'art_b', 'art_c'],
  oscillo: ['osc_cover', 'osc_posters', 'osc_system'],
  screens: ['ui_stride_d', 'ui_stride_m', 'ui_opale_d', 'ui_opale_m', 'ui_vanta_d', 'ui_vanta_m', 'ui_rooms_d', 'ui_rooms_m', 'ui_oscillo_d', 'ui_oscillo_m'],
};

for (const [project, names] of Object.entries(MAP)) {
  mkdirSync(`${OUT}/${project}`, { recursive: true });
  for (const name of names) {
    const file = `${SRC}/${name}.png`;
    if (!existsSync(file)) { console.warn('missing', file); continue; }
    const img = sharp(file);
    const { width } = await img.metadata();
    for (const w of WIDTHS) {
      if (w > width && w !== WIDTHS[0]) continue;
      await sharp(file).resize({ width: Math.min(w, width) }).webp({ quality: 80, effort: 6 })
        .toFile(`${OUT}/${project}/${name}-${w}.webp`);
    }
    console.log('ok', project, name);
  }
}
