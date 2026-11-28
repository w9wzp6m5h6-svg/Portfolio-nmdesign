# NM Design — portfolio de Noah Milsztajn

## Présenter le portfolio en 10 secondes

1. Dézippe l'archive.
2. Double‑clique sur le lanceur de ton système, dans le dossier `demo/` :
   - **Mac :** `Lancer le portfolio (Mac).command`
     (la première fois : clic droit → *Ouvrir* → *Ouvrir*, car macOS bloque les scripts téléchargés)
   - **Windows :** `Lancer le portfolio (Windows).bat`
3. Le navigateur s'ouvre sur **http://127.0.0.1:4173/** (accessible depuis ton ordinateur uniquement, pas depuis le réseau). Pour arrêter : ferme la fenêtre du terminal.

Le lanceur a besoin de **Node.js** (https://nodejs.org, version LTS) ou de **Python 3** (déjà présent sur la plupart des Mac).

> N'ouvre pas `dist/index.html` en double‑clic : tous les navigateurs bloquent alors les modules JavaScript et la 3D. Le lanceur évite ce problème.

En ligne de commande, depuis ce dossier :

```bash
node demo/serve.mjs                               # ou :
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

## Contenu

| Dossier | Rôle |
| --- | --- |
| `dist/` | Le site de production, complet et autonome (HTML, JS, CSS, polices, images, modèles 3D). C'est ce dossier qu'on met en ligne. |
| `demo/` | Serveur local sans dépendance + lanceurs Mac / Windows. |
| `source/` | Le code source complet du projet, pour le modifier plus tard (`npm install`, puis `npm run dev` / `npm run build`). Voir `source/README.md`. |
| `CREDITS.md` | Licences des modèles 3D, polices et bibliothèques. |

## Le site de L'Empreinte

Le site livré à la galerie (Cynthia Rimo, L'Empreinte Art Gallery, Valbonne) est inclus tel quel dans `dist/lempreinte/`. Dans le portfolio, le bouton « Explorer le site en direct » l'ouvre dans une fenêtre isolée, sans quitter la page. Il pèse environ 6,5 Mo et n'est chargé qu'à ce moment‑là.

## Les concepts ÉLAN et PORTANT

Deux sites de marques fictives sont inclus : `dist/concepts/elan/` (canette en 3D temps réel) et `dist/concepts/portant/` (boutique où l'on parcourt un portant). Ils sont reliés à leurs études de cas et portent un bandeau « Concept fictif ».

## Mettre en ligne

Dépose le **contenu** de `dist/` sur n'importe quel hébergeur statique (Vercel, Netlify, Cloudflare Pages, OVH, o2switch…). Il fonctionne à la racine d'un domaine comme dans un sous‑dossier. Les en-têtes de sécurité sont inclus (`_headers`, `.htaccess`) : en FTP, pense à envoyer aussi les fichiers cachés (`.htaccess`, `.well-known/`).

**Sécurité :** lis `SECURITE.md` (dans `source/`) : double authentification Gmail / GitHub / hébergeur, réglages Vercel, que faire en cas de problème.

**Avant de publier**, suis `MISE-EN-LIGNE.md` : mentions légales à compléter, adresse du site pour le sitemap, envoi du formulaire, Google Search Console.

## À compléter

- **Mentions légales** (statut, SIRET, hébergeur) : `source/src/data/site.js`, puis `npm run build`.
- **Modèle 3D Air Jordan 1 Travis Scott (Mocha) :** à intégrer quand tu m'enverras le fichier `.glb` — marche à suivre dans `source/README.md`.
