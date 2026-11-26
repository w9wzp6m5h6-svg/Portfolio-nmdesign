# Noah Milsztajn — Portfolio V2

Portfolio de Noah Milsztajn, designer numérique autodidacte : direction artistique, design d'interface, expériences web, 3D et interaction. Site entièrement en français.

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
| Mentions légales (statut, SIRET, adresse, hébergeur) | `src/data/site.js` → `legal` — **obligatoire avant publication** |
| Adresse publique du site (canonical, sitemap) | `.env` → `SITE_URL` (voir `.env.example`) |
| Envoi direct du formulaire (facultatif) | `.env` → `VITE_FORM_ENDPOINT` (Formspree / Web3Forms) |
| Modèle 3D Air Jordan 1 Travis Scott (Mocha) | non fourni — voir « Remplacer la sneaker 3D » |
| Captures du site Cynthia Rimo et statut de ses fonctionnalités | non fournis — voir ci‑dessous |

La marche à suivre complète (domaine, hébergement, formulaire, Google Search Console) est dans **`MISE-EN-LIGNE.md`**.

E‑mail, Instagram, objet des e‑mails et informations légales sont centralisés dans `src/data/site.js` : contact, pied de page, formulaire et mentions légales se mettent à jour ensemble.

### Portrait

`tools/retouch-portrait.py` produit les versions du site (carré pour ordinateur, 4:5 pour mobile) depuis l'original conservé hors git dans `tools/source-photos/`. Retouche sobre : courbe tonale, étalonnage ocre, clarté et netteté légères, vignettage, grain fin. La source fait 1163 × 775 px : l'agrandissement ×2 est une interpolation, il n'ajoute pas de vrai détail (une vraie version 4K demande une photo source en haute définition).

### Cynthia Rimo (projet réel)

- **Captures du vrai site** : dépose les images (WebP de préférence, 800 / 1400 / 2200 px de large, nommées `rimo_xxx-800.webp`, etc.) dans `public/media/works/rimo/`, puis renseigne le bloc `captures` du projet dans `src/data/projects.js` avec `img('rimo', 'rimo_xxx', '16 / 10')`. Tant qu'il est vide, rien ne s'affiche (aucune fausse capture).
- **Statut des fonctionnalités** : dans le bloc `intentions`, ajoute un 3e élément à chaque ligne : `'livré'`, `'intégré'`, `'prévu'` ou `'prototype'`. Il apparaît alors sous forme d'étiquette. Sans statut, la liste est présentée comme les intentions de conception du projet.

### Remplacer la sneaker 3D

1. Récupère un fichier `.glb` (ou `.gltf`) dont la licence autorise ton usage.
2. `node tools/prepare-sneaker.mjs chemin/vers/modele.glb` → génère `public/models/sneaker-hd.glb` et `sneaker-lite.glb`.
3. Dans `src/data/sneaker.js` : mets à jour `model` (titre, crédit, `rotation` pour que la pointe soit vers +x) et repositionne les `hotspots` (ou `hotspots = []` pour les masquer).
4. `npm run build`.

Rotation, zoom, X‑Ray, éclairage et version mobile fonctionnent avec n'importe quel modèle. Les boutons de coloris n'apparaissent que si le fichier contient des variantes de matériaux.

---

## Direction artistique

- **Palette** : encre `#0b0b0c`, graphite, os `#edebe5`, gris froid `#8f949b`, un seul accent « signal » `#ff4f2b`. Chaque projet a sa propre palette dans sa page.
- **Typographie** : Archivo Expanded (mot-symbole et titres de page), Instrument Serif italique (contrepoint éditorial), Inter Tight (texte et titres de section), Geist Mono (navigation, métadonnées). Échelle unique dans `tokens.css` : texte 16–17 px, chapeau 18–22 px, titres de section 28–46 px, titre de page 40–72 px. Un seul très grand élément sur le site : « NM DESIGN » en page d'accueil.
- **Grille** : 12 colonnes, mêmes marges partout. Axe A (colonne 1) pour les libellés, axe B (colonne 4) pour les titres et textes.
- **Monogramme NM** : un seul trait continu. Le jambage droit du N est le jambage gauche du M. Il se dessine à l'intro, vole dans le header, puis revient en grand dans la section Contact, où ses sommets réagissent comme une corde qu'on pince.
- **Mouvement** : deux courbes pour tout le site (`--ease-out` pour les arrivées, `--ease-in-out` pour les transitions) et des durées partagées (`src/styles/tokens.css`).

## Structure

```
index.html                 Accueil : hero NM DESIGN, projets sélectionnés, présentation courte, contact
projets/index.html         Projets : tous les projets (filtres), lab 3D, contact
a-propos/index.html        À propos : portrait, récit, qualités, parcours, approche, contact
offres/index.html          Offres : formules et tarifs, compléments, offre de lancement, méthode, contact
src/
  partials/                gabarits partagés (head, header + menu, contact, footer, fenêtres, scène 3D)
                           assemblés au build par vite.config.js (<!-- include:nom -->, {{href:page}})
  main.js                  ordre de démarrage (chaque section ne s'initialise que si elle est sur la page)
  data/                    contenu : site.js, projects.js, sneaker.js
  core/                    env (capacités appareil), scroll (Lenis+GSAP), split (découpe texte)
  ui/                      loader, header, menu, cursor-tag, reveals, transitions (fondu entre pages)
  sections/                hero, works (accueil + page Projets), object (3D), about, contact, commerce (formulaire, mentions)
  three/                   hero-gl (nom en WebGL), sneaker-stage (viewer 3D), variants
  project/                 view (overlay + routes #/work/…), blocks (mises en page), live/ (pièces temps réel)
  styles/                  tokens, base, chrome, hero, works, object, about-contact, project, commerce
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

`selected: true` place un projet dans la sélection de l'accueil (trois projets) ; `tags` alimente les filtres de la page Projets (`real`, `web`, `3d`, `identity`).

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
