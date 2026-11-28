/**
 * PORTANT — boutique fictive de vêtements (concept NM Design, rien n'est vendu).
 * Collection 01. Les visuels sont des illustrations ombrées produites par
 * tools/garments (pas des photographies).
 */
const TOP = ['XS', 'S', 'M', 'L', 'XL'];

export const PIECES = [
  {
    id: 'coat', name: 'Manteau droit', kind: 'Manteau', price: 420, color: 'Camel',
    matter: 'Laine vierge et cachemire 80/20',
    desc: 'Coupe droite, épaules naturelles, longueur sous le genou. Doublure en viscose, boutons en corozo.',
    sizes: TOP, out: ['XS'], hanger: 'wire',
  },
  {
    id: 'shirt', name: 'Chemise ample', kind: 'Chemise', price: 120, color: 'Écru',
    matter: 'Popeline de coton égyptien',
    desc: 'Col pointu souple, pans arrondis, poignets à un bouton. Se porte rentrée ou ouverte sur un t-shirt.',
    sizes: TOP, out: [], hanger: 'wire',
  },
  {
    id: 'sweater', name: 'Pull col rond', kind: 'Maille', price: 165, color: 'Rouille',
    matter: 'Mérinos extra-fin, jauge 12',
    desc: 'Épaules tombantes, côtes larges au bas et aux poignets. Chaud sans épaisseur.',
    sizes: TOP, out: ['XL'], hanger: 'wire',
  },
  {
    id: 'jacket', name: 'Veste de travail', kind: 'Veste', price: 240, color: 'Indigo',
    matter: 'Sergé de coton, teinture indigo',
    desc: 'Trois poches plaquées, surpiqûres ficelle, boutons en métal brossé. Elle s’éclaircit avec le temps.',
    sizes: TOP, out: ['XS', 'S'], hanger: 'wire',
  },
  {
    id: 'dress', name: 'Robe nuisette', kind: 'Robe', price: 260, color: 'Noir',
    matter: 'Satin de soie lavée',
    desc: 'Coupée dans le biais, fines bretelles réglables, longueur genou. Le tombé fait tout.',
    sizes: ['XS', 'S', 'M', 'L'], out: ['L'], hanger: 'wire',
  },
  {
    id: 'trousers', name: 'Pantalon à pinces', kind: 'Pantalon', price: 210, color: 'Pierre',
    matter: 'Laine froide',
    desc: 'Taille haute, double pince, jambe large et droite, ourlet de 4 cm.',
    sizes: ['36', '38', '40', '42', '44'], out: ['44'], hanger: 'clip',
  },
  {
    id: 'tee', name: 'T-shirt épais', kind: 'Jersey', price: 55, color: 'Gris chiné',
    matter: 'Jersey de coton 240 g',
    desc: 'Col côtelé, coupe carrée, coutures doubles. Le basique qui tient sa forme.',
    sizes: TOP, out: [], hanger: 'wire',
  },
];

export const euro = (n) => `${n} €`;
