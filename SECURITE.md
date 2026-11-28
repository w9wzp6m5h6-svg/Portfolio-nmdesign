# Sécurité — NM Design

Ce document décrit ce qui protège le site, ce qui reste à activer **de ton côté** (comptes, hébergeur, domaine) et quoi faire en cas de problème. Dernière revue complète : novembre 2026.

## 1. Le site en une phrase

Site **statique** : 4 pages HTML, du JavaScript, des images et le site livré à la galerie L'Empreinte (un fichier HTML autonome). Il n'a ni serveur à lui, ni base de données, ni compte utilisateur, ni paiement, ni envoi de fichiers. Les attaques qui visent ces éléments (injection SQL, SSRF, injection de commande, vol de session, brute force d'un admin, upload piégé, CSRF) n'ont donc rien à viser. La seule donnée saisie par un visiteur est la demande de projet. Par défaut, elle prépare un e‑mail dans la messagerie du visiteur ; si `VITE_FORM_ENDPOINT` est défini, elle est envoyée à Formspree ou Web3Forms.

## 2. Ce qui est en place

| Protection | Où | Effet |
| --- | --- | --- |
| **Content‑Security‑Policy** stricte sur chaque page | générée au build (`vite.config.js`, plugin `nm-security`) | Le navigateur n'exécute que les scripts du site : pas de script injecté, pas d'`eval`, pas de style injecté, aucune connexion vers un domaine tiers (sauf le service de formulaire configuré). |
| En-têtes HTTP de sécurité | `vercel.json` → `dist/_headers` (Netlify, Cloudflare Pages) et `dist/.htaccess` (Apache) | HTTPS forcé (HSTS), anti‑iframe (clickjacking : le site ne peut être affiché dans une iframe que par lui‑même, `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`), `nosniff`, Referrer‑Policy, caméra / micro / géolocalisation / paiement coupés. |
| Échappement de toutes les données insérées en HTML | `src/core/escape.js`, `src/core/css.js` | Une donnée ne peut pas devenir du code. |
| Formulaire | `src/sections/commerce.js` | Champ piège anti‑robot, délai minimal de 3 s, longueurs maximales, validation, un seul envoi à la fois, 60 s entre deux envois, adresse d'envoi en HTTPS obligatoire (le build échoue sinon). Aucune fausse confirmation. |
| Aucun tiers | — | Pas de script, police, traceur ni cookie externe. Polices et bibliothèques auto‑hébergées. Seule exception, à la demande du visiteur : voir « Site de L'Empreinte » ci‑dessous. |
| Site de L'Empreinte (aperçu en direct) | `public/lempreinte/index.html`, `src/ui/live-site.js` | Chargé seulement au clic, dans une iframe `sandbox` **sans** `allow-same-origin` : origine opaque, aucun accès au portfolio (DOM, stockage, cookies), aucune navigation de la page parente. Vérifié par `check:security`. |
| Serveur de démo local | `demo/serve.mjs` | N'écoute que sur ton ordinateur (127.0.0.1), ne sert que le dossier du site (ni `../`, ni lien symbolique, ni fichier caché), erreurs génériques, mêmes en-têtes que la production. |
| Serveur de développement | `vite.config.js` | `npm run dev` n'est accessible que depuis ton ordinateur. Pour tester sur ton téléphone : `npm run dev -- --host`, uniquement sur un réseau de confiance. |
| Secrets | `.gitignore` | Tous les fichiers `.env*` sont ignorés par Git, sauf `.env.example`. |
| Signalement de faille | `/.well-known/security.txt` (généré au build) | Indique où écrire pour signaler une faille. |
| Vérifications automatiques | `.github/workflows/securite.yml` | À chaque pull request et push sur `main` : audit des dépendances, build, contrôle du dossier publié (`npm run check:security`). |
| Mises à jour | `.github/dependabot.yml` | Propositions de mises à jour hebdomadaires (npm) et mensuelles (actions GitHub), à relire avant fusion. |

**Exceptions de la CSP, et pourquoi :**
- `'wasm-unsafe-eval'` : le modèle 3D est compressé (meshopt) et décodé par du WebAssembly. Cette exception autorise la compilation WebAssembly, **pas** l'exécution de JavaScript arbitraire (`eval` reste bloqué).
- Une empreinte `sha256` : le seul bloc `<style>` du site, dans `<noscript>`, pour les visiteurs sans JavaScript.
- `blob:` (images, connexions) : three.js extrait les textures du fichier `.glb` sous forme de `blob:` locaux.

**Site de L'Empreinte — pourquoi il a ses propres règles :** c'est le fichier livré à la galerie, publié **tel quel** à `/lempreinte/` (le modifier changerait l'œuvre). Il contient ses propres scripts et styles en ligne et charge ses deux polices depuis Google Fonts : la CSP stricte du portfolio ne lui est donc pas appliquée (les en-têtes HTTP communs, eux, s'appliquent). Les garanties sont ailleurs : il ne contient ni formulaire, ni traceur, ni appel à un service ; il n'est jamais exécuté dans le contexte du portfolio (iframe isolée, voir tableau) et il n'est chargé que si le visiteur clique sur « Explorer le site en direct ». À ce moment‑là seulement, le navigateur du visiteur contacte Google Fonts ; la politique de confidentialité du site le mentionne.

### Vérifier soi-même

```bash
npm run build && npm run check:security   # contrôle du dossier publié
npm audit --omit=dev                      # dépendances envoyées aux visiteurs
```

Une fois le site en ligne, colle son adresse sur https://securityheaders.com et https://developer.mozilla.org/en-US/observatory : les en-têtes listés ci‑dessus doivent apparaître.

## 3. À faire de ton côté, pas à pas

Je n'ai accès à aucun de ces comptes et je n'y ai rien modifié. Ordre conseillé :

### 3.1 Gmail `nm.officestudiodesign@gmail.com` (le plus important)
C'est là qu'arrivent les demandes de tes clients. Celui qui contrôle cette boîte peut se faire passer pour toi.
1. https://myaccount.google.com → **Sécurité** → **Validation en deux étapes** → activer. Ajoute une **clé d'accès** (passkey) depuis ton iPhone.
2. Dans le même menu, lance le **Check-up Sécurité**.
3. Dans Gmail → **Paramètres** → **Transfert et POP/IMAP** et **Filtres** : vérifie qu'aucun transfert automatique inconnu n'existe. C'est la première chose qu'un pirate met en place.

### 3.2 GitHub
1. **Double authentification** : https://github.com/settings/security → *Two-factor authentication* (passkey ou application d'authentification).
2. **Protéger `main`** : dépôt → *Settings* → *Rules* → *Rulesets* → *New branch ruleset*.
   - Cible : `main`.
   - Coche **Restrict deletions** et **Block force pushes**.
   - Une fois le workflow « Sécurité et build » passé au moins une fois, coche aussi **Require status checks to pass** et choisis `verifier`.
3. **Dependabot** : *Settings* → *Code security* → active **Dependabot alerts** et **Dependabot security updates**. La détection de secrets et le blocage des pushes qui en contiennent sont déjà actifs.
4. **Adresse e-mail privée** : https://github.com/settings/emails → coche **Keep my email addresses private** et **Block command line pushes that expose my email**. Deux anciens commits portent une adresse Apple « Masquer mon e‑mail » ; c'est sans gravité, mais les suivants ne l'exposeront plus.
5. **Public ou privé ?** Le dépôt est **public** : tout le code est lisible. Il ne contient aucun secret, donc ce n'est pas une faille. Si tu ne t'en sers pas comme vitrine, passe‑le en privé (*Settings* → *General* → *Danger Zone* → *Change visibility*). Vercel, Netlify et Cloudflare Pages déploient aussi les dépôts privés.

### 3.3 Hébergeur — Vercel (recommandé)
Rien de ce qui suit n'est actif tant que tu ne l'as pas réglé, **sauf la protection DDoS**, automatique sur toutes les offres.
1. Compte Vercel : active la **double authentification** dans les réglages du compte (*Account Settings*).
2. *Add New* → *Project* → importe le dépôt. Vite est détecté tout seul (build `npm run build`, dossier `dist`). Les en-têtes de `vercel.json` s'appliquent automatiquement.
3. **Déploiements de prévisualisation** : *Settings* → *Deployment Protection* → **Vercel Authentication** (« Standard Protection »). Les versions de test ne sont alors visibles que par toi ; le site public reste ouvert.
4. **Pare-feu (Firewall)** :
   - DDoS (couches 3, 4 et 7) : automatique, rien à faire.
   - **Attack Mode** : à n'activer **que pendant une attaque** (tous les visiteurs passent alors un contrôle anti‑robot).
   - **Règles personnalisées** : l'offre gratuite en permet 3 par projet, dont 1 de limitation de débit. Pour un site statique, une seule règle utile au départ : **Deny** sur les chemins que les robots testent (`/wp-admin`, `/wp-login.php`, `/xmlrpc.php`, `/.env`, `/.git`). Ces chemins renvoient déjà une erreur 404 ; la règle réduit seulement le bruit.
   - Ne mets une limitation de débit que si un abus apparaît. Une page charge environ 40 fichiers : une limite trop basse bloquerait de vrais visiteurs.
   - Protection anti-robots gérée (*Bot Protection*, *BotID*) : vérifie ce que ton offre inclut sur https://vercel.com/pricing.
5. Après la mise en ligne, vérifie les en-têtes (section 2, « Vérifier soi‑même »).

**Autres hébergeurs :**
- **Netlify, Cloudflare Pages** : `_headers` est appliqué tout seul.
- **OVH, o2switch (Apache)** : `.htaccess` est appliqué tout seul. Si le site affiche une erreur 500 après dépôt, l'hébergeur refuse une directive : supprime `.htaccess`, préviens‑moi, et active « Forcer HTTPS » dans son panneau.
- **Envoi en FTP** : les fichiers `.htaccess` et le dossier `.well-known` sont cachés sur Mac (Cmd + Maj + . pour les afficher) ; envoie‑les aussi.
- **GitHub Pages** : n'accepte aucun en-tête personnalisé. Seule la CSP de la page s'appliquerait, sans HSTS ni anti‑iframe : à éviter.

### 3.4 Domaine (registrar : OVH, Gandi, Infomaniak…)
1. Double authentification sur le compte.
2. **Verrou de transfert** (« transfer lock » / « protection contre le transfert ») activé.
3. **Renouvellement automatique** activé : un domaine expiré peut être racheté par quelqu'un d'autre.
4. **DNSSEC** si le registrar le propose.
5. Plus tard, une fois tout le domaine en HTTPS depuis quelques semaines : tu pourras ajouter `; preload` à HSTS dans `vercel.json` et inscrire le domaine sur https://hstspreload.org. C'est difficile à annuler, donc pas maintenant.

### 3.5 Service de formulaire (si tu actives l'envoi direct)
1. Double authentification sur le compte Formspree ou Web3Forms.
2. Active leurs options anti‑spam et, si elles existent, la restriction aux domaines autorisés (ton domaine uniquement).
3. La clé Web3Forms (`VITE_FORM_ACCESS_KEY`) est **publique par nature** : elle finit dans le site. Ce n'est pas un secret, mais ne mets **jamais** une clé privée dans une variable `VITE_*` : tout ce qui commence par `VITE_` est publié.
4. Mets la même adresse dans `.env` (local) et dans *Vercel → Settings → Environment Variables*, puis redéploie.

## 4. Risques connus et acceptés

| Risque | Pourquoi il est accepté |
| --- | --- |
| 4 alertes « modérées » `npm audit` : `glob` / `minimatch` via `@gltf-transform/cli` | Outil local servant seulement à préparer le modèle 3D, sur tes propres fichiers. Il n'est pas publié. Aucune correction n'existe sans revenir à une version majeure plus ancienne. À revoir quand l'outil sera mis à jour (Dependabot le signalera). |
| `'wasm-unsafe-eval'` dans la CSP | Nécessaire au décodeur du modèle 3D ; n'autorise pas `eval`. |
| Dépôt public | Aucun secret dedans (vérifié dans tout l'historique). C'est ton choix, voir 3.2. |
| Anti-spam limité côté navigateur | Un vrai plafond d'envois ne peut exister que chez le service d'envoi (3.5). En mode e‑mail par défaut, rien n'est envoyé sans l'action du visiteur dans sa propre messagerie. |
| `sharp` 0.35 exige Node.js ≥ 20.9 | Pour les outils d'images uniquement. Vérifie avec `node -v` sur ton Mac avant de les relancer. |

## 5. Sauvegarde et restauration

- **Code** : sur GitHub (branche `main` et branche de travail). Copie hors ligne : `NMDESIGN-PORTFOLIO-FINAL.zip`, régénéré par `tools/package.sh`. Garde aussi une copie sur un disque ou un cloud à toi.
- **Version stable** : après chaque mise en ligne validée, crée un tag, par exemple `v2.1` (GitHub → *Releases* → *Draft a new release*). On peut toujours revenir exactement à cette version.
- **Revenir en arrière sur Vercel** : *Deployments* → choisis le dernier déploiement qui fonctionnait → menu **⋯** → *Instant Rollback* (ou *Promote to Production*). Le retour est immédiat, sans rebuild. Ne supprime jamais un ancien déploiement stable.
- **Données** : le site n'en stocke aucune. Les demandes de projet sont dans ta boîte Gmail (ou chez le service de formulaire).

## 6. En cas d'incident

**Le site est modifié ou affiche autre chose que prévu :**
1. Vercel → *Instant Rollback* vers le dernier déploiement sain (section 5).
2. Change les mots de passe GitHub et Vercel, puis déconnecte les autres sessions (GitHub : *Settings* → *Sessions* ; Vercel : dans les réglages du compte).
3. GitHub → *Settings* → *Security log* : repère les actions que tu n'as pas faites. Regarde aussi les derniers commits de `main`.
4. Révoque les jetons et applications que tu ne reconnais pas : GitHub → *Settings* → *Applications* et *Developer settings* → *Personal access tokens* ; Vercel → *Tokens*.

**Une clé ou un mot de passe a fuité (par ex. commité par erreur) :**
1. **Révoque‑la et crée‑en une nouvelle immédiatement** dans le service concerné. La supprimer du code ne suffit pas : elle reste dans l'historique et dans les copies.
2. Mets la nouvelle valeur dans `.env` et dans les variables d'environnement de Vercel, rebuild, redéploie.
3. Si c'était un mot de passe, change‑le partout où tu l'utilisais.

**Gmail compromis :** https://myaccount.google.com/security-checkup → déconnecte tous les appareils, change le mot de passe, supprime les transferts et filtres inconnus (3.1). Préviens les clients en cours qu'ils ont pu recevoir de faux messages.

**Attaque par déni de service (site très lent, trafic anormal) :** Vercel → *Firewall* → **Attack Mode** le temps de l'attaque, puis désactive‑le.

**Signalement d'une faille par quelqu'un** (via `security.txt`) : remercie, demande les détails, corrige, puis préviens la personne.

## 7. Entretien

- **Chaque mois** : relis et fusionne les pull requests de Dependabot après le passage au vert du workflow.
- **Après chaque modification** : `npm run build && npm run check:security`.
- **Chaque année** : rebuild et redéploiement, ne serait‑ce que pour renouveler la date d'expiration de `security.txt`.
