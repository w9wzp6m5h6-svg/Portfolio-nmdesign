/**
 * Contrôle de sécurité du dossier publié — sans navigateur, utilisé par la CI.
 *   node tools/qa/check-security.mjs [distDir=dist]      (ou : npm run check:security)
 * Échoue (code 1) si un fichier sensible ou un secret part en ligne, si une page
 * perd sa Content-Security-Policy, ou si les fichiers d'en-têtes manquent.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const dist = process.argv[2] || 'dist';
let failures = 0;
const ok = (name, cond, detail = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures += 1;
};
if (!existsSync(dist)) { console.error(`Dossier introuvable : ${dist} (lancer npm run build)`); process.exit(1); }

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(dist).map((f) => relative(dist, f).split('\\').join('/'));
const read = (f) => readFileSync(join(dist, f), 'utf8');

// 1. Aucun fichier sensible publié
const forbidden = files.filter((f) => /(^|\/)\.env|\.map$|(^|\/)\.git(\/|$)|\.(pem|key|p12|pfx)$|source-photos|(^|\/)node_modules\//.test(f));
ok('aucun fichier sensible publié (.env, source maps, .git, clés, photos sources)', forbidden.length === 0, forbidden.join(', '));

// 2. Aucun secret dans les fichiers texte publiés
const PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clé privée'],
  [/\bsk_(live|test)_[0-9A-Za-z]{10,}/, 'clé secrète Stripe'],
  [/\bgh[pousr]_[0-9A-Za-z]{30,}/, 'token GitHub'],
  [/\bgithub_pat_[0-9A-Za-z_]{20,}/, 'token GitHub'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'clé AWS'],
  [/\bxox[abposr]-[0-9A-Za-z-]{10,}/, 'token Slack'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, 'clé Google'],
  [/privaterelay\.appleid\.com/, 'adresse e-mail privée Apple'],
];
const TEXT = new Set(['.html', '.js', '.css', '.txt', '.json', '.xml', '.svg', '.webmanifest']);
const leaks = [];
for (const f of files.filter((x) => TEXT.has(extname(x)) || x.endsWith('_headers') || x.endsWith('.htaccess'))) {
  // les images intégrées (data:…;base64) peuvent contenir par hasard une suite qui ressemble à une clé
  const text = read(f).replace(/data:[a-z/+.-]+;base64,[A-Za-z0-9+/=]+/g, '');
  PATTERNS.forEach(([re, label]) => { if (re.test(text)) leaks.push(`${f} : ${label}`); });
}
ok('aucun secret dans les fichiers publiés', leaks.length === 0, leaks.join(' ; '));

// 3. Chaque page a sa CSP, sans 'unsafe-inline' ni 'unsafe-eval', sans style="" ni script inline exécutable
// Navigateurs intégrés (Instagram, Facebook, TikTok… sur iOS) : ils ouvrent le lien dans une fenêtre qu'ils
// gardent liée à la leur. Cross-Origin-Opener-Policy: same-origin coupe ce lien : l'appli voit la page
// « fermée », affiche une erreur de chargement et transmet « invalid.invalid » à Safari. À ne pas remettre.
{
  const served = [readFileSync('vercel.json', 'utf8'), files.includes('_headers') ? read('_headers') : '', files.includes('.htaccess') ? read('.htaccess') : ''].join('\n');
  const coop = served.match(/Cross-Origin-Opener-Policy["\s:,]+(?:"value":\s*)?"?([a-z-]+)/i)?.[1];
  ok('pas de Cross-Origin-Opener-Policy bloquant pour les navigateurs intégrés (Instagram iOS)', !coop || coop === 'unsafe-none', coop);
}

// Site de L'Empreinte : œuvre livrée telle quelle (fichier d'origine non modifié). Il n'est jamais
// exécuté dans le contexte du portfolio : l'aperçu le charge dans une iframe isolée (sandbox sans
// allow-same-origin), à la demande. On vérifie ces garanties plutôt que la CSP du portfolio.
const DEMO = 'lempreinte/index.html';
if (files.includes(DEMO)) {
  const js = files.filter((x) => x.startsWith('assets/') && x.endsWith('.js')).map(read).join('\n');
  // la liste sandbox peut être une constante séparée après minification : on cherche la chaîne
  const sandbox = js.match(/["'`](allow-scripts[^"'`]*)["'`]/)?.[1] || '';
  ok('démo L\'Empreinte chargée dans une iframe isolée (allow-scripts, sans allow-same-origin)',
    sandbox && /\bsandbox\b/.test(js) && !js.includes('allow-same-origin'), sandbox || 'iframe non trouvée');
}
for (const f of files.filter((x) => x.endsWith('.html') && x !== DEMO)) {
  const html = read(f);
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
  ok(`${f} : CSP présente et stricte`, /default-src 'self'/.test(csp) && /script-src 'self'/.test(csp) && !csp.includes("'unsafe-inline'") && !csp.includes("'unsafe-eval'") && !/\s\*(\s|;|$)/.test(csp), csp ? '' : 'absente');
  const cspIndex = html.indexOf('http-equiv="Content-Security-Policy"');
  const firstResource = html.search(/<(script|link)\b/);
  ok(`${f} : CSP déclarée avant toute ressource`, cspIndex > 0 && (firstResource === -1 || cspIndex < firstResource));
  ok(`${f} : aucun attribut style=""`, !/\sstyle="/.test(html));
  const inlineScripts = [...html.matchAll(/<script\b([^>]*)>/g)].filter(([, attrs]) => !/\bsrc=/.test(attrs) && !/type="application\/ld\+json"/.test(attrs));
  ok(`${f} : aucun script inline exécutable`, inlineScripts.length === 0);
  const blank = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].filter(([tag]) => !/rel="[^"]*noopener/.test(tag));
  ok(`${f} : liens externes en noopener`, blank.length === 0);
}

// 4. En-têtes HTTP prêts pour l'hébergeur
const REQUIRED = ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy'];
// cadrage : uniquement par le site lui-même (aperçu de L'Empreinte), jamais par un autre site
ok('vercel.json : cadrage limité au site lui-même', /frame-ancestors 'self'/.test(readFileSync('vercel.json', 'utf8')) && /SAMEORIGIN/.test(readFileSync('vercel.json', 'utf8')));
for (const f of ['_headers', '.htaccess']) {
  const text = existsSync(join(dist, f)) ? read(f) : '';
  const missing = REQUIRED.filter((h) => !text.includes(h));
  ok(`${f} : en-têtes de sécurité présents`, text && missing.length === 0, text ? missing.join(', ') : 'fichier absent');
}

// 5. security.txt (RFC 9116) valide
const sec = existsSync(join(dist, '.well-known/security.txt')) ? read('.well-known/security.txt') : '';
const expires = Date.parse(sec.match(/^Expires: (.+)$/m)?.[1] || '');
ok('.well-known/security.txt valide (Contact, Expires dans le futur)', /^Contact: mailto:/m.test(sec) && expires > Date.now());

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTous les contrôles de sécurité passent');
process.exit(failures ? 1 : 0);
