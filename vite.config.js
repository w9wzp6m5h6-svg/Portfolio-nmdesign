import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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

/**
 * Sécurité au build (voir SECURITE.md).
 *  - Content-Security-Policy en <meta> sur chaque page : scripts et styles du
 *    site uniquement (pas de 'unsafe-inline' ni de 'unsafe-eval'). Les seules
 *    exceptions sont justifiées et étroites :
 *      'wasm-unsafe-eval' → décodeur WebAssembly (meshopt) du modèle 3D ;
 *      'sha256-…'         → le seul bloc <style> du site, dans <noscript> ;
 *      blob:              → textures extraites du fichier .glb par three.js.
 *    L'adresse du service de formulaire, si elle est définie, est ajoutée à connect-src.
 *  - En-têtes HTTP : vercel.json est la source unique ; le build en dérive
 *    _headers (Netlify, Cloudflare Pages) et .htaccess (Apache : OVH, o2switch…).
 *  - /.well-known/security.txt : adresse pour signaler une faille (RFC 9116).
 *  - Désactivé pour la version d'aperçu (ARTIFACT=1), servie dans un cadre qui a sa propre politique.
 */
function formEndpointOrigin(endpoint) {
  if (!endpoint) return '';
  let url;
  try { url = new URL(endpoint); } catch { throw new Error(`VITE_FORM_ENDPOINT invalide : « ${endpoint} »`); }
  if (url.protocol !== 'https:') throw new Error('VITE_FORM_ENDPOINT doit commencer par https:// (les réponses du formulaire ne doivent jamais transiter en clair).');
  return url.origin;
}

function security({ enabled, endpoint, siteUrl }) {
  const origin = formEndpointOrigin(endpoint);
  const rules = JSON.parse(readFileSync(resolve(ROOT, 'vercel.json'), 'utf8')).headers || [];
  const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
  return {
    name: 'nm-security',
    apply: 'build',
    transformIndexHtml: { order: 'post', handler(html) {
      if (!enabled) return html;
      const styleHashes = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => sha256(m[1]));
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'wasm-unsafe-eval'",
        ["style-src 'self'", ...styleHashes].join(' '),
        "img-src 'self' blob:",
        "font-src 'self'",
        ['connect-src', "'self'", 'blob:', origin].filter(Boolean).join(' '),
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
      const charset = '<meta charset="utf-8" />';
      if (html.split(charset).length !== 2) throw new Error('nm-security : <meta charset> introuvable ou en double');
      return html.replace(charset, `${charset}\n  <meta http-equiv="Content-Security-Policy" content="${csp}" />`);
    } },
    generateBundle() {
      if (!enabled) return;
      const glob = (source) => source.replace('(.*)', '*');
      const netlify = rules.map((r) => `${glob(r.source)}\n${r.headers.map((h) => `  ${h.key}: ${h.value}`).join('\n')}`).join('\n\n');
      this.emitFile({ type: 'asset', fileName: '_headers', source: `# Généré au build à partir de vercel.json : modifier vercel.json, pas ce fichier.\n${netlify}\n` });
      const all = rules.find((r) => r.source === '/(.*)')?.headers || [];
      const assets = rules.find((r) => r.source === '/assets/(.*)')?.headers || [];
      const apache = [
        '# Généré au build à partir de vercel.json : modifier vercel.json, pas ce fichier.',
        '# Hébergement Apache (OVH, o2switch…). Si le site affiche une erreur 500 après dépôt,',
        "# l'hébergeur n'autorise pas ces directives : supprimer ce fichier et voir SECURITE.md.",
        '<IfModule mod_headers.c>',
        ...all.map((h) => `  Header always set ${h.key} "${h.value}"`),
        '  <If "%{REQUEST_URI} =~ m#/assets/#">',
        ...assets.map((h) => `    Header set ${h.key} "${h.value}"`),
        '  </If>',
        '</IfModule>',
      ].join('\n');
      this.emitFile({ type: 'asset', fileName: '.htaccess', source: `${apache}\n` });
      // RFC 9116 : où signaler une faille. Expires est recalculé à chaque build.
      const base = siteUrl ? siteUrl.replace(/\/+$/, '') + '/' : '';
      const expires = new Date(Date.now() + 360 * 24 * 3600 * 1000).toISOString();
      const securityTxt = [`Contact: mailto:${site.email}`, `Expires: ${expires}`, 'Preferred-Languages: fr, en', base && `Canonical: ${base}.well-known/security.txt`].filter(Boolean).join('\n');
      this.emitFile({ type: 'asset', fileName: '.well-known/security.txt', source: `${securityTxt}\n` });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ROOT, '');
  const siteUrl = process.env.SITE_URL || env.SITE_URL || '';
  const explicitIndex = (process.env.ARTIFACT || env.ARTIFACT) === '1';
  const endpoint = process.env.VITE_FORM_ENDPOINT || env.VITE_FORM_ENDPOINT || '';
  return {
    // chemins relatifs : le build fonctionne à la racine d'un domaine, dans un sous-dossier ou en démo locale
    base: './',
    plugins: [pages({ explicitIndex }), seo(siteUrl), security({ enabled: !explicitIndex, endpoint, siteUrl })],
    build: {
      target: 'es2020',
      // three.js (~140 kB gzip) est un chunk chargé à la demande
      chunkSizeWarningLimit: 600,
      assetsInlineLimit: 0,
      rollupOptions: {
        input: Object.fromEntries(Object.entries(PAGES).map(([k, p]) => [k, resolve(ROOT, p.file)])),
      },
    },
    // serveur de développement : cette machine uniquement. Pour tester sur téléphone : npm run dev -- --host
    server: { host: 'localhost' },
  };
});
