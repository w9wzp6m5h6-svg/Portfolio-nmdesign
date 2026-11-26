/**
 * QA des sections Offres / Méthode / pied de page / demande de projet.
 *   node tools/qa/commerce.mjs [url] [outDir]
 * Captures (réduction des animations activée pour figer la mise en page),
 * débordements horizontaux, erreurs console, scénario complet du formulaire.
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';

const URL = process.argv[2] || 'http://localhost:5173/';
const OUT = process.argv[3] || 'tools/qa/out/commerce';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];
const ok = (name, cond, extra = '') => { results.push([cond ? 'PASS' : 'FAIL', name, extra]); };

for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => errors.push(`failed ${r.url()}`));
  await page.goto(URL + 'offres/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.body.classList.contains('is-loading'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(800);

  for (const id of ['offers', 'process', 'contact']) {
    await page.evaluate((i) => document.getElementById(i).scrollIntoView(), id);
    await page.waitForTimeout(500);
    const el = await page.$(`#${id}`);
    await el.screenshot({ path: `${OUT}/${vp.name}-${id}.png` });
  }
  await page.evaluate(() => document.querySelector('.footer').scrollIntoView());
  await page.waitForTimeout(300);
  await (await page.$('.footer')).screenshot({ path: `${OUT}/${vp.name}-footer.png` });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`${vp.name}: pas de défilement horizontal`, overflow <= 0, `${overflow}px`);

  // liens du pied de page
  const links = await page.$$eval('.footer a', (as) => as.map((a) => ({ href: a.getAttribute('href'), target: a.target, rel: a.rel, text: a.textContent.trim() })));
  ok(`${vp.name}: aucun lien vide`, links.every((l) => l.href && l.href !== '#'), JSON.stringify(links.filter((l) => !l.href || l.href === '#')));
  const mail = links.find((l) => l.href.startsWith('mailto:'));
  ok(`${vp.name}: mailto pied de page`, mail && mail.href === 'mailto:nm.officestudiodesign@gmail.com?subject=Demande%20de%20projet%20%E2%80%94%20Noah%20Milsztajn', mail?.href);
  const insta = links.find((l) => l.href.includes('instagram'));
  ok(`${vp.name}: Instagram pied de page`, insta && insta.href === 'https://www.instagram.com/noah.mlzn_/' && insta.target === '_blank' && insta.rel.includes('noopener'), JSON.stringify(insta));
  for (const l of links.filter((x) => x.href.startsWith('#'))) {
    const exists = await page.evaluate((h) => !!document.querySelector(h), l.href);
    ok(`${vp.name}: ancre ${l.href} existe`, exists);
  }

  // pied de page → ancre Contact de la page courante
  await page.click('.footer a[href="#contact"]');
  await page.waitForTimeout(1500);
  const cTop = await page.evaluate(() => document.getElementById('contact').getBoundingClientRect().top);
  ok(`${vp.name}: lien pied de page « Contact » fait défiler`, Math.abs(cTop) < 4, `top=${cTop}`);
  await page.evaluate(() => document.getElementById('offers').scrollIntoView());
  await page.waitForTimeout(400);

  // demande de projet depuis une formule
  await page.click('.plan [data-open-brief="Signature"]');
  await page.waitForTimeout(500);
  ok(`${vp.name}: formulaire ouvert`, await page.evaluate(() => document.getElementById('brief').open));
  ok(`${vp.name}: formule présélectionnée`, (await page.inputValue('#f-type')) === 'Signature');
  await page.screenshot({ path: `${OUT}/${vp.name}-brief.png` });
  // envoi vide → erreurs
  await page.click('#brief [type="submit"]');
  const err = await page.textContent('.brief__error');
  ok(`${vp.name}: validation des champs obligatoires`, /nom/.test(err) && /e-mail/.test(err), err);
  ok(`${vp.name}: focus sur le premier champ invalide`, await page.evaluate(() => document.activeElement.id === 'f-name'));
  // remplissage
  await page.fill('#f-name', 'Test QA');
  await page.fill('#f-email', 'pas-un-email');
  await page.fill('#f-activity', 'Galerie');
  await page.fill('#f-desc', 'Un site pour présenter les expositions.\nAvec un agenda.');
  await page.click('#brief [type="submit"]');
  ok(`${vp.name}: e-mail invalide refusé`, /e-mail/.test(await page.textContent('.brief__error')));
  await page.fill('#f-email', 'test@example.com');
  await page.fill('#f-link', '@galerie');
  // intercepte l'ouverture mailto
  await page.evaluate(() => {
    window.__mail = null;
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.href.startsWith('mailto:')) { window.__mail = this.href; return; } return orig.call(this); };
  });
  // anti-robot : un envoi en moins de 3 s après l'ouverture est retenu (message honnête, rien n'est préparé)
  const tooFast = await page.evaluate(() => {
    const dlg = document.getElementById('brief');
    dlg.close();
    document.querySelector('.plan [data-open-brief="Signature"]').click();
    document.querySelector('#brief [type="submit"]').click();
    return { mail: window.__mail, msg: document.querySelector('.brief__error').textContent, visible: !document.querySelector('.brief__error').hidden };
  });
  ok(`${vp.name}: envoi trop rapide retenu (anti-robot)`, !tooFast.mail && tooFast.visible && /Un instant/.test(tooFast.msg), tooFast.msg);
  await page.waitForTimeout(3100); // un humain met plus de 3 s à remplir le formulaire
  await page.click('#brief [type="submit"]');
  await page.waitForTimeout(300);
  const href = await page.evaluate(() => window.__mail);
  const dec = href ? decodeURIComponent(href) : '';
  ok(`${vp.name}: mailto du formulaire construit`, href && href.startsWith('mailto:nm.officestudiodesign@gmail.com?subject=') && dec.includes('Nom : Test QA') && dec.includes('Type de projet : Signature') && dec.includes('Avec un agenda.'), dec.slice(0, 160));
  ok(`${vp.name}: écran honnête après ouverture messagerie`, /messagerie/.test(await page.textContent('.brief__done')));
  await page.screenshot({ path: `${OUT}/${vp.name}-brief-done.png` });
  // Échap ferme
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  ok(`${vp.name}: Échap ferme le formulaire`, await page.evaluate(() => !document.getElementById('brief').open));
  ok(`${vp.name}: défilement de page rétabli`, await page.evaluate(() => document.documentElement.style.overflow === ''));

  // mentions légales
  await page.evaluate(() => document.querySelector('.footer').scrollIntoView());
  await page.click('.footer [data-open-legal="legal"]');
  await page.waitForTimeout(400);
  ok(`${vp.name}: mentions légales ouvertes`, await page.evaluate(() => document.getElementById('legal').open));
  await page.screenshot({ path: `${OUT}/${vp.name}-legal.png` });
  await page.click('#legal [data-close]');
  await page.waitForTimeout(300);
  await page.click('.footer [data-open-legal="privacy"]');
  await page.waitForTimeout(400);
  const t = await page.textContent('#legal-title');
  ok(`${vp.name}: confidentialité ouverte`, t === 'Confidentialité', t);
  await page.screenshot({ path: `${OUT}/${vp.name}-privacy.png` });
  await page.click('#legal [data-close]');

  // lien direct #demarrer
  await page.goto(URL + '#demarrer', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.getElementById('brief').open, null, { timeout: 30000 }).catch(() => {});
  ok(`${vp.name}: lien direct #demarrer`, await page.evaluate(() => document.getElementById('brief').open));

  ok(`${vp.name}: aucune erreur console`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}
await browser.close();
for (const r of results) console.log(r[0], '-', r[1], r[2] ? `(${r[2]})` : '');
console.log(results.filter((r) => r[0] === 'FAIL').length ? 'ÉCHECS' : 'TOUT PASSE');
