/**
 * Sneaker stage content. Anchor positions are in the normalised model space
 * used by the stage (shoe length = 1, resting on y = 0, toe towards +x,
 * lateral side towards +z). Verified with tools/render debug_hs_* scenes.
 */
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
