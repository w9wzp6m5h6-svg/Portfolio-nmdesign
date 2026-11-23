/**
 * Sneaker stage content.
 *
 * TO USE ANOTHER SHOE (e.g. a licensed Air Jordan 1 Low model):
 *   1. node tools/prepare-sneaker.mjs path/to/your-model.glb   → writes public/models/sneaker-hd.glb + sneaker-lite.glb
 *   2. update `model` below (name, credit, rotation so the toe points to +x)
 *   3. re-place the `hotspots` for the new geometry, or set `hotspots = []` to hide them
 *   Colourway buttons only appear when the file contains KHR_materials_variants.
 *
 * Anchor positions are in the normalised model space used by the stage
 * (shoe length = 1, resting on y = 0, toe towards +x, lateral side towards +z).
 * Verified for the current model with the tools/render debug_hs_* scenes.
 */
export const model = {
  title: 'Knit<br />Runner <em class="serif">/01</em>',
  // VITE_MODEL_FORMAT=json → packed models for hosts that refuse .glb (npm run build:artifact)
  hd: `models/sneaker-hd.${import.meta.env?.VITE_MODEL_FORMAT || 'glb'}`,
  lite: `models/sneaker-lite.${import.meta.env?.VITE_MODEL_FORMAT || 'glb'}`,
  rotation: [0, 0, 0],
  credit: 'Modèle 3D : « Materials Variants Shoe » © 2021 Shopify, CC BY 4.0. Mise en scène, shaders et interactions : Noah Milsztajn.',
};

export const variants = [
  { id: 'street', name: 'Street', c1: '#1c1c1e', c2: '#ff5a5f' },
  { id: 'beach', name: 'Beach', c1: '#d9b8b4', c2: '#3a3a3c' },
  { id: 'midnight', name: 'Midnight', c1: '#1f8fc4', c2: '#163a5a' },
];

export const hotspots = [
  {
    id: 'heel', label: 'Contrefort',
    pos: [-0.46, 0.3, 0.0], normal: [-1, 0.25, 0.25],
    text: 'Une pièce plus rigide enveloppe le talon pour maintenir le pied. Ici, un empiècement sombre avec son propre grain.',
  },
  {
    id: 'tab', label: 'Boucles de chaussage',
    pos: [-0.09, 0.47, 0.0], normal: [-0.3, 1, 0.6],
    text: 'Deux boucles, sur la languette et au talon. Un petit détail, mais c’est la première chose que la main touche.',
  },
  {
    id: 'laces', label: 'Laçage',
    pos: [0.1, 0.31, 0.0], normal: [0.35, 1, 0.3],
    text: 'Des lacets ronds dans des œillets renforcés. Les lacets sont modélisés en volume, pas peints : ils projettent leurs propres ombres.',
  },
  {
    id: 'upper', label: 'Tige en maille',
    pos: [0.34, 0.16, 0.08], normal: [0.7, 0.45, 0.6],
    text: 'Une maille technique : le relief de chaque cellule est porté par la texture, et la lumière accroche chaque rangée.',
  },
  {
    id: 'overlay', label: 'Bandes thermocollées',
    pos: [-0.02, 0.18, 0.16], normal: [0, 0.1, 1],
    text: 'Deux bandes collées structurent le milieu du pied et donnent à la chaussure sa signature graphique.',
  },
  {
    id: 'midsole', label: 'Semelle en mousse',
    pos: [0.0, 0.05, 0.17], normal: [0.1, -0.15, 1],
    text: 'Une semelle intermédiaire en mousse sur toute la longueur, au léger balancier. Mate, un peu rugueuse, gardée claire pour cadrer la tige.',
  },
];
