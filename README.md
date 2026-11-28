# NM Design — portfolio de Noah Milsztajn

Portfolio de Noah Milsztajn, designer numérique autodidacte : direction artistique, design d'interface, expériences web, 3D et interaction. Site entièrement en français.

**Stack :** Vite · JavaScript (ES modules) · Three.js · GSAP + ScrollTrigger · Lenis · Space Grotesk + Inter auto‑hébergées (Fontsource).

```bash
npm install
npm run dev                # http://localhost:5173 (cette machine uniquement ; sur téléphone : npm run dev -- --host)
npm run build              # → dist/ (site statique, déployable partout)
npm run preview            # sert dist/ sur http://localhost:4173
npm run check:security     # contrôle de sécurité du dossier dist/
```

**Sécurité :** CSP stricte, en-têtes HTTP, formulaire anti‑abus, vérifications automatiques. Tout est décrit dans [`SECURITE.md`](SECURITE.md), avec ce qu'il te reste à activer sur tes comptes.

### Démonstration (sans rien installer d'autre que Node.js ou Python)

Le site de production est dans `dist/`. Il doit être servi par un petit serveur local (l'ouvrir en double‑cliquant sur `index.html` casse les modules JS et la 3D — limitation de sécurité de tous les navigateurs).

- **Mac :** double‑clic sur `demo/Lancer le portfolio (Mac).command`
- **Windows :** double‑clic sur `demo/Lancer le portfolio (Windows).bat`
- **Terminal :** `node demo/serve.mjs` (ou `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`)

Le navigateur s'ouvre sur `http://127.0.0.1:4173/` (accessible depuis ton ordinateur uniquement). Le contenu de `dist/` peut aussi être déposé tel quel sur n'importe quel hébergeur statique (Netlify, Vercel, GitHub Pages, OVH…), à la racine ou dans un sous‑dossier.

---

## Ce qu'il faut compléter

| Quoi | Où |
| --- | --- |
| Mentions légales (statut, SIRET, adresse, adresse postale de l'hébergeur) | `src/data/site.js` → `legal` — **obligatoire pour une activité professionnelle** |
| Adresse publique du site (canonical, og:url, sitemap) | `src/data/site.js` → `url` (actuellement https://nmdesignportfolio.netlify.app) ; `SITE_URL` dans `.env` la remplace si besoin |
| Envoi direct du formulaire (facultatif) | `.env` → `VITE_FORM_ENDPOINT` (Formspree / Web3Forms) |
| Modèle 3D Air Jordan 1 Travis Scott (Mocha) | non fourni — voir « Remplacer la sneaker 3D » |

La marche à suivre complète (domaine, hébergement, formulaire, Google Search Console) est dans **`MISE-EN-LIGNE.md`**.

E‑mail, Instagram, objet des e‑mails et informations légales sont centralisés dans `src/data/site.js` : contact, pied de page, formulaire et mentions légales se mettent à jour ensemble.

### Portrait

`tools/retouch-portrait.py` produit les versions du site (carré pour ordinateur, 4:5 pour mobile) depuis l'original conservé hors git dans `tools/source-photos/`. Retouche sobre : courbe tonale, étalonnage ocre, clarté et netteté légères, vignettage, grain fin. La source fait 1163 × 775 px : l'agrandissement ×2 est une interpolation, il n'ajoute pas de vrai détail (une vraie version 4K demande une photo source en haute définition).

### L'Empreinte — la galerie numérique de Cynthia Rimo (projet réel)

- **Le vrai site est intégré** : `public/lempreinte/index.html` est le fichier livré à la galerie, **copié sans aucune modification** (même empreinte SHA-256 que l'original). Il est publié tel quel à `/lempreinte/` et sert d'aperçu en direct dans la scène du projet (accueil, page Projets) et dans l'étude de cas (bloc `site`).
- **Chargement à la demande** : le fichier pèse ≈ 6,5 Mo (œuvres embarquées). Il n'est jamais chargé avec la page : seulement quand le visiteur clique sur « Explorer le site en direct ». Il s'ouvre alors dans une iframe isolée (`sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"`, sans `allow-same-origin`) : ses scripts tournent, mais il ne peut ni lire ni modifier le portfolio. Bouton « Plein écran » à côté.
- **Captures** : `public/media/works/rimo/` contient les vues du site (salle, fiche d'œuvre, loupe, « chez soi », filtres, sélection, vernissage, mobile), produites depuis ce fichier avec `node tools/integrate-gallery.mjs "chemin/vers/le-fichier.html"`. Pour une nouvelle version du site : remplace `public/lempreinte/index.html` par le nouveau fichier, relance l'outil, puis `npm run build`.
- **Statut des fonctionnalités** : dans le bloc `intentions`, le 3e élément de chaque ligne (`'livré'`, `'intégré'`, `'prévu'`, `'prototype'`) s'affiche en étiquette. Les 9 fonctionnalités listées sont présentes dans le fichier livré (`'intégré'`).
- Aucune URL publique n'est indiquée : le fichier n'en déclare pas. Ajoute-la dans `src/data/projects.js` (`live`) seulement une fois vérifiée en ligne.

### Remplacer la sneaker 3D

1. Récupère un fichier `.glb` (ou `.gltf`) dont la licence autorise ton usage.
2. `node tools/prepare-sneaker.mjs chemin/vers/modele.glb` → génère `public/models/sneaker-hd.glb` et `sneaker-lite.glb`.
3. Dans `src/data/sneaker.js` : mets à jour `model` (titre, crédit, `rotation` pour que la pointe soit vers +x) et repositionne les `hotspots` (ou `hotspots = []` pour les masquer).
4. `npm run build`.

Rotation, zoom, X‑Ray, éclairage et version mobile fonctionnent avec n'importe quel modèle. Les boutons de coloris n'apparaissent que si le fichier contient des variantes de matériaux.

---

## Direction artistique

- **Base claire** : ivoire `#f2f1ed`, encre `#0d0d0e`, gris dérivés de la couleur du texte (`color-mix`). Le noir est réservé au texte, aux boutons et à la conclusion (contact, pied de page). Les couleurs fortes viennent uniquement des projets. Pas de dégradés décoratifs, pas de verre dépoli, pas d'ombres systématiques.
- **Deux familles, pas une de plus** (`src/styles/tokens.css`) :
  - **Space Grotesk** (300–700) : titres, accroches, grands textes, chiffres. L'accent d'un titre ne change jamais de police : il passe en graisse légère (300) et en gris (« Pas des sites. »).
  - **Inter** (tailles optiques, 100–900) : texte, navigation, boutons, libellés. Les libellés (dates, catégories, numéros, statuts) sont en petites capitales Inter, approche +0,08 em.
  - Échelle unique en variables : `--fs-label` 12 px · `--fs-small` 14 · `--fs-body` 16→17 · `--fs-lead` 18→24 · `--fs-h3` 22→32 · `--fs-h2` 36→72 · `--fs-mega` (titres de page) · `--fs-h1` / `--fs-giant` (accueil, conclusion). Graisses (`--w-display` 500, `--w-accent` 300), approches (`--ls-*`) et interlignages (`--lh-*`) sont des variables, réutilisées par les classes `.label`, `.t-h2`, `.t-h3`, `.t-lead`, `.display`.
  - Chaque projet a un traitement de titre dans ces deux familles (`.p-title[data-style]`) : `can` (ÉLAN, capitales très grasses), `fashion` (PORTANT, capitales régulières espacées), `gallery` (L'Empreinte, graisse légère), `display`, `mono` (Inter fin), `wide`.
- **Accueil** : titre monumental sur toute la largeur (« Pas des sites. / Des expériences. »), identité et métier en tête, bobine des projets en élément visuel, arrivée en ~1,2 s sans jamais bloquer le défilement.
- **Showcase** : une mise en scène par projet (`showcase.layout`) — `live` (le vrai site de L'Empreinte), `space` (ÉLAN, portrait), `cinema` (PORTANT, Vanta), `object` (Stride), `art`, `signal` (Oscillo en direct).
- **Mouvement** : courbes et durées partagées ; tout est coupé ou réduit avec `prefers-reduced-motion`.

## Les deux concepts phares

### ÉLAN — canette 3D (`concepts/elan/`, `src/concepts/elan/`)
Marque fictive de boisson énergisante. La canette est **construite en code** avec Three.js (`can-stage.js`) : fond embouti, col, sertissage, couvercle, languette ; étiquette dessinée dans un canvas pour chaque saveur (`label.js`) ; studio à bandes verticales pour les reflets de l'aluminium ; ombre de contact.
Interactions : rotation libre avec inertie (souris, doigt, clavier), inclinaison, zoom (boutons, pincement, Ctrl + molette, double clic), vues Face / Profil / Dos / Dessus, quatre saveurs avec remplissage de l'étiquette (shader) et demi-tour, entrée animée. Arrêt hors écran, ressources libérées à la fermeture, résolution réduite sur appareils modestes.
Rendus fixes : `npx vite --port 5174 &` puis `node tools/render/elan.mjs` (même moteur que le site).

### PORTANT — dressing digital (`concepts/portant/`, `src/concepts/portant/`)
Boutique fictive. Le portant (`rack.js`) est une petite simulation : tringle avec inertie et ressort de pose, pièces qui se tassent et pivotent loin du centre, cintres en pendules amortis entraînés par l'accélération, tissu qui suit avec retard, pièce choisie qui avance. Nom, prix, description, matière, tailles (épuisées barrées), sac en mémoire.
Les vêtements sont des **illustrations dessinées en code** (SVG paramétrique, `tools/garments/`), pas des photos : `node tools/garments/render.mjs`.
Captures des deux sites pour les études de cas : `node tools/capture/concepts.mjs` (serveur de développement lancé).

Les deux sites portent un bandeau « Concept fictif », ne sont pas indexés (`noindex`, hors sitemap) et n'envoient aucune donnée.

## Structure

```
index.html                 Accueil : hero (titre monumental + bobine), showcase, studio, services, contact
concepts/elan/             site de la marque ÉLAN (concept, canette 3D)
concepts/portant/          site de la boutique PORTANT (concept, portant)
projets/index.html         Projets : tous les projets (filtres), lab 3D, contact
a-propos/index.html        À propos : portrait, récit, qualités, parcours, approche, contact
offres/index.html          Offres : formules et tarifs, compléments, offre de lancement, méthode, contact
src/
  partials/                gabarits partagés (head, header + menu, contact, footer, fenêtres, scène 3D)
                           assemblés au build par vite.config.js (<!-- include:nom -->, {{href:page}})
  main.js                  ordre de démarrage (chaque section ne s'initialise que si elle est sur la page)
  data/                    contenu : site.js, projects.js, sneaker.js
  core/                    env (capacités appareil), scroll (Lenis+GSAP), split (découpe texte),
                           escape (échappement HTML), css (styles dynamiques compatibles CSP)
  concepts/                elan (canette 3D, étiquettes, site), portant (portant, données, site), socle commun
  ui/                      header, menu, tone (bascule clair / sombre), live-site (aperçu isolé du site de L'Empreinte),
                           cursor-tag, reveals, transitions (fondu entre pages)
  sections/                hero (titre + bobine), works (showcase : une scène par projet), studio, object (3D),
                           about, contact, commerce (formulaire, mentions)
  three/                   sneaker-stage (viewer 3D du lab), variants
  project/                 view (overlay + routes #/work/…), blocks (mises en page), live/ (pièces temps réel)
  styles/                  tokens, base, chrome, hero, showcase, works (studio + services), object, about-contact, project, commerce
public/
  models/                  sneaker-hd.glb (1.8 Mo) · sneaker-lite.glb (0.55 Mo, mobile / appareils modestes)
dist/                      version de production (générée par npm run build), avec _headers, .htaccess, .well-known/security.txt
vercel.json                en-têtes HTTP de sécurité (source unique, dérivée au build vers _headers et .htaccess)
.github/                   workflow « Sécurité et build » + Dependabot
SECURITE.md                protections en place, actions manuelles, incident, restauration
demo/                      serveur local sans dépendance + lanceurs Mac / Windows
  media/works/<projet>/    visuels WebP responsive (800 / 1400 / 2200 px)
  lempreinte/index.html    le site livré à la galerie, copié tel quel (aperçu en direct, iframe isolée)
tools/                     outils de production (non publiés)
  fetch-models.sh          télécharge les modèles 3D sources
  render/                  rig de rendu Three.js → visuels des projets (node tools/render/render.mjs <scene>)
  capture/                 captures des pièces génératives (Afterimage, Oscillo)
  mockups/                 maquettes UI HTML des concepts → captures desktop / mobile
  optimize-images.mjs      PNG → WebP responsive
  prepare-sneaker.mjs      optimise un modèle .glb pour la scène 3D
  qa/                      tests Playwright (captures, interactions, projets, objet 3D, perf) + check-security.mjs
  integrate-gallery.mjs    captures du site de L'Empreinte depuis son fichier HTML (+ rapport)
```

### Ajouter ou modifier un projet

`selected: true` place un projet dans le showcase de l'accueil (cinq projets) ; `tags` alimente les filtres de la page Projets (`real`, `web`, `3d`, `identity`).

Tout est dans `src/data/projects.js` : titre, catégorie, statut, thème (couleurs + style de titre), et une liste de `blocks` (`site`, `can`, `rack`, `concept`, `text`, `statement`, `image`, `pair`, `gallery`, `chapters`, `screens`, `palette`, `type`, `live`), et `showcase` (mise en scène dans la liste : `layout`, `thumbs`). Chaque projet peut composer sa page différemment.

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

- Aucune bibliothèque 3D sur l'accueil : profondeur et inclinaisons en CSS 3D (transformations GPU). Three.js n'est chargé que par le lab, la canette ÉLAN (étude de cas ou site de la marque) : jamais avant d'en avoir besoin. Three.js (≈135 Ko gzip) n'est chargé que sur la page Projets, quand le lab approche ; le modèle est initialisé en temps calme (`requestIdleCallback`).
- La bobine du hero, le signal d'Oscillo et les parallaxes s'arrêtent hors écran et quand l'onglet est caché. Le site de L'Empreinte (6,5 Mo) n'est chargé qu'au clic.
- Rendu à la demande : la scène 3D ne redessine que si quelque chose bouge ; toutes les boucles s'arrêtent hors écran et quand l'onglet est caché.
- Mode « lite » automatique (mobile, ≤ 4 cœurs, peu de mémoire, Save‑Data) : modèle allégé, résolution réduite.
- `prefers-reduced-motion` : pas de smooth scroll, pas de défilement automatique, pas de déformation ni d'inclinaison, contenus visibles immédiatement.
- Navigation clavier complète : lien d'évitement, focus visibles, menu et projets avec piège de focus + Échap, viewer 3D pilotable aux flèches et +/−.

## Crédits

Voir [`CREDITS.md`](CREDITS.md). Hormis L'Empreinte (projet réel), les projets présentés sont des concepts personnels, jamais des réalisations client.
