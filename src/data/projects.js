/**
 * Projets.
 *  - `real: true`  → projet réel (mis en avant, séparé des concepts)
 *  - sinon        → concept personnel ou exploration, jamais présenté comme une commande client
 *  - `selected`   → apparaît dans la sélection de l'accueil (toute la liste est sur la page Projets)
 *  - `tags`       → filtres de la page Projets : real, web, 3d, identity
 *
 * Chaque projet a son propre thème (couleurs, traitement du titre) et sa propre
 * suite de blocs : deux études de cas ne partagent jamais la même mise en page.
 */

import { asset } from '../core/asset.js';

const L = [800, 1400, 2200]; // rendus paysage
const P = [800, 1400];       // rendus portrait
const M = [800];             // captures mobile
const D = [800, 1400];       // captures desktop

/** Image responsive */
const img = (project, name, ratio, widths = L, alt = '') => ({
  src: asset(`media/works/${project}/${name}-${widths[Math.min(1, widths.length - 1)]}.webp`),
  srcset: widths.map((w) => `${asset(`media/works/${project}/${name}-${w}.webp`)} ${w}w`).join(', '),
  ratio,
  alt,
});

export const projects = [
  /* ------------------------------------------------------------------ */
  /* Projet réel                                                         */
  /* ------------------------------------------------------------------ */
  {
    slug: 'cynthia-rimo',
    tags: ['real', 'web'], // filtres de la page Projets
    selected: true, // affiché sur l'accueil
    real: true,
    num: '01',
    title: 'Cynthia Rimo',
    subtitle: "Site et expérience digitale d'une galerie d'art à Valbonne",
    category: 'Art & culture · Expérience digitale',
    status: 'Projet réel',
    layout: 'feature',
    heroPlain: true, // en-tête composé en HTML : le nom reste entier sur mobile
    cover: img('rimo', 'rimo_cover', '16 / 9', L, 'Cynthia Rimo, galerie d’art à Valbonne : composition typographique sur fond blanc'),
    coverPos: '22% 50%',
    theme: { bg: '#f5f3ef', fg: '#151413', muted: '#77726a', line: 'rgb(21 20 19 / 0.14)', accent: '#b3261e', title: 'gallery', light: true },
    meta: [
      ['Type', 'Projet réel'],
      ['Pour', 'Galerie Cynthia Rimo, Valbonne'],
      ['Ma contribution', "Direction artistique, conception de l'expérience numérique"],
      ['Domaine', 'Art & culture'],
    ],
    lead: "Une galerie doit montrer des œuvres, mais surtout donner envie de les acquérir. Pour la galerie de Cynthia Rimo, à Valbonne, j'ai imaginé une expérience numérique pensée comme une visite : beaucoup de blanc, des œuvres qui respirent, et un chemin direct vers l'échange.",
    blocks: [
      { type: 'statement', text: 'Le site devait vendre des œuvres, pas seulement présenter une galerie.' },
      { type: 'text', kicker: 'Le problème', title: 'De la vitrine au parcours.', body: "Sur beaucoup de sites de galerie, les œuvres défilent comme un catalogue : petites, toutes identiques, sans format ni contexte. Or un tableau s'achète quand on peut s'en approcher, comprendre ses dimensions et l'imaginer chez soi. L'enjeu : recréer ce rapport physique à l'écran, puis rendre la prise de contact immédiate." },
      { type: 'text', kicker: 'Direction artistique', title: "Le blanc d'un musée.", body: "Un fond blanc cassé, une typographie discrète, des marges généreuses : l'interface s'efface pour que chaque œuvre occupe l'espace comme sur un mur d'exposition. Les animations restent lentes et élégantes, à la manière d'un regard qui se pose sur un tableau." },
      {
        type: 'intentions',
        title: "Ce que l'expérience a été conçue pour permettre",
        // status possible : 'livré' | 'intégré' | 'prévu' | 'prototype' — à renseigner une fois vérifié
        items: [
          ['Présentation immersive des œuvres', 'Chaque tableau en grand format, avec le temps de le regarder.'],
          ['Zoom sur les œuvres', "S'approcher de la matière, de la touche et des détails."],
          ['Dimensions et prix', 'Les informations utiles pour décider, sans détour.'],
          ['Œuvres en situation', "Visualiser certaines œuvres dans un intérieur, à l'échelle d'une pièce."],
          ['Contact via WhatsApp', "Un parcours d'achat ou d'échange direct avec la galerie."],
          ['Événements et vernissages', 'Une section pour faire vivre la galerie au-delà de ses murs.'],
          ['Navigation intuitive et responsive', "Pensée pour le téléphone autant que pour l'ordinateur."],
        ],
      },
      { type: 'chapters', title: 'Ma contribution', items: [
        ['Direction artistique', "Univers visuel, palette, typographie, rythme et ton de l'interface."],
        ['Expérience numérique', 'Le parcours des œuvres, les interactions avec les tableaux et le chemin vers le contact.'],
        ['Design orienté vente', 'Placer les informations de décision (format, prix, mise en situation) au bon moment du parcours.'],
      ] },
      { type: 'captures', items: [] }, // captures du site réel : à ajouter dans public/media/works/rimo/
      { type: 'palette', colors: [['Mur', '#f5f3ef'], ['Encre', '#151413'], ['Pierre', '#d9d4cb'], ['Pastille rouge', '#b3261e']] },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Concepts personnels                                                 */
  /* ------------------------------------------------------------------ */
  {
    slug: 'stride',
    tags: ['web', '3d'], // filtres de la page Projets
    selected: true, // affiché sur l'accueil
    num: '02',
    title: 'Stride',
    subtitle: "Expérience de lancement d'une chaussure de running en maille",
    category: 'Expérience produit · WebGL',
    status: 'Concept — 2026',
    layout: 'a',
    cover: img('stride', 'shoe_cover', '16 / 10', L, 'Chaussure noire en maille flottant au-dessus de son ombre'),
    coverPos: '50% 55%',
    theme: { bg: '#0c0c0d', fg: '#edebe5', muted: '#8f949b', line: 'rgb(237 235 229 / 0.14)', accent: '#ff5a4e', title: 'display' },
    meta: [
      ['Type', 'Concept personnel'],
      ['Année', '2026'],
      ['Disciplines', 'Direction artistique, interface, WebGL, motion'],
      ['En direct', 'Section « L’objet » de ce site'],
    ],
    lead: "Et si une page produit donnait l'impression de tenir le produit ? Stride est une expérience de lancement construite autour d'un seul objet : une chaussure en maille que l'on fait pivoter, inspecte et change de coloris en temps réel, avec le rythme d'un film de campagne.",
    blocks: [
      { type: 'text', kicker: 'Le brief', title: 'Un objet, une scène.', body: "Les pages sneakers empilent souvent des photos en grille. Je voulais l'inverse : un seul objet, une seule scène, et une interface qui s'efface. Chaque contrôle répond à une vraie question d'acheteur : à quoi ressemble le talon, de quoi est faite la tige, que donne-t-elle dans un autre coloris ?" },
      { type: 'pair', items: [img('stride', 'shoe_detail', '4 / 5', P, 'Gros plan sur les lacets et les œillets'), img('stride', 'shoe_profile', '16 / 10', L, 'Profil de la chaussure')], caption: "Rendus studio. Chaque image utilise le même éclairage que la scène 3D en direct : photo et temps réel se répondent." },
      { type: 'screens', desktop: img('screens', 'ui_stride_d', '16 / 10', D, 'Page de lancement Stride, desktop'), mobile: img('screens', 'ui_stride_m', '9 / 19.5', M, 'Page de lancement Stride, mobile'), caption: "Page d'accueil : le produit au centre, la typographie et la navigation sur les bords." },
      { type: 'statement', text: "Trois coloris, une seule géométrie. Changer de coloris, c'est un balayage de lumière, pas un rechargement." },
      { type: 'pair', flip: true, items: [img('stride', 'shoe_beach', '16 / 10', L, 'Coloris Beach'), img('stride', 'shoe_midnight', '16 / 10', L, 'Coloris Midnight')] },
      { type: 'chapters', title: "Modèle d'interaction", items: [
        ['Pivoter', 'Rotation avec inertie. Sur mobile, le glissé horizontal fait tourner la chaussure, le glissé vertical fait défiler la page.'],
        ['Inspecter', 'Des repères ancrés sur la chaussure : la caméra vient se placer sur chaque détail, un panneau l’explique.'],
        ['Changer de coloris', 'Les coloris se remplacent par une ligne de lumière qui balaie la tige.'],
        ['Rayons X', 'Une vue en transparence et en maillage qui révèle la construction du modèle.'],
      ] },
      { type: 'live', module: 'object', title: "Essayer l'objet en direct", text: 'La scène interactive de ce concept tourne sur ce site.' },
      { type: 'palette', colors: [['Encre', '#0c0c0d'], ['Graphite', '#1b1d20'], ['Os', '#edebe5'], ['Corail', '#ff5a4e']] },
    ],
  },

  {
    slug: 'vanta',
    tags: ['3d', 'web'], // filtres de la page Projets
    num: '03',
    title: 'Vanta',
    subtitle: "Un configurateur cinématographique pour un grand tourisme concept",
    category: 'Automobile · Interface 3D',
    status: 'Concept — 2026',
    layout: 'b',
    cover: img('vanta', 'car_wheel', '4 / 5', P, "Roue et passage de roue d'une voiture concept graphite"),
    coverPos: '35% 50%',
    hero: img('vanta', 'car_cover', '16 / 10', L, 'Voiture concept graphite dans un studio sombre'),
    theme: { bg: '#080708', fg: '#f1ece8', muted: '#958a86', line: 'rgb(241 236 232 / 0.12)', accent: '#d63a2c', title: 'display' },
    meta: [
      ['Type', 'Concept personnel'],
      ['Année', '2026'],
      ['Disciplines', 'UX, interface, direction 3D'],
      ['Support', 'Web, desktop en priorité'],
    ],
    lead: "La plupart des configurateurs ressemblent à un tableur avec une voiture à côté. Vanta traite la configuration comme un film : la caméra change de plan à chaque chapitre, et l'interface n'affiche que ce que le plan demande.",
    blocks: [
      { type: 'image', size: 'full', src: img('vanta', 'car_side', '16 / 9', L, 'Voiture concept en Carmine Candy, de profil') },
      { type: 'chapters', title: 'Quatre chapitres, quatre plans', items: [
        ['01 — Posture', "Un trois-quarts bas. La voiture est présentée avant qu'on vous demande quoi que ce soit."],
        ['02 — Peinture', 'La caméra recule jusqu’au profil, pour que la finition accroche les bandes de lumière.'],
        ['03 — Jantes', "Un cadrage serré sur le passage de roue. Les options de jantes et d'étriers occupent l'espace libre."],
        ['04 — Habitacle', 'Une vue plongeante à travers le toit vitré, les finitions intérieures disposées comme un plan.'],
      ] },
      { type: 'pair', items: [img('vanta', 'car_front', '16 / 10', L, 'Face avant en Carmine Candy'), img('vanta', 'car_top', '16 / 10', L, 'Vue trois-quarts plongeante en graphite')], caption: 'La peinture est traitée comme une matière, pas comme une pastille : chaque finition a son vernis et sa réponse aux paillettes.' },
      { type: 'screens', desktop: img('screens', 'ui_vanta_d', '16 / 10', D, 'Configurateur Vanta, chapitre peinture'), mobile: img('screens', 'ui_vanta_m', '9 / 19.5', M, 'Configurateur Vanta sur mobile'), caption: "Chapitre 02, la peinture. L'interface nomme la finition, le rendu la prouve." },
      { type: 'statement', text: 'L’interface doit ressembler au tableau de bord, pas à la brochure.' },
      { type: 'palette', colors: [['Vide', '#080708'], ['Carmin', '#9d1f17'], ['Nacre', '#d9d6d2'], ['Graphite', '#2b2c2f']] },
    ],
  },

  {
    slug: 'opale',
    tags: ['web', '3d'], // filtres de la page Projets
    selected: true, // affiché sur l'accueil
    num: '04',
    title: 'Maison Opale',
    subtitle: "E-commerce éditorial pour une maison de lunettes imaginaire",
    category: 'Luxe · E-commerce',
    status: 'Concept — 2026',
    layout: 'c',
    cover: img('opale', 'glasses_cover', '16 / 10', L, 'Lunettes aviateur sur papier chaud, ombre longue'),
    coverPos: '50% 50%',
    theme: { bg: '#efe9df', fg: '#1d1a16', muted: '#7d7466', line: 'rgb(29 26 22 / 0.14)', accent: '#9c7a44', title: 'serif', light: true },
    meta: [
      ['Type', 'Concept personnel'],
      ['Année', '2026'],
      ['Disciplines', 'Identité, direction artistique, UX e-commerce'],
      ['Ton', 'Luxe discret'],
    ],
    lead: "Une boutique de luxe lente : peu de produits, une lumière généreuse, et une typographie qui fait la vente. Elle se lit comme un lookbook imprimé et s'achète comme une boutique moderne.",
    blocks: [
      { type: 'statement', text: "Le luxe, c'est l'assurance d'en montrer moins." },
      { type: 'image', size: 'inset', src: img('opale', 'glasses_front', '16 / 10', L, 'Lunettes aviateur de face') },
      { type: 'text', kicker: 'Direction', title: 'Papier, soleil et un serif.', body: "Des tons papier chauds, un serif contrasté en grand, et les longues ombres dures des campagnes d'été. Les visuels produit sont des rendus 3D : chaque image garde exactement le même angle de soleil, et la collection se lit comme une série." },
      { type: 'screens', desktop: img('screens', 'ui_opale_d', '16 / 10', D, 'Page produit Maison Opale, desktop'), mobile: img('screens', 'ui_opale_m', '9 / 19.5', M, 'Page produit Maison Opale, mobile'), caption: 'Page produit : une image, un prix, une action. Les détails se déplient à la demande.' },
      { type: 'image', size: 'wide', src: img('opale', 'glasses_top', '16 / 10', L, 'Lunettes aviateur vues de dessus, ombre dure') },
      { type: 'type', families: [['Instrument Serif', 'Titres, accents en italique', 'Aa'], ['Inter Tight', 'Interface et texte courant', 'Aa']] },
      { type: 'palette', colors: [['Papier', '#efe9df'], ['Sable', '#d8cfc1'], ['Encre', '#1d1a16'], ['Laiton', '#9c7a44']] },
    ],
  },

  {
    slug: 'rooms',
    tags: ['web'], // filtres de la page Projets
    num: '05',
    title: 'Quiet Rooms',
    subtitle: "Site d'un studio d'architecture intérieure",
    category: 'Architecture · Intérieur',
    status: 'Concept — 2026',
    layout: 'd',
    cover: img('rooms', 'interior_chair', '4 / 5', P, 'Fauteuil en velours orange dans une pièce ensoleillée'),
    coverPos: '50% 60%',
    hero: img('rooms', 'interior_cover', '16 / 10', L, 'Pièce ensoleillée avec un fauteuil en velours vert, un pouf et une lampe'),
    theme: { bg: '#e4ddd3', fg: '#23201c', muted: '#776f64', line: 'rgb(35 32 28 / 0.14)', accent: '#b0532d', title: 'light', light: true },
    meta: [
      ['Type', 'Concept personnel'],
      ['Année', '2026'],
      ['Disciplines', 'Web design, motion, mise en scène 3D'],
      ['Rythme', 'Lent'],
    ],
    lead: "Le site d'un studio imaginaire qui conçoit des espaces calmes. Il suit les règles de ses pièces : un objet par image, la lumière pour seul décor, et des transitions aussi lentes qu'une ombre qui passe.",
    blocks: [
      { type: 'statement', text: 'La lumière est la matière.' },
      { type: 'pair', items: [img('rooms', 'interior_chair', '4 / 5', P, 'Fauteuil en velours Mango'), img('rooms', 'interior_pouf', '16 / 10', L, 'Pouf plissé en soie et lampe en verre')], caption: 'Pièces mises en scène en 3D temps réel : une fenêtre, un seul soleil, des meubles scannés.' },
      { type: 'text', kicker: 'Motion', title: 'Des transitions aussi lentes qu’une ombre.', body: "Les pages se fondent dans le sens de la lumière. Rien ne rebondit. Le défilement ralentit sur les images et accélère sur le texte : le visiteur reste plus longtemps dans une pièce que dans un paragraphe." },
      { type: 'screens', desktop: img('screens', 'ui_rooms_d', '16 / 10', D, "Page d'accueil Quiet Rooms, desktop"), mobile: img('screens', 'ui_rooms_m', '9 / 19.5', M, "Page d'accueil Quiet Rooms, mobile") },
      { type: 'palette', colors: [['Enduit à la chaux', '#e4ddd3'], ['Pierre', '#bdb4a7'], ['Terre d’ombre', '#23201c'], ['Terre cuite', '#b0532d']] },
    ],
  },

  {
    slug: 'afterimage',
    tags: ['3d', 'identity'], // filtres de la page Projets
    num: '06',
    title: 'Afterimage',
    subtitle: 'Études de lumière génératives en GLSL',
    category: 'Art numérique · Shaders',
    status: 'Exploration personnelle — 2026',
    layout: 'e',
    cover: img('afterimage', 'art_cover', '21 / 9', L, 'Champ de lumière génératif en ambre et noir'),
    coverPos: '50% 50%',
    live: 'afterimage',
    theme: { bg: '#050506', fg: '#e9e8f0', muted: '#8a8a99', line: 'rgb(233 232 240 / 0.12)', accent: '#ffb547', title: 'mono' },
    meta: [
      ['Type', 'Exploration personnelle'],
      ['Année', '2026'],
      ['Médium', 'Shader en temps réel'],
      ['Interaction', 'Votre curseur ou votre doigt'],
    ],
    lead: "Une série de pièces en temps réel sur la trace qu'une lumière laisse derrière elle. Chaque image est calculée en direct : pas de vidéo, pas d'image, juste un shader et votre curseur.",
    blocks: [
      { type: 'live', module: 'afterimage', title: 'Pièce en direct', text: "Bougez pour perturber le champ. Changez d'étude pour en changer les règles." },
      { type: 'text', kicker: 'Processus', title: 'Des règles, pas des images.', body: "Chaque étude est un petit ensemble de règles : un bruit qui se déforme lui-même, une palette de lumière, et la mémoire de l'endroit où vous l'avez touché. Changez un chiffre et toute l'image change de caractère : c'est pour ça que le code me sert de carnet de croquis." },
      { type: 'gallery', items: [img('afterimage', 'art_a', '1 / 1', P, 'Étude A'), img('afterimage', 'art_b', '1 / 1', P, 'Étude B'), img('afterimage', 'art_c', '1 / 1', P, 'Étude C')], caption: 'Images capturées dans les trois études.' },
      { type: 'statement', text: "Une image qui n'existe que pendant qu'on la regarde." },
    ],
  },

  {
    slug: 'oscillo',
    tags: ['identity', 'web'], // filtres de la page Projets
    num: '07',
    title: 'Oscillo',
    subtitle: "Identité et expérience digitale d'un festival sonore imaginaire",
    category: 'Expérience de marque · Identité',
    status: 'Concept — 2026',
    layout: 'f',
    cover: img('oscillo', 'osc_cover', '16 / 10', L, "Logo du festival Oscillo modulé par une onde"),
    coverPos: '50% 50%',
    live: 'oscillo',
    theme: { bg: '#1b2bff', fg: '#f3f1ea', muted: '#b9bdf5', line: 'rgb(243 241 234 / 0.22)', accent: '#e6ff3b', title: 'wide' },
    meta: [
      ['Type', 'Concept personnel'],
      ['Année', '2026'],
      ['Disciplines', 'Identité, système génératif, web'],
      ['Système', 'Logo piloté par un signal'],
    ],
    lead: "Une identité où le logo est un signal, pas une forme. Le nom est dessiné par une onde qui change à chaque saisie : affiches, billets, site et scène parlent tous sur la même fréquence.",
    blocks: [
      { type: 'live', module: 'oscillo', title: 'Le générateur', text: "Tapez un mot. Réglez la fréquence et l'amplitude. C'est le même moteur qui a dessiné toutes les affiches ci-dessous." },
      { type: 'image', size: 'full', src: img('oscillo', 'osc_posters', '16 / 9', L, 'Trois affiches du festival générées par le système') },
      { type: 'text', kicker: 'Système', title: 'Une règle, des sorties infinies.', body: "L'identité est une fonction : du texte en entrée, un signal appliqué, un logo en sortie. Annonces, billets et visuels de scène naissent des mêmes paramètres : la marque reste cohérente sans jamais se répéter." },
      { type: 'image', size: 'inset', src: img('oscillo', 'osc_system', '16 / 10', L, "Vue d'ensemble du système d'identité : états du logo, couleurs, typographies") },
      { type: 'screens', desktop: img('screens', 'ui_oscillo_d', '16 / 10', D, 'Site du festival Oscillo, desktop'), mobile: img('screens', 'ui_oscillo_m', '9 / 19.5', M, 'Site du festival Oscillo, mobile') },
      { type: 'palette', colors: [['Bleu signal', '#1b2bff'], ['Volt', '#e6ff3b'], ['Papier', '#f3f1ea'], ['Nuit', '#0a0b1e']] },
    ],
  },
];
