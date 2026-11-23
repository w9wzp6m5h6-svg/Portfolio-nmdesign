# Noah Milsztajn — Portfolio V2

Portfolio créatif dédié au web design, à l'UI/UX design et au développement d'expériences web immersives. Projets, expérimentations 3D, interfaces interactives et créations digitales.

**Stack :** Vite · JavaScript (ES modules) · Three.js · GSAP + ScrollTrigger · Lenis · polices auto‑hébergées (Fontsource).

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/ (site statique, déployable partout)
npm run preview   # sert dist/ sur http://localhost:4173
```

### Démonstration (sans rien installer d'autre que Node.js ou Python)

Le site de production est dans `dist/`. Il doit être servi par un petit serveur local (l'ouvrir en double‑cliquant sur `index.html` casse les modules JS et la 3D — limitation de sécurité de tous les navigateurs).

- **Mac :** double‑clic sur `demo/Lancer le portfolio (Mac).command`
- **Windows :** double‑clic sur `demo/Lancer le portfolio (Windows).bat`
- **Terminal :** `node demo/serve.mjs` (ou `python3 -m http.server 4173 --directory dist`)

Le navigateur s'ouvre sur `http://localhost:4173/`. Le contenu de `dist/` peut aussi être déposé tel quel sur n'importe quel hébergeur statique (Netlify, Vercel, GitHub Pages, OVH…), à la racine ou dans un sous‑dossier.

---

## Ce qu'il faut compléter

| Quoi | Où |
| --- | --- |
| Adresse e‑mail de contact | `src/data/site.js` → `email` |
| Réseaux sociaux | `src/data/site.js` → `socials` |
| Photo de profil (fond jaune) | non fournie — voir ci‑dessous |
| Modèle 3D Air Jordan 1 Low Travis Scott « Reverse Mocha » | non disponible sous licence libre — voir ci‑dessous |

Tant que l'e‑mail et les réseaux sont vides, la section Contact affiche une phrase neutre (aucune fausse adresse). Dès qu'ils sont remplis, les boutons « e‑mail », « copier l'adresse » et les liens apparaissent automatiquement.

### Remplacer la sneaker 3D

1. Récupère un fichier `.glb` (ou `.gltf`) dont la licence autorise ton usage.
2. `node tools/prepare-sneaker.mjs chemin/vers/modele.glb` → génère `public/models/sneaker-hd.glb` et `sneaker-lite.glb`.
3. Dans `src/data/sneaker.js` : mets à jour `model` (titre, crédit, `rotation` pour que la pointe soit vers +x) et repositionne les `hotspots` (ou `hotspots = []` pour les masquer).
4. `npm run build`.

Rotation, zoom, X‑Ray, éclairage et version mobile fonctionnent avec n'importe quel modèle. Les boutons de coloris n'apparaissent que si le fichier contient des variantes de matériaux.

---

## Direction artistique

- **Palette** : encre `#0b0b0c`, graphite, os `#edebe5`, gris froid `#8f949b`, un seul accent « signal » `#ff4f2b`. Chaque projet a sa propre palette dans sa page.
- **Typographie** : Archivo Expanded (titres monumentaux), Instrument Serif italique (contrepoint éditorial), Inter Tight (texte), Geist Mono (métadonnées).
- **Monogramme NM** : un seul trait continu. Le jambage droit du N est le jambage gauche du M. Il se dessine à l'intro, vole dans le header, puis revient en grand dans la section Contact, où ses sommets réagissent comme une corde qu'on pince.
- **Mouvement** : deux courbes pour tout le site (`--ease-out` pour les arrivées, `--ease-in-out` pour les transitions) et des durées partagées (`src/styles/tokens.css`).

## Structure

```
index.html                 squelette sémantique (lisible sans JS)
src/
  main.js                  ordre de démarrage
  data/                    contenu : site.js, projects.js, sneaker.js
  core/                    env (capacités appareil), scroll (Lenis+GSAP), split (découpe texte)
  ui/                      loader, header, menu, cursor-tag, reveals
  sections/                hero, works, object (3D), contact
  three/                   hero-gl (nom en WebGL), sneaker-stage (viewer 3D), variants
  project/                 view (overlay + routes #/work/…), blocks (mises en page), live/ (pièces temps réel)
  styles/                  tokens, base, chrome, hero, works, object, about-contact, project
public/
  models/                  sneaker-hd.glb (1.8 Mo) · sneaker-lite.glb (0.55 Mo, mobile / appareils modestes)
dist/                      version de production (générée par npm run build)
demo/                      serveur local sans dépendance + lanceurs Mac / Windows
  media/works/<projet>/    visuels WebP responsive (800 / 1400 / 2200 px)
tools/                     outils de production (non publiés)
  fetch-models.sh          télécharge les modèles 3D sources
  render/                  rig de rendu Three.js → visuels des projets (node tools/render/render.mjs <scene>)
  capture/                 captures des pièces génératives (Afterimage, Oscillo)
  mockups/                 maquettes UI HTML des concepts → captures desktop / mobile
  optimize-images.mjs      PNG → WebP responsive
  prepare-sneaker.mjs      optimise un modèle .glb pour la scène 3D
  qa/                      tests Playwright (captures, interactions, projets, objet 3D, perf)
```

### Ajouter ou modifier un projet

Tout est dans `src/data/projects.js` : titre, catégorie, statut, thème (couleurs + style de titre), et une liste de `blocks` (`text`, `statement`, `image`, `pair`, `gallery`, `chapters`, `screens`, `palette`, `type`, `live`). Chaque projet peut composer sa page différemment.

### Régénérer les visuels

```bash
./tools/fetch-models.sh                         # modèles sources (non versionnés)
npx vite &                                      # le rig passe par le serveur de dev
node tools/render/render.mjs shoe_cover 2400 1500
node tools/capture/run.mjs afterimage 1400 1400 art_a "study=0&t=12&frames=60"
node tools/mockups/run.mjs stride opale vanta rooms oscillo
node tools/optimize-images.mjs
```

## Performance & accessibilité

- Three.js est chargé à la demande (après le premier affichage) ; le modèle 3D n'est téléchargé que quand la section approche, puis initialisé en temps calme (`requestIdleCallback`).
- Rendu à la demande : la scène 3D ne redessine que si quelque chose bouge ; toutes les boucles s'arrêtent hors écran et quand l'onglet est caché.
- Mode « lite » automatique (mobile, ≤ 4 cœurs, peu de mémoire, Save‑Data) : modèle allégé, résolution réduite.
- `prefers-reduced-motion` : pas de smooth scroll, pas d'intro animée, pas de déformation, contenus visibles immédiatement.
- Navigation clavier complète : lien d'évitement, focus visibles, menu et projets avec piège de focus + Échap, viewer 3D pilotable aux flèches et +/−.

## Crédits

Voir [`CREDITS.md`](CREDITS.md). Tous les projets présentés sont des concepts personnels, jamais des réalisations client.
