/**
 * QA for case studies: open from card, scroll, next, close (button / Esc / back).
 *   node tools/qa/projects.mjs [desktop|mobile] [outDir]
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
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
const check = (label, cond) => console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);

await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000);

// open first project from its card
await page.evaluate(() => document.getElementById('work').scrollIntoView());
await page.waitForTimeout(2500);
await page.click('.scene__link[data-project="stride"]');
await page.waitForTimeout(2600);
check('hash is #/work/stride', (await page.evaluate(() => location.hash)) === '#/work/stride');
check('overlay open', await page.evaluate(() => document.querySelector('.project').classList.contains('is-open')));
check('page behind is inert', await page.evaluate(() => document.querySelector('main').inert === true));
check('focus on close button', await page.evaluate(() => document.activeElement?.classList.contains('project__close')));
await page.screenshot({ path: `${out}/p-${which}-stride-hero.png` });

// scroll inside the overlay
const scrollShots = async (slug, n = 4) => {
  for (let i = 1; i <= n; i++) {
    await page.evaluate((i) => { const s = document.querySelector('.project__scroller'); s.scrollTop = i * s.clientHeight * 1.0; }, i);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${out}/p-${which}-${slug}-${i}.png` });
  }
};
await scrollShots('stride', 6);

// walk through every project with "next"
for (const slug of ['vanta', 'opale', 'rooms', 'afterimage', 'oscillo']) {
  await page.evaluate(() => { const s = document.querySelector('.project__scroller'); s.scrollTop = s.scrollHeight; });
  await page.waitForTimeout(900);
  await page.click('.p-next__link');
  await page.waitForTimeout(2400);
  check(`next → ${slug}`, (await page.evaluate(() => location.hash)) === `#/work/${slug}`);
  await page.screenshot({ path: `${out}/p-${which}-${slug}-hero.png` });
  await scrollShots(slug, slug === 'afterimage' || slug === 'oscillo' ? 3 : 4);
}

// close with Escape
await page.keyboard.press('Escape');
await page.waitForTimeout(1600);
check('Esc closes overlay', !(await page.evaluate(() => document.querySelector('.project').classList.contains('is-open'))));
check('page interactive again', await page.evaluate(() => document.querySelector('main').inert === false));

// browser back closes
await page.click('.scene__link[data-project="opale"]');
await page.waitForTimeout(2400);
await page.goBack();
await page.waitForTimeout(1800);
check('Back button closes overlay', !(await page.evaluate(() => document.querySelector('.project').classList.contains('is-open'))));

// deep link
await page.goto(BASE + '/#/work/vanta', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
check('deep link opens project', await page.evaluate(() => document.querySelector('.project').classList.contains('is-open') && document.querySelector('#project-title')?.textContent.includes('Vanta')));
await page.click('.project__close');
await page.waitForTimeout(1800);
check('close button closes deep-linked project', !(await page.evaluate(() => document.querySelector('.project').classList.contains('is-open'))));
check('URL cleaned after close', !(await page.evaluate(() => location.hash.startsWith('#/work'))));

console.log(errs.length ? errs.join('\n') : 'no console errors');
await browser.close();
