import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { site } from './src/data/site.js';

const ROOT = process.cwd();

/** Pages du site : chemin du fichier HTML → URL publique (relative à la racine). */
const PAGES = {
  home: { file: 'index.html', url: '' },
  projects: { file: 'projets/index.html', url: 'projets/' },
  about: { file: 'a-propos/index.html', url: 'a-propos/' },
  offers: { file: 'offres/index.html', url: 'offres/' },
};

/**
 * Gabarits partagés et liens entre pages.
 *  <!-- include:nom -->  → contenu de src/partials/nom.html (récursif)
 *  {{root}}              → chemin relatif vers la racine du site ('./' ou '../')
 *  {{href:page}}         → lien relatif vers une page (« projets/ », ou « projets/index.html »
 *                          quand ARTIFACT=1 : l'hébergeur d'artefacts ne sert pas les index de dossier)
 */
function pages({ explicitIndex }) {
  const include = (html, depth = 0) => html.replace(/<!-- include:([\w-]+) -->/g, (_, name) => {
    if (depth > 5) throw new Error(`include trop profond : ${name}`);
    return include(readFileSync(resolve(ROOT, 'src/partials', `${name}.html`), 'utf8'), depth + 1);
  });
  return {
    name: 'nm-pages',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const file = relative(ROOT, ctx.filename).split('\\').join('/');
        const dir = dirname(file);
        const root = dir === '.' ? './' : '../'.repeat(dir.split('/').length);
        return include(html)
          .replaceAll('{{root}}', root)
          .replace(/\{\{href:(\w+)\}\}/g, (_, key) => {
            const page = PAGES[key];
            if (!page) throw new Error(`page inconnue : ${key}`);
            const target = page.url + (explicitIndex ? 'index.html' : '');
            return (root + target) || './';
          });
      },
    },
  };
}

/**
 * SEO au build. Définir l'adresse publique du site pour obtenir canonical,
 * og:url, URL absolues des images de partage et sitemap.xml :
 *   SITE_URL=https://www.mon-domaine.fr npm run build   (ou dans .env)
 */
function seo(siteUrl) {
  const base = siteUrl ? siteUrl.replace(/\/+$/, '') + '/' : '';
  const urlOf = (filename) => {
    const file = relative(ROOT, filename).split('\\').join('/');
    const page = Object.values(PAGES).find((p) => p.file === file);
    return base + (page ? page.url : '');
  };
  return {
    name: 'nm-seo',
    apply: 'build',
    transformIndexHtml: { order: 'post', handler(html, ctx) {
      if (!base) return html.replace(/\s*<!-- %SEO_URL%[^>]*-->/, '');
      const url = urlOf(ctx.filename);
      const abs = (p) => base + p.replace(/^\/+/, '');
      return html
        .replace(/<!-- %SEO_URL%[^>]*-->/, `<link rel="canonical" href="${url}" />\n  <meta property="og:url" content="${url}" />`)
        .replace(/content="(?:\.\.\/|\.\/)*\/?media\/og\.jpg"/, `content="${abs('media/og.jpg')}"`)
        .replace(/"image": "[^"]*og\.jpg"/, `"image": "${abs('media/og.jpg')}", "url": "${base}"`)
        .replace('"@id": "#noah",', `"@id": "${base}#noah", "url": "${base}",`)
        .replace('"@id": "#studio",', `"@id": "${base}#studio",`)
        .replace('"founder": { "@id": "#noah" }', `"founder": { "@id": "${base}#noah" }`);
    } },
    generateBundle() {
      this.emitFile({
        type: 'asset', fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n${base ? `\nSitemap: ${base}sitemap.xml\n` : ''}`,
      });
      if (base) {
        const today = new Date().toISOString().slice(0, 10);
        const urls = Object.values(PAGES).map((p) => `  <url><loc>${base}${p.url}</loc><lastmod>${today}</lastmod></url>`).join('\n');
        this.emitFile({
          type: 'asset', fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        });
      } else {
        this.warn('SITE_URL non défini : pas de sitemap.xml ni de balise canonical (voir MISE-EN-LIGNE.md).');
      }
      const L = site.legal || {};
      if (!L.status || !L.siret || !L.host?.name) {
        this.warn('Mentions légales incomplètes (statut, SIRET, hébergeur) : compléter site.legal dans src/data/site.js avant publication.');
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ROOT, '');
  const siteUrl = process.env.SITE_URL || env.SITE_URL || '';
  const explicitIndex = (process.env.ARTIFACT || env.ARTIFACT) === '1';
  return {
    // chemins relatifs : le build fonctionne à la racine d'un domaine, dans un sous-dossier ou en démo locale
    base: './',
    plugins: [pages({ explicitIndex }), seo(siteUrl)],
    build: {
      target: 'es2020',
      // three.js (~140 kB gzip) est un chunk chargé à la demande
      chunkSizeWarningLimit: 600,
      assetsInlineLimit: 0,
      rollupOptions: {
        input: Object.fromEntries(Object.entries(PAGES).map(([k, p]) => [k, resolve(ROOT, p.file)])),
      },
    },
    server: { host: true },
  };
});
