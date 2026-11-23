/** Captures the social preview image (public/media/og.jpg) from the live hero. */
import { createRequire } from 'node:module';
import sharp from 'sharp';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:4173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4500);
const png = await page.screenshot();
await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile('public/media/og.jpg');
console.log('og.jpg written');
await browser.close();
