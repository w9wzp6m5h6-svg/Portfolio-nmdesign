# Noah Milsztajn — Portfolio (version finale)

## Présenter le portfolio en 10 secondes

1. Dézippe l'archive.
2. Double‑clique sur le lanceur de ton système, dans le dossier `demo/` :
   - **Mac :** `Lancer le portfolio (Mac).command`
     (la première fois : clic droit → *Ouvrir* → *Ouvrir*, car macOS bloque les scripts téléchargés)
   - **Windows :** `Lancer le portfolio (Windows).bat`
3. Le navigateur s'ouvre sur **http://localhost:4173/**. Pour arrêter : ferme la fenêtre du terminal.

Le lanceur a besoin de **Node.js** (https://nodejs.org, version LTS) ou de **Python 3** (déjà présent sur la plupart des Mac).

> N'ouvre pas `dist/index.html` en double‑clic : tous les navigateurs bloquent alors les modules JavaScript et la 3D. Le lanceur évite ce problème.

En ligne de commande, depuis ce dossier :

```bash
node demo/serve.mjs                               # ou :
python3 -m http.server 4173 --directory dist
```

## Contenu

| Dossier | Rôle |
| --- | --- |
| `dist/` | Le site de production, complet et autonome (HTML, JS, CSS, polices, images, modèles 3D). C'est ce dossier qu'on met en ligne. |
| `demo/` | Serveur local sans dépendance + lanceurs Mac / Windows. |
| `source/` | Le code source complet du projet, pour le modifier plus tard (`npm install`, puis `npm run dev` / `npm run build`). Voir `source/README.md`. |
| `CREDITS.md` | Licences des modèles 3D, polices et bibliothèques. |

## Mettre en ligne

Dépose le **contenu** de `dist/` sur n'importe quel hébergeur statique (Netlify Drop, Vercel, GitHub Pages, OVH, o2switch…). Il fonctionne à la racine d'un domaine comme dans un sous‑dossier. Aucun serveur spécial n'est nécessaire.

## À compléter

- **E‑mail et réseaux :** `source/src/data/site.js`, puis `npm run build`.
- **Captures du site Cynthia Rimo** et statut de ses fonctionnalités : marche à suivre dans `source/README.md`.
- **Modèle 3D Air Jordan 1 Travis Scott (Mocha / Reverse Mocha) :** à intégrer quand tu auras un fichier `.glb` sous licence — marche à suivre dans `source/README.md`.
