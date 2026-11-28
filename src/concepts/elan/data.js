/**
 * ÉLAN — marque fictive de boisson énergisante (concept NM Design, aucun produit réel).
 * Une canette slim de 250 ml, quatre saveurs. La paire orange électrique / bleu cobalt
 * est la signature : chaque saveur la réinterprète.
 */
export const VARIANTS = [
  {
    id: 'sanguine',
    name: 'Orange sanguine',
    short: 'Sanguine',
    body: '#ff5a1f', // fond de la canette
    accent: '#1e3bff', // trajectoire, bandeau
    ink: '#0a1240', // textes fins
    paper: '#fff3ea', // logotype
    page: '#f6e7dc', // teinte de la page quand la saveur est choisie
    notes: 'Orange sanguine, gingembre frais, une pointe de sel',
    mood: "L'originale. Franche, acidulée, sans sucre ajouté.",
    caffeine: 80, sugar: 0, kcal: 7,
    juice: "jus d'orange sanguine",
  },
  {
    id: 'myrtille',
    name: 'Myrtille cobalt',
    short: 'Myrtille',
    body: '#1e3bff',
    accent: '#ff5a1f',
    ink: '#e8ecff',
    paper: '#ffffff',
    page: '#e2e5f4',
    dark: true, // couleur de fond sombre : textes clairs par-dessus
    notes: 'Myrtille sauvage, citron, poivre de Timut',
    mood: 'La nocturne. Profonde, poivrée, à boire frais.',
    caffeine: 80, sugar: 0, kcal: 9,
    juice: 'jus de myrtille',
  },
  {
    id: 'yuzu',
    name: 'Yuzu éclair',
    short: 'Yuzu',
    body: '#d8f23e',
    accent: '#1e3bff',
    ink: '#0a1240',
    paper: '#0a1240',
    page: '#eef0d8',
    notes: 'Yuzu, citron vert, feuille de shiso',
    mood: 'La vive. Zeste, tension, effet immédiat.',
    caffeine: 80, sugar: 0, kcal: 6,
    juice: 'jus de yuzu',
  },
  {
    id: 'cassis',
    name: 'Cassis électrique',
    short: 'Cassis',
    body: '#7a3cff',
    accent: '#ff5a1f',
    ink: '#f3eeff',
    paper: '#ffffff',
    page: '#e9e2f5',
    dark: true,
    notes: 'Cassis, framboise, hibiscus',
    mood: 'La juteuse. Ronde, fruitée, un peu acide.',
    caffeine: 80, sugar: 0, kcal: 8,
    juice: 'jus de cassis',
  },
];

export const variantById = (id) => VARIANTS.find((v) => v.id === id) || VARIANTS[0];

/** Composition commune (concept) — affichée sur la canette et sur le site. */
export const INGREDIENTS = [
  ['Guarana', 'La caféine vient d’une graine, pas d’un laboratoire : 80 mg par canette, libérés progressivement.'],
  ['Jus de fruits', 'Six pour cent de vrai jus pressé. Assez pour le goût, pas assez pour le sucre.'],
  ['Gingembre & épices', 'Ce qui pique au fond de la gorge. Différent pour chaque saveur.'],
  ['Vitamines B3, B6, B12', 'Le minimum utile, rien de décoratif.'],
  ['Eau de source gazéifiée', 'Fines bulles, peu de sodium. Le reste de la canette.'],
];
