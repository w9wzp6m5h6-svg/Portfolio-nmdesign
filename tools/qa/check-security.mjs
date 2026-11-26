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
  const text = read(f);
  PATTERNS.forEach(([re, label]) => { if (re.test(text)) leaks.push(`${f} : ${label}`); });
}
ok('aucun secret dans les fichiers publiés', leaks.length === 0, leaks.join(' ; '));

// 3. Chaque page a sa CSP, sans 'unsafe-inline' ni 'unsafe-eval', sans style="" ni script inline exécutable
for (const f of files.filter((x) => x.endsWith('.html'))) {
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
