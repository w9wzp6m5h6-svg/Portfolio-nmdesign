/**
 * Projets.
 *  - `real: true`  → projet réel (mis en avant, séparé des concepts)
 *  - sinon        → concept personnel ou exploration, jamais présenté comme une commande client
 *  - `selected`   → apparaît dans la sélection de l'accueil (toute la liste est sur la page Projets)
 *  - `tags`       → filtres de la page Projets : real, web, 3d, identity
 *  - `card`       → visuel des vignettes (écran du site) ; à défaut, `cover`
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

/** Vignette du showcase (image d'un projet, sans légende : décorative à côté du visuel principal) */
const t = (project, name, widths = L) => img(project, name, '16 / 10', widths, '');

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
    title: 'L’Empreinte',
    subtitle: 'La galerie numérique de Cynthia Rimo, artiste permanente de L’Empreinte Art Gallery à Valbonne',
    category: 'Art gallery · Site réel',
    status: 'Projet réel',
    layout: 'feature',
    heroPlain: true, // en-tête typographique : le vrai site suit juste en dessous, en direct
    // le vrai site, livré tel quel (fichier d'origine non modifié), ouvert dans un cadre isolé
    site: 'lempreinte/index.html',
    cover: img('rimo', 'rimo_d1', '16 / 10', L, 'Accueil du site de Cynthia Rimo : une œuvre pop art plein écran et le nom de l’artiste'),
    card: img('rimo', 'rimo_salle', '16 / 10', L, 'La salle virtuelle du site : les œuvres de Cynthia Rimo accrochées en perspective'),
    coverPos: '50% 82%', // la bobine de l'accueil montre le nom de l'artiste en bas de l'image
    showcase: { layout: 'live', thumbs: [t('rimo', 'rimo_salle'), t('rimo', 'rimo_fiche'), t('rimo', 'rimo_chezsoi'), t('rimo', 'rimo_vernissage')] },
    theme: { bg: '#f6f3ee', fg: '#141414', muted: '#6f6a63', line: 'rgb(20 20 20 / 0.14)', accent: '#d01d2b', title: 'gallery', light: true },
    meta: [
      ['Type', 'Projet réel'],
      ['Pour', 'Cynthia Rimo — L’Empreinte Art Gallery, Valbonne'],
      ['Ma contribution', 'Direction artistique, design et conception de l’expérience'],
      ['Contenu', '16 œuvres, fiches, salle virtuelle, page Vernissage'],
    ],
    lead: "Une galerie doit montrer des œuvres, mais surtout donner envie de les acquérir. Pour Cynthia Rimo, artiste permanente de L’Empreinte à Valbonne, j'ai conçu une galerie numérique pensée comme une visite : une salle où l'on passe d'une œuvre à l'autre, des fiches qui disent tout, et un chemin direct vers l'artiste.",
    blocks: [
      { type: 'site', src: 'lempreinte/index.html', title: 'Le site, en direct', text: 'Le vrai site, chargé à la demande dans un cadre isolé. Parcourez la salle, ouvrez une fiche, essayez la loupe ou la mise en situation.', poster: img('rimo', 'rimo_d1', '16 / 10', L, 'Accueil du site de Cynthia Rimo') },
      { type: 'statement', text: 'Le site devait vendre des œuvres, pas seulement présenter une artiste.' },
      { type: 'image', size: 'full', src: img('rimo', 'rimo_salle', '16 / 10', L, 'La salle virtuelle : les œuvres accrochées en perspective'), caption: 'La salle : les seize œuvres accrochées en perspective. On passe de l’une à l’autre au clic, aux flèches ou en faisant glisser.' },
      { type: 'text', kicker: 'Le problème', title: 'De la vitrine au parcours.', body: "Sur beaucoup de sites de galerie, les œuvres défilent comme un catalogue : petites, toutes identiques, sans format ni contexte. Or un tableau s'achète quand on peut s'en approcher, comprendre ses dimensions et l'imaginer chez soi. L'enjeu : recréer ce rapport physique à l'écran, puis rendre la prise de contact immédiate." },
      { type: 'pair', items: [img('rimo', 'rimo_fiche', '16 / 10', L, 'Fiche de l’œuvre Pin Up : technique, dimensions, prix, disponibilité'), img('rimo', 'rimo_loupe', '16 / 10', L, 'La loupe sur l’œuvre Blanche Neige')], caption: 'Chaque œuvre a sa fiche : technique, format, prix, disponibilité et le mot de l’artiste. La loupe permet de lire la matière : timbres, bande dessinée, résine.' },
      { type: 'text', kicker: 'Direction artistique', title: 'Laisser la place à la peinture.', body: "Les œuvres de Cynthia Rimo sont saturées, graphiques, pleines de matière. L'interface fait l'inverse : un fond crème de mur d'exposition, une typographie condensée très affirmée pour les titres, un italique élégant pour la signature, et un seul rouge, celui des actions. Tout le reste s'efface devant les tableaux." },
      { type: 'image', size: 'inset', src: img('rimo', 'rimo_chezsoi', '16 / 10', L, 'Mise en situation : Blanche Neige au-dessus d’un canapé, mur vert sauge'), caption: '« Chez vous » : l’œuvre à l’échelle, au-dessus d’un canapé de 210 cm, sur cinq couleurs de mur.' },
      { type: 'text', kicker: 'Expérience', title: 'Une visite, pas un catalogue.', body: "On entre dans une salle, pas dans une grille : les œuvres sont accrochées en perspective et l'on passe de l'une à l'autre comme on longe un mur. Chaque tableau ouvre sa fiche ; la loupe et la mise en situation répondent aux deux questions d'un acheteur : à quoi ressemble la matière, et quelle place l'œuvre prendra chez soi. La sélection et le message WhatsApp prérempli raccourcissent le chemin jusqu'à l'artiste." },
      {
        type: 'intentions',
        title: 'Ce que le site permet',
        // statuts vérifiés dans le fichier livré, fonction par fonction, dans un navigateur
        items: [
          ['Salle d’exposition virtuelle', 'Les seize œuvres en perspective, parcourues au clic, aux flèches ou en glissant.', 'intégré'],
          ['Fiche de chaque œuvre', 'Technique, dimensions, prix, disponibilité et le texte de l’artiste.', 'intégré'],
          ['Loupe', 'S’approcher de la matière, au survol ou au doigt.', 'intégré'],
          ['Mise en situation « chez vous »', 'L’œuvre à l’échelle au-dessus d’un canapé, sur cinq couleurs de mur.', 'intégré'],
          ['Filtres', 'Par prix, par technique et par format.', 'intégré'],
          ['Ma sélection', 'Mettre des œuvres de côté, voir le total, l’envoyer en un geste.', 'intégré'],
          ['Acquérir une œuvre', 'Un message WhatsApp prérempli avec le nom de l’œuvre.', 'intégré'],
          ['Vernissages & événements', 'Une page dédiée, en quatre chapitres photographiques.', 'intégré'],
          ['Visiter la galerie', 'L’adresse à Valbonne, l’itinéraire et les contacts directs.', 'intégré'],
        ],
      },
      { type: 'pair', items: [img('rimo', 'rimo_filtres', '16 / 10', L, 'Filtres : trois œuvres sur seize avec la technique Timbres'), img('rimo', 'rimo_selection', '16 / 10', L, 'Ma sélection : trois œuvres, le total et l’envoi par WhatsApp')], caption: 'Trouver son œuvre par prix, technique ou format, puis envoyer sa sélection à la galerie.' },
      { type: 'image', size: 'full', src: img('rimo', 'rimo_vernissage', '16 / 10', L, 'La page Vernissage : reportage photo à la galerie'), caption: 'La page Vernissage : un reportage en quatre chapitres, l’atmosphère, les œuvres, les rencontres, les souvenirs.' },
      { type: 'screens', desktop: img('rimo', 'rimo_d4', '16 / 10', L, 'Index des œuvres, version ordinateur'), mobile: img('rimo', 'rimo_m_salle', '9 / 19.5', M, 'La galerie sur téléphone'), caption: 'Sur téléphone, la galerie se recompose : l’œuvre d’abord, le parcours ensuite.' },
      { type: 'chapters', title: 'Ma contribution', items: [
        ['Direction artistique', "Univers visuel, palette, typographie, rythme et ton de l'interface."],
        ['Expérience numérique', 'La salle, les fiches, la loupe, la mise en situation et le chemin vers le contact.'],
        ['Design orienté vente', 'Les informations de décision (format, prix, disponibilité) au bon moment du parcours, et l’achat en un message.'],
      ] },
      { type: 'palette', colors: [['Mur', '#f6f3ee'], ['Sable', '#eee9e1'], ['Encre', '#141414'], ['Rouge', '#d01d2b']] },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Concepts personnels (jamais présentés comme des commandes client)    */
  /* ------------------------------------------------------------------ */
  {
    slug: 'elan',
    tags: ['web', '3d', 'identity'],
    selected: true,
    num: '02',
    title: 'ÉLAN',
    subtitle: 'Marque de boisson énergisante et site produit, canette en 3D temps réel',
    category: 'Product design · 3D temps réel',
    status: 'Concept — 2026',
    layout: 'g',
    hero: img('elan', 'elan_duo', '16 / 10', L, 'Canette ÉLAN Myrtille cobalt sur le fond orange de la marque'),
    cover: img('elan', 'elan_duo', '16 / 10', L, 'Canette ÉLAN Myrtille cobalt sur le fond orange de la marque'),
    card: img('screens', 'ui_elan_d', '16 / 10', D, 'Site ÉLAN (concept) : la canette 3D au centre, le nom de la marque en fond'),
    coverPos: '50% 45%',
    showcase: { layout: 'space', thumbs: [t('elan', 'elan_duo'), t('elan', 'elan_lineup'), t('elan', 'elan_can_myrtille', P)] },
    theme: { bg: '#ff5a1f', fg: '#0b0d1f', muted: '#3d1406', line: 'rgb(11 13 31 / 0.18)', accent: '#1e3bff', title: 'can', light: true },
    meta: [
      ['Type', 'Concept personnel'],
      ['Année', '2026'],
      ['Disciplines', 'Identité, packaging, 3D temps réel, site produit'],
      ['Technique', 'Three.js, canette entièrement procédurale'],
    ],
    lead: "Une boisson énergisante qui ne crie pas. Pour ce concept, j'ai créé la marque, la canette et son site : une canette en 3D temps réel qu'on fait tourner, qu'on incline, dont on change la saveur, au milieu d'une interface volontairement calme.",
    blocks: [
      { type: 'can', title: 'La canette, en vrai', text: 'Faites-la tourner à la souris ou au doigt, inclinez-la, zoomez. Changez de saveur : l’étiquette se remplit de bas en haut.' },
      { type: 'statement', text: 'Le produit est la seule couleur de la page.' },
      { type: 'text', kicker: 'Identité', title: 'Une trajectoire, pas un animal.', body: "Le rayon des boissons énergisantes est saturé de taureaux, de griffes et de flammes. ÉLAN prend le contre-pied : un arc bleu cobalt qui monte comme une courbe d'effort, un nom posé à la verticale, une paire orange électrique et bleu cobalt qui s'inverse selon la saveur. Quatre déclinaisons, une seule forme." },
      { type: 'image', size: 'wide', src: img('elan', 'elan_lineup', '16 / 10', L, 'Les quatre saveurs ÉLAN alignées : orange sanguine, myrtille, yuzu, cassis') },
      { type: 'pair', items: [img('elan', 'elan_detail_top', '1 / 1', P, 'Le dessus de la canette : col, sertissage et languette en aluminium'), img('elan', 'elan_detail_back', '4 / 5', P, 'Le côté de la canette : composition, valeurs nutritionnelles et mentions')], caption: 'Rendus fixes produits par la même scène 3D que le site : ni montage, ni photographie.' },
      { type: 'text', kicker: '3D temps réel', title: 'Aucun fichier 3D à télécharger.', body: "La canette est construite en code avec Three.js : profil tourné pour le fond embouti et le col, sertissage, languette extrudée. L'étiquette est dessinée dans un canvas, aux proportions exactes de la surface, pour chaque saveur. Un studio à bandes verticales donne les longs reflets de l'aluminium. Hors écran, la scène s'arrête ; sur téléphone, la résolution baisse." },
      { type: 'intentions', title: 'Ce que la canette sait faire', items: [
        ['Rotation libre et inertie', 'Souris, doigt ou clavier ; elle continue un peu sur sa lancée.', 'livré'],
        ['Inclinaison et vues', 'Face, profil, dos, dessus : la caméra se place en douceur.', 'livré'],
        ['Zoom', 'Boutons, pincement, Ctrl + molette, double clic.', 'livré'],
        ['Quatre saveurs', "L'étiquette se remplit de bas en haut pendant que la canette fait un tour.", 'livré'],
        ['Entrée en scène', 'La canette monte, tourne, se pose, puis flotte doucement.', 'livré'],
        ['Mouvement réduit', 'Aucune animation automatique quand le système le demande.', 'livré'],
      ] },
      { type: 'screens', desktop: img('screens', 'ui_elan_d', '16 / 10', D, 'Site ÉLAN, version ordinateur'), mobile: img('screens', 'ui_elan_m', '9 / 19.5', M, 'Site ÉLAN, version téléphone'), caption: 'Le site de la marque : la canette au centre, le nom derrière, la page qui prend la teinte de la saveur.' },
      { type: 'concept', href: 'concepts/elan/', title: 'Visiter le site ÉLAN', text: 'Le site complet du concept : hero en 3D, gamme, composition, packaging. Il s’ouvre dans cette fenêtre, avec un retour au portfolio.' },
      { type: 'type', families: [['Space Grotesk', 'Logotype, titres, chiffres', 'ÉLAN'], ['Inter', 'Composition, mentions, interface', 'Aa']] },
      { type: 'palette', colors: [['Orange électrique', '#ff5a1f'], ['Bleu cobalt', '#1e3bff'], ['Yuzu', '#d8f23e'], ['Cassis', '#7a3cff']] },
    ],
  },

  {
    slug: 'portant',
    tags: ['web', 'identity'],
    selected: true,
    num: '03',
    title: 'PORTANT',
    subtitle: 'Boutique de vêtements où l’on parcourt la collection comme un portant de showroom',
    category: 'Mode · E-commerce · Interaction',
    status: 'Concept — 2026',
    layout: 'h',
    cover: img('portant', 'portant_rack', '16 / 10', L, 'Le portant PORTANT : sept pièces sur leurs cintres, le pull rouille au premier plan'),
    card: img('screens', 'ui_portant_d', '16 / 10', D, 'Site PORTANT (concept) : le portant en hero, la pièce choisie au centre'),
    hero: img('portant', 'portant_rack', '16 / 10', L, 'Le portant PORTANT : sept pièces sur leurs cintres'),
    coverPos: '50% 42%',
    showcase: { layout: 'cinema', thumbs: [t('portant', 'portant_rack'), t('screens', 'ui_portant_d', D), t('screens', 'ui_portant_m', M)] },
    theme: { bg: '#efe9df', fg: '#16140f', muted: '#5f594f', line: 'rgb(22 20 15 / 0.14)', accent: '#a4522f', title: 'fashion', light: true },
    meta: [
      ['Type', 'Concept personnel'],
      ['Année', '2026'],
      ['Disciplines', 'Direction artistique, UX e-commerce, interaction'],
      ['Visuels', 'Vêtements dessinés en code (illustrations)'],
    ],
    lead: "Une boutique en ligne sans grille de vignettes. PORTANT présente sa collection comme un portant de showroom : on pousse les cintres, la pièce choisie avance, son nom, son prix et ses tailles apparaissent. Le geste est physique ; l'interface reste presque invisible.",
    blocks: [
      { type: 'rack', title: 'Le portant, en vrai', text: 'Glissez la tringle à la souris ou au doigt, ou utilisez les flèches. Les cintres se balancent, la pièce choisie avance.' },
      { type: 'statement', text: 'Choisir un vêtement, c’est un geste. Pas un clic sur une vignette.' },
      { type: 'text', kicker: 'Interaction', title: 'Une petite simulation, pas un carrousel.', body: "La tringle a une position continue, une inertie au lâcher et un ressort qui pose la pièce la plus proche au centre. Chaque cintre est un pendule amorti, entraîné par l'accélération de sa propre position ; le tissu suit son cintre avec un léger retard. Loin du centre, les pièces se tassent et pivotent, comme sur un vrai portant." },
      { type: 'image', size: 'wide', src: img('portant', 'portant_rack', '16 / 10', L, 'Le portant : sept pièces, le pull rouille au centre') },
      { type: 'pair', items: [img('portant/garments', 'coat', '3 / 5', [480, 900], 'Le manteau droit en laine camel'), img('portant/garments', 'dress', '3 / 5', [480, 900], 'La robe nuisette en satin noir')], caption: 'Les vêtements sont des illustrations dessinées en code (SVG paramétrique) : volume, plis de gravité, trame du tissu, coutures. Pas de photographies.' },
      { type: 'text', kicker: 'Direction artistique', title: 'Crème, encre, capitales.', body: "Un fond crème qui laisse la couleur aux vêtements, des capitales éditoriales en Space Grotesk, l'interface en Inter. Les prix sont affichés partout, les tailles épuisées barrées, le sac reste à portée. Rien ne clignote." },
      { type: 'intentions', title: 'Ce que le portant sait faire', items: [
        ['Glisser la tringle', 'Souris, doigt, geste horizontal du pavé tactile.', 'livré'],
        ['Inertie et pose', 'La tringle continue sur sa lancée puis pose une pièce au centre.', 'livré'],
        ['Balancement', "Chaque cintre réagit à l'accélération ; le tissu traîne un peu.", 'livré'],
        ['Pièce au premier plan', 'Nom, prix, description, matière, tailles et bouton.', 'livré'],
        ['Tailles et sac', 'Taille obligatoire, tailles épuisées barrées, sac en mémoire.', 'livré'],
        ['Clavier', 'Flèches, Début, Fin, Entrée.', 'livré'],
      ] },
      { type: 'screens', desktop: img('screens', 'ui_portant_d', '16 / 10', D, 'Site PORTANT, version ordinateur'), mobile: img('screens', 'ui_portant_m', '9 / 19.5', M, 'Site PORTANT, version téléphone'), caption: 'Le portant en hero ; plus bas, deux pièces vues de près, la maison, et l’index de la collection.' },
      { type: 'concept', href: 'concepts/portant/', title: 'Visiter la boutique PORTANT', text: 'Le site complet du concept : le portant, la maison, deux pièces en détail et la collection. Il s’ouvre dans cette fenêtre, avec un retour au portfolio.' },
      { type: 'type', families: [['Space Grotesk', 'Nom, titres, prix', 'PORTANT'], ['Inter', 'Descriptions, tailles, interface', 'Aa']] },
      { type: 'palette', colors: [['Crème', '#efe9df'], ['Encre', '#16140f'], ['Camel', '#b58b5e'], ['Rouille', '#a4522f']] },
    ],
  },

  {
    slug: 'stride',
    tags: ['web', '3d'], // filtres de la page Projets
    selected: true, // affiché sur l'accueil
    num: '04',
    title: 'Stride',
    subtitle: "Expérience de lancement d'une chaussure de running en maille",
    category: 'Expérience produit · WebGL',
    status: 'Concept — 2026',
    layout: 'a',
    cover: img('stride', 'shoe_cover', '16 / 10', L, 'Chaussure noire en maille flottant au-dessus de son ombre'),
    card: img('screens', 'ui_stride_d', '16 / 10', D, "Site Stride (concept) : page de lancement de la chaussure, version ordinateur"), // vignette des grilles : le site, pas seulement l'objet
    coverPos: '50% 55%',
    showcase: { layout: 'object', thumbs: [t('stride', 'shoe_cover'), t('stride', 'shoe_beach'), t('stride', 'shoe_midnight'), t('stride', 'shoe_profile')] },
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
    num: '05',
    title: 'Vanta',
    subtitle: "Un configurateur cinématographique pour un grand tourisme concept",
    category: 'Automobile · Interface 3D',
    status: 'Concept — 2026',
    layout: 'b',
    cover: img('vanta', 'car_wheel', '4 / 5', P, "Roue et passage de roue d'une voiture concept graphite"),
    card: img('screens', 'ui_vanta_d', '16 / 10', D, "Site Vanta (concept) : configurateur, chapitre peinture, version ordinateur"), // vignette des grilles : le site, pas seulement l'objet
    coverPos: '35% 50%',
    hero: img('vanta', 'car_cover', '16 / 10', L, 'Voiture concept graphite dans un studio sombre'),
    showcase: { layout: 'cinema', thumbs: [t('vanta', 'car_side'), t('vanta', 'car_front'), t('vanta', 'car_top'), t('vanta', 'car_cover')] },
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
    showcase: { layout: 'art', thumbs: [t('afterimage', 'art_cover'), t('afterimage', 'art_a', P), t('afterimage', 'art_b', P), t('afterimage', 'art_c', P)] },
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
    selected: true, // affiché sur l'accueil
    num: '07',
    title: 'Oscillo',
    subtitle: "Identité et expérience digitale d'un festival sonore imaginaire",
    category: 'Expérience de marque · Identité',
    status: 'Concept — 2026',
    layout: 'f',
    cover: img('oscillo', 'osc_cover', '16 / 10', L, "Logo du festival Oscillo modulé par une onde"),
    card: img('screens', 'ui_oscillo_d', '16 / 10', D, "Site du festival Oscillo (concept) : page d'accueil, version ordinateur"), // vignette des grilles : le site, pas seulement l'objet
    coverPos: '50% 50%',
    live: 'oscillo',
    showcase: { layout: 'signal', thumbs: [t('oscillo', 'osc_cover'), t('oscillo', 'osc_posters'), t('oscillo', 'osc_system')] },
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
