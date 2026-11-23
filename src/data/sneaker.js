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
  credit: '3D model: “Materials Variants Shoe” © 2021 Shopify, CC BY 4.0. Staging, shaders & interaction by Noah Milsztajn.',
};

export const variants = [
  { id: 'street', name: 'Street', c1: '#1c1c1e', c2: '#ff5a5f' },
  { id: 'beach', name: 'Beach', c1: '#d9b8b4', c2: '#3a3a3c' },
  { id: 'midnight', name: 'Midnight', c1: '#1f8fc4', c2: '#163a5a' },
];

export const hotspots = [
  {
    id: 'heel', label: 'Heel counter',
    pos: [-0.46, 0.3, 0.0], normal: [-1, 0.25, 0.25],
    text: 'A firmer panel wraps the heel to lock the foot in place. Here it is a separate dark overlay with its own grain.',
  },
  {
    id: 'tab', label: 'Pull loops',
    pos: [-0.09, 0.47, 0.0], normal: [-0.3, 1, 0.6],
    text: 'Twin loops on the tongue and the heel. Small details, but they are the first thing your hand touches.',
  },
  {
    id: 'laces', label: 'Lacing',
    pos: [0.1, 0.31, 0.0], normal: [0.35, 1, 0.3],
    text: 'Round laces through reinforced eyelets. The lace path is real geometry, not a texture, so it casts its own shadows.',
  },
  {
    id: 'upper', label: 'Knit upper',
    pos: [0.34, 0.16, 0.08], normal: [0.7, 0.45, 0.6],
    text: 'An engineered mesh: the normal map carries the open-knit cells, so the light picks out every row.',
  },
  {
    id: 'overlay', label: 'Bonded stripes',
    pos: [-0.02, 0.18, 0.16], normal: [0, 0.1, 1],
    text: 'Two bonded overlays add structure across the midfoot and give the shoe its graphic signature.',
  },
  {
    id: 'midsole', label: 'Foam midsole',
    pos: [0.0, 0.05, 0.17], normal: [0.1, -0.15, 1],
    text: 'A full-length foam unit with a gentle rocker. Matte and slightly rough, kept bright to frame the upper.',
  },
];
