/**
 * Vérifie qu’aucune information n’a été modifiée entre deux versions du site.
 * usage : node compare.cjs <original.html> <remaster.html>
 * Compare (avec et sans JavaScript) : texte visible, liens, images (octets),
 * aria-label, sections et éléments générés (salle 3D, filtres, sélection…).
 * Requiert Playwright (Chromium).
 */
const { chromium } = require('playwright');
const path = require('path');
const [A, B] = process.argv.slice(2).map(f => 'file://' + path.resolve(f));
if (!A || !B) { console.error('usage: node compare.cjs <original.html> <remaster.html>'); process.exit(2); }

const grab = () => {
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll('script,style').forEach(n => n.remove());
  clone.querySelectorAll('br').forEach(n => n.replaceWith(' '));
  const src = i => i.getAttribute('src') || i.getAttribute('data-src') || '';
  return {
    text: norm(clone.textContent),
    links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
    images: [...document.querySelectorAll('img')].map(i => (i.getAttribute('alt') || '') + '|' + src(i).length + ':' + src(i).slice(-48)),
    aria: [...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')),
    sections: [...document.querySelectorAll('section,dialog,nav,header,footer,aside')].map(e => e.tagName + '#' + e.id),
    generated: ['#gr .th', '#scene .toile', '.chip', '.hb', '#sw button'].map(s => s + '=' + document.querySelectorAll(s).length),
    head: [...document.head.querySelectorAll('meta,title,link[rel=icon]')].map(m => m.outerHTML),
  };
};

(async () => {
  const browser = await chromium.launch();
  let ok = true;
  for (const js of [false, true]) {
    const res = [];
    for (const u of [A, B]) {
      const ctx = await browser.newContext({ javaScriptEnabled: js, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(u, { waitUntil: 'load' });
      await page.waitForTimeout(js ? 2500 : 200);
      res.push(await page.evaluate(grab));
      await ctx.close();
    }
    console.log(`\nJavaScript ${js ? 'activé' : 'désactivé'}`);
    for (const k of Object.keys(res[0])) {
      const same = JSON.stringify(res[0][k]) === JSON.stringify(res[1][k]);
      ok = ok && same;
      const n = Array.isArray(res[0][k]) ? res[0][k].length : res[0][k].length + ' car.';
      console.log(`  ${k.padEnd(10)} ${same ? 'identique' : 'DIFFÉRENT'} (${n})`);
    }
  }
  await browser.close();
  console.log(ok ? '\nAucune information modifiée.' : '\nDes différences existent : voir ci-dessus.');
  process.exit(ok ? 0 : 1);
})();
