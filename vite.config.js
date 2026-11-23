import { defineConfig, loadEnv } from 'vite';
import { site } from './src/data/site.js';

/**
 * SEO au build. Définir l'adresse publique du site pour obtenir canonical,
 * og:url, URL absolues des images de partage et sitemap.xml :
 *   SITE_URL=https://www.mon-domaine.fr npm run build   (ou dans .env)
 * Sans SITE_URL, seul robots.txt est généré (sans ligne Sitemap).
 */
function seo(siteUrl) {
  const base = siteUrl ? siteUrl.replace(/\/+$/, '') + '/' : '';
  return {
    name: 'nm-seo',
    apply: 'build',
    transformIndexHtml: { order: 'post', handler(html) {
      if (!base) return html.replace(/\s*<!-- %SEO_URL%[^>]*-->/, '');
      const abs = (p) => base + p.replace(/^\/+/, '');
      return html
        .replace(/<!-- %SEO_URL%[^>]*-->/, `<link rel="canonical" href="${base}" />\n  <meta property="og:url" content="${base}" />`)
        .replace(/content="\.?\/media\/og\.jpg"/, `content="${abs('media/og.jpg')}"`)
        .replace('"image": "/media/og.jpg"', `"image": "${abs('media/og.jpg')}", "url": "${base}"`)
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
        this.emitFile({
          type: 'asset', fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
        });
      } else {
        this.warn('SITE_URL non défini : pas de sitemap.xml ni de balise canonical (voir README > Mise en ligne).');
      }
      const L = site.legal || {};
      if (!L.status || !L.siret || !L.host?.name) {
        this.warn('Mentions légales incomplètes (statut, SIRET, hébergeur) : compléter site.legal dans src/data/site.js avant publication.');
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = process.env.SITE_URL || env.SITE_URL || '';
  return {
    // relative base: the build runs from a domain root, a sub-folder or the local demo server
    base: './',
    plugins: [seo(siteUrl)],
    build: {
      target: 'es2020',
      // three.js (~140 kB gzip) is its own lazily-loaded chunk: it is only fetched
      // after first paint, for the hero name, the 3D object and the live pieces.
      chunkSizeWarningLimit: 600,
      assetsInlineLimit: 0,
    },
    server: { host: true },
  };
});
