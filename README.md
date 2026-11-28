# NM Design — portfolio de Noah Milsztajn

Portfolio de Noah Milsztajn, designer numérique autodidacte : direction artistique, design d'interface, expériences web, 3D et interaction. Site entièrement en français.

**Stack :** Vite · JavaScript (ES modules) · Three.js · GSAP + ScrollTrigger · Lenis · polices auto‑hébergées (Fontsource).

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
| Mentions légales (statut, SIRET, adresse, hébergeur) | `src/data/site.js` → `legal` — **obligatoire avant publication** |
| Adresse publique du site (canonical, sitemap) | `.env` → `SITE_URL` (voir `.env.example`) |
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

- **Deux tons, un seul système** : ivoire `#f2f1ed` et encre `#0d0d0e`. Les sections portent `data-tone="light"` ou `data-tone="dark"` ; en défilant, la page bascule entièrement de ton (fond et texte, transition de 0,9 s déclenchée à 55 % de l'écran, `src/ui/tone.js`). Les nuances secondaires dérivent de la couleur courante (`color-mix`), les contrastes AA sont mesurés dans les deux tons. Aucun filet ni cadre décoratif : la structure vient de l'espace, de la taille et du ton.
- **Deux familles, pas une de plus** : Archivo (variable, chasse 62–125 % et graisse 100–900 ; titres très larges, texte, libellés en chasse étroite) et Instrument Serif italique (le mot qui compte dans chaque titre). Plus de mono. Inter Tight n'est chargé que pour le spécimen typographique du projet Opale.
- **La couleur vient des projets** : l'interface reste ivoire / encre ; chaque scène et chaque étude de cas a sa palette.
- **Monogramme NM** (logo original, inchangé) : il se trace dans l'en-tête au chargement et au survol, et revient en grand, discret, à la fin du contact.
- **Entrée immédiate** : plus d'intro. Le hero arrive en ~1,2 s sans jamais bloquer le défilement : titre « Des sites qui marquent *les esprits.* », et une bobine des projets (défilement automatique, pause au survol, au focus, hors écran ; boutons précédent / suivant / pause ; inclinaison et reflet au curseur).
- **Showcase** : une section sombre où chaque projet a sa mise en scène (`showcase.layout` dans `projects.js`) — `live` (le vrai site de L'Empreinte, explorable sur place), `object` (rendu + écran du site flottant devant), `cinema` (pleine largeur 21:9), `space` (portrait vertical), `art` (œuvres), `signal` (Oscillo : le signal se dessine en direct et réagit au curseur). Vues à parcourir sur chaque scène, profondeur au curseur, apparition en rideau, index flottant des projets sur grand écran, transition partagée de l'image vers l'étude de cas.
- **Studio et services** : une phrase avec le portrait glissé dans le texte, puis quatre grandes lignes de services ; au survol, la ligne avance, les autres s'effacent, le texte apparaît et son pictogramme se trace.
- **Contact** : conclusion sombre, titre géant, bouton rond magnétique « Démarrer un projet » et coordonnées en grand.
- **Menu** : sombre, plein écran, grands libellés (la page courante en italique), bouton projet et contact en pied. L'en-tête se masque en descendant et revient en remontant.
- **Mouvement** : courbes et durées partagées (`src/styles/tokens.css`) ; tout est coupé ou réduit avec `prefers-reduced-motion`.

## Structure

```
index.html                 Accueil : hero (titre + bobine des projets), showcase, studio, services, contact
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

`selected: true` place un projet dans le showcase de l'accueil (quatre projets) ; `tags` alimente les filtres de la page Projets (`real`, `web`, `3d`, `identity`).

Tout est dans `src/data/projects.js` : titre, catégorie, statut, thème (couleurs + style de titre), et une liste de `blocks` (`site`, `text`, `statement`, `image`, `pair`, `gallery`, `chapters`, `screens`, `palette`, `type`, `live`), et `showcase` (mise en scène dans la liste : `layout`, `thumbs`). Chaque projet peut composer sa page différemment.

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

- Aucune bibliothèque 3D sur l'accueil : profondeur et inclinaisons en CSS 3D (transformations GPU). Three.js (≈135 Ko gzip) n'est chargé que sur la page Projets, quand le lab approche ; le modèle est initialisé en temps calme (`requestIdleCallback`).
- La bobine du hero, le signal d'Oscillo et les parallaxes s'arrêtent hors écran et quand l'onglet est caché. Le site de L'Empreinte (6,5 Mo) n'est chargé qu'au clic.
- Rendu à la demande : la scène 3D ne redessine que si quelque chose bouge ; toutes les boucles s'arrêtent hors écran et quand l'onglet est caché.
- Mode « lite » automatique (mobile, ≤ 4 cœurs, peu de mémoire, Save‑Data) : modèle allégé, résolution réduite.
- `prefers-reduced-motion` : pas de smooth scroll, pas de défilement automatique, pas de déformation ni d'inclinaison, contenus visibles immédiatement.
- Navigation clavier complète : lien d'évitement, focus visibles, menu et projets avec piège de focus + Échap, viewer 3D pilotable aux flèches et +/−.

## Crédits

Voir [`CREDITS.md`](CREDITS.md). Hormis L'Empreinte (projet réel), les projets présentés sont des concepts personnels, jamais des réalisations client.
