/**
 * QA for navigation & interactions: menu (mobile), nav links, keyboard,
 * reduced-motion mode, horizontal overflow at several widths.
 *   node tools/qa/interactions.mjs
 */
import { createRequire } from 'node:module';
const { chromium, devices } = createRequire(import.meta.url)('playwright');
const BASE = process.env.BASE || 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const check = (label, cond) => console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
const errs = [];
const watch = (page) => {
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
};

/* --- mobile menu --- */
{
  const page = await browser.newPage(devices['iPhone 13']);
  watch(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.click('.header__menu');
  await page.waitForTimeout(1300);
  check('menu opens', await page.evaluate(() => document.getElementById('menu').classList.contains('is-open')));
  check('menu toggle aria-expanded=true', (await page.getAttribute('.header__menu', 'aria-expanded')) === 'true');
  check('page scroll locked', await page.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden'));
  await page.screenshot({ path: 'tools/qa/out/menu-mobile.png' });
  await page.click('.menu__nav a[href="#about"]');
  await page.waitForTimeout(2500);
  check('menu closes on link', !(await page.evaluate(() => document.getElementById('menu').classList.contains('is-open'))));
  const aboutTop = await page.evaluate(() => document.getElementById('about').getBoundingClientRect().top);
  check(`menu link scrolls to About (top=${Math.round(aboutTop)})`, Math.abs(aboutTop) < 80);
  await page.click('.header__menu');
  await page.waitForTimeout(1600); // let the opening animation finish, as a person would
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2500); // the close animation (~1.1 s) runs slower in headless WebGL
  check('Esc closes menu', !(await page.evaluate(() => document.getElementById('menu').classList.contains('is-open'))));
  check('scroll unlocked after close', await page.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'));
  await page.close();
}

/* --- desktop nav + keyboard --- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  watch(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  for (const id of ['work', 'about', 'contact', 'top']) {
    await page.click(`.header__nav a[data-nav="${id}"]`);
    await page.waitForTimeout(id === 'about' ? 9000 : 4000); // headless WebGL boots the 3D stage on the CPU when the scroll passes it
    const top = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, id);
    check(`nav → #${id} (top=${Math.round(top)})`, Math.abs(top) < 80);
  }
  await page.click('.header__brand');
  await page.waitForTimeout(2200);
  check('brand returns to top', (await page.evaluate(() => scrollY)) < 40);
  // keyboard: Tab from a fresh page reaches the skip link first
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.keyboard.press('Tab');
  check('first Tab = skip link', await page.evaluate(() => document.activeElement?.classList.contains('skip-link')));
  // object keyboard control
  await page.evaluate(() => document.getElementById('object').scrollIntoView());
  await page.waitForTimeout(5000);
  await page.focus('.object__gl');
  const before = await page.evaluate(() => window.__stage?.goal.theta);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.__stage?.goal.theta);
  if (typeof before === 'number') check('arrow key rotates the shoe', after !== before);
  else console.log('SKIP  arrow key check needs the dev server (production build is covered by tools/qa/gestures.mjs)');
  await page.close();
}

/* --- reduced motion --- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  check('reduced motion: loader gone quickly', !(await page.evaluate(() => !!document.querySelector('.loader'))));
  check('reduced motion: name visible as text', await page.evaluate(() => getComputedStyle(document.querySelector('.hero__word')).color !== 'rgba(0, 0, 0, 0)'));
  check('reduced motion: no smooth-scroll class', !(await page.evaluate(() => document.documentElement.classList.contains('lenis'))));
  await page.screenshot({ path: 'tools/qa/out/reduced.png' });
  await ctx.close();
}

/* --- horizontal overflow at many widths --- */
for (const w of [320, 360, 390, 414, 600, 768, 834, 1024, 1180, 1280, 1440, 1920, 2560]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  const res = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1) && getComputedStyle(el).position !== 'fixed' && !el.closest('.hero__gl, .contact__mark, .project, .card__parallax, .object__stage, .loader')) offenders.push(`${el.tagName}.${[...el.classList].join('.')} → ${Math.round(r.right)}`);
    });
    return { scrollW: document.documentElement.scrollWidth, vw, offenders: offenders.slice(0, 5) };
  });
  check(`no horizontal scroll at ${w}px (scrollWidth ${res.scrollW})`, res.scrollW <= res.vw);
  if (res.offenders.length) console.log('      overflowing:', res.offenders.join(' | '));
  await page.close();
}

console.log(errs.length ? errs.join('\n') : 'no console errors');
await browser.close();
