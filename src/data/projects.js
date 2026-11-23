/**
 * Selected works. Every project here is a self-initiated concept or a
 * personal exploration — never presented as client work.
 *
 * Each project has its own theme (colours, title treatment) and its own
 * sequence of blocks, so no two case studies share the same layout.
 */

import { asset } from '../core/asset.js';

const L = [800, 1400, 2200]; // landscape renders
const P = [800, 1400];       // portrait renders
const M = [800];             // mobile screen captures
const D = [800, 1400];       // desktop screen captures

/** Responsive image descriptor */
const img = (project, name, ratio, widths = L, alt = '') => ({
  src: asset(`media/works/${project}/${name}-${widths[Math.min(1, widths.length - 1)]}.webp`),
  srcset: widths.map((w) => `${asset(`media/works/${project}/${name}-${w}.webp`)} ${w}w`).join(', '),
  ratio,
  alt,
});

export const projects = [
  {
    slug: 'stride',
    num: '01',
    title: 'Stride',
    subtitle: 'A launch experience for a knit running shoe',
    category: 'Product Experience · WebGL',
    status: 'Concept — 2026',
    layout: 'a',
    cover: img('stride', 'shoe_cover', '16 / 10', L, 'Black knit running shoe floating above its shadow'),
    coverPos: '50% 55%',
    theme: { bg: '#0c0c0d', fg: '#edebe5', muted: '#8f949b', line: 'rgb(237 235 229 / 0.14)', accent: '#ff5a4e', title: 'display' },
    meta: [
      ['Type', 'Self-initiated concept'],
      ['Year', '2026'],
      ['Disciplines', 'Art direction, UI, WebGL, Motion'],
      ['Live', 'Section 02 of this site'],
    ],
    lead: 'What if a product page felt like holding the product? Stride is a launch experience built around one object: a knit runner you can turn, inspect and re-colour in real time, paced like a campaign film.',
    blocks: [
      { type: 'text', kicker: 'The brief I set myself', title: 'One object, one stage.', body: 'Sneaker pages usually stack photos in a grid. I wanted the opposite: a single object, a single stage, and an interface that steps aside. Every control answers a real buyer question: what does the heel look like, what is the upper made of, how does it look in another colour?' },
      { type: 'pair', items: [img('stride', 'shoe_detail', '4 / 5', P, 'Close-up of the laces and eyelets'), img('stride', 'shoe_profile', '16 / 10', L, 'Side profile of the shoe')], caption: 'Studio renders. Every frame uses the same light rig as the live 3D stage, so photography and real time match.' },
      { type: 'screens', desktop: img('screens', 'ui_stride_d', '16 / 10', D, 'Stride landing page, desktop'), mobile: img('screens', 'ui_stride_m', '9 / 19.5', M, 'Stride landing page, mobile'), caption: 'Landing: the product holds the centre; type and navigation stay at the edges.' },
      { type: 'statement', text: 'Three colourways, one geometry. Switching is a shader sweep, not a page reload.' },
      { type: 'pair', flip: true, items: [img('stride', 'shoe_beach', '16 / 10', L, 'Shoe in the Beach colourway'), img('stride', 'shoe_midnight', '16 / 10', L, 'Shoe in the Midnight colourway')] },
      { type: 'chapters', title: 'Interaction model', items: [
        ['Turn', 'Drag to rotate with inertia. On touch, horizontal swipes turn the shoe and vertical swipes keep scrolling the page.'],
        ['Inspect', 'Five anchored hotspots: the camera flies to each detail and the panel explains it.'],
        ['Re-colour', 'Colourways swap through a scan line that sweeps across the upper.'],
        ['X-Ray', 'A fresnel and wireframe view that reveals the construction of the mesh.'],
      ] },
      { type: 'live', module: 'object', title: 'Try the live object', text: 'The interactive stage from this concept runs on this site.' },
      { type: 'palette', colors: [['Ink', '#0c0c0d'], ['Graphite', '#1b1d20'], ['Bone', '#edebe5'], ['Coral', '#ff5a4e']] },
    ],
  },

  {
    slug: 'vanta',
    num: '02',
    title: 'Vanta',
    subtitle: 'A cinematic configurator for a concept grand tourer',
    category: 'Automotive · 3D Interface',
    status: 'Concept — 2026',
    layout: 'b',
    cover: img('vanta', 'car_wheel', '4 / 5', P, 'Wheel and arch of a graphite concept car'),
    coverPos: '35% 50%',
    hero: img('vanta', 'car_cover', '16 / 10', L, 'Graphite concept car in a dark studio'),
    theme: { bg: '#080708', fg: '#f1ece8', muted: '#958a86', line: 'rgb(241 236 232 / 0.12)', accent: '#d63a2c', title: 'display' },
    meta: [
      ['Type', 'Self-initiated concept'],
      ['Year', '2026'],
      ['Disciplines', 'UX, Interface, 3D direction'],
      ['Platform', 'Web, desktop first'],
    ],
    lead: 'Most configurators look like a spreadsheet with a car attached. Vanta treats configuration as a film: the camera moves between chapters, and the interface only shows what the current shot needs.',
    blocks: [
      { type: 'image', size: 'full', src: img('vanta', 'car_side', '16 / 9', L, 'Concept car in Carmine Candy, side profile') },
      { type: 'chapters', title: 'Four chapters, four camera moves', items: [
        ['01 — Stance', 'A low three-quarter view. The car is introduced before any choice is asked of you.'],
        ['02 — Paint', 'The camera pulls back to the side profile so the finish can catch the strip lights.'],
        ['03 — Wheels', 'A tight crop on the arch. Rim and calliper options appear in the free space.'],
        ['04 — Cabin', 'A top-down view through the glass roof, with the interior trim laid out like a plan.'],
      ] },
      { type: 'pair', items: [img('vanta', 'car_front', '16 / 10', L, 'Front view in Carmine Candy'), img('vanta', 'car_top', '16 / 10', L, 'Three-quarter top view in graphite')], caption: 'Paint is treated as a material, not a swatch: each finish has its own clearcoat and flake response.' },
      { type: 'screens', desktop: img('screens', 'ui_vanta_d', '16 / 10', D, 'Vanta configurator, paint chapter'), mobile: img('screens', 'ui_vanta_m', '9 / 19.5', M, 'Vanta configurator on mobile'), caption: 'Chapter 02, paint. The UI names the finish; the render proves it.' },
      { type: 'statement', text: 'The interface should feel like the dashboard, not the brochure.' },
      { type: 'palette', colors: [['Void', '#080708'], ['Carmine', '#9d1f17'], ['Pearl', '#d9d6d2'], ['Graphite', '#2b2c2f']] },
    ],
  },

  {
    slug: 'opale',
    num: '03',
    title: 'Maison Opale',
    subtitle: 'Editorial e-commerce for a fictional eyewear house',
    category: 'Luxury · E-commerce',
    status: 'Concept — 2026',
    layout: 'c',
    cover: img('opale', 'glasses_cover', '16 / 10', L, 'Aviator sunglasses on warm paper with a long shadow'),
    coverPos: '50% 50%',
    theme: { bg: '#efe9df', fg: '#1d1a16', muted: '#7d7466', line: 'rgb(29 26 22 / 0.14)', accent: '#9c7a44', title: 'serif', light: true },
    meta: [
      ['Type', 'Self-initiated concept'],
      ['Year', '2026'],
      ['Disciplines', 'Brand, Art direction, E-commerce UX'],
      ['Tone', 'Slow luxury'],
    ],
    lead: 'A slow-luxury storefront: few products, generous light, and typography that does the selling. It reads like a printed lookbook and checks out like a modern store.',
    blocks: [
      { type: 'statement', text: 'Luxury is the confidence to show less.' },
      { type: 'image', size: 'inset', src: img('opale', 'glasses_front', '16 / 10', L, 'Aviators, front view') },
      { type: 'text', kicker: 'Direction', title: 'Paper, sun and a serif.', body: 'Warm paper tones, a high-contrast serif set large, and the long hard-light shadows of summer campaigns. Product images are 3D renders, so every frame keeps exactly the same sun angle and the collection reads as one series.' },
      { type: 'screens', desktop: img('screens', 'ui_opale_d', '16 / 10', D, 'Maison Opale product page, desktop'), mobile: img('screens', 'ui_opale_m', '9 / 19.5', M, 'Maison Opale product page, mobile'), caption: 'Product page. One frame, one price and one action; details unfold on demand.' },
      { type: 'image', size: 'wide', src: img('opale', 'glasses_top', '16 / 10', L, 'Aviators from above with hard shadow') },
      { type: 'type', families: [['Instrument Serif', 'Display, italic accents', 'Aa'], ['Inter Tight', 'Interface and body copy', 'Aa']] },
      { type: 'palette', colors: [['Paper', '#efe9df'], ['Sand', '#d8cfc1'], ['Ink', '#1d1a16'], ['Brass', '#9c7a44']] },
    ],
  },

  {
    slug: 'rooms',
    num: '04',
    title: 'Quiet Rooms',
    subtitle: 'Website for an interior & architecture studio',
    category: 'Architecture · Interior',
    status: 'Concept — 2026',
    layout: 'd',
    cover: img('rooms', 'interior_chair', '4 / 5', P, 'Orange velvet lounge chair in a sunlit room'),
    coverPos: '50% 60%',
    hero: img('rooms', 'interior_cover', '16 / 10', L, 'Sunlit room with a green velvet chair, a pouf and a lamp'),
    theme: { bg: '#e4ddd3', fg: '#23201c', muted: '#776f64', line: 'rgb(35 32 28 / 0.14)', accent: '#b0532d', title: 'light', light: true },
    meta: [
      ['Type', 'Self-initiated concept'],
      ['Year', '2026'],
      ['Disciplines', 'Web design, Motion, 3D staging'],
      ['Pace', 'Slow'],
    ],
    lead: 'A site for a fictional studio that designs calm spaces. It follows the rules of the rooms: one object per frame, light as the only decoration, and transitions as slow as a passing shadow.',
    blocks: [
      { type: 'statement', text: 'Light is the material.' },
      { type: 'pair', items: [img('rooms', 'interior_chair', '4 / 5', P, 'Lounge chair in Mango velvet'), img('rooms', 'interior_pouf', '16 / 10', L, 'Pleated silk pouf and glass lamp')], caption: 'Rooms staged in real-time 3D: a window, a single sun, and furniture scans.' },
      { type: 'text', kicker: 'Motion', title: 'Transitions as slow as a shadow.', body: 'Pages cross-fade along the direction of the light. Nothing bounces. The scroll slows down over images and speeds up over text, so the reader stays in a room longer than in a paragraph.' },
      { type: 'screens', desktop: img('screens', 'ui_rooms_d', '16 / 10', D, 'Quiet Rooms home page, desktop'), mobile: img('screens', 'ui_rooms_m', '9 / 19.5', M, 'Quiet Rooms home page, mobile') },
      { type: 'palette', colors: [['Lime plaster', '#e4ddd3'], ['Stone', '#bdb4a7'], ['Umber', '#23201c'], ['Terracotta', '#b0532d']] },
    ],
  },

  {
    slug: 'afterimage',
    num: '05',
    title: 'Afterimage',
    subtitle: 'Generative light studies in GLSL',
    category: 'Digital Art · Shaders',
    status: 'Personal exploration — 2026',
    layout: 'e',
    cover: img('afterimage', 'art_cover', '21 / 9', L, 'Generative light field in deep blue and amber'),
    coverPos: '50% 50%',
    live: 'afterimage',
    theme: { bg: '#050506', fg: '#e9e8f0', muted: '#8a8a99', line: 'rgb(233 232 240 / 0.12)', accent: '#ffb547', title: 'mono' },
    meta: [
      ['Type', 'Personal exploration'],
      ['Year', '2026'],
      ['Medium', 'Real-time fragment shader'],
      ['Input', 'Your cursor or finger'],
    ],
    lead: 'A series of real-time pieces about the trace a light leaves behind. Every frame is computed live: no video, no images, just a fragment shader and your cursor.',
    blocks: [
      { type: 'live', module: 'afterimage', title: 'Live piece', text: 'Move to disturb the field. Switch the study to change its rules.' },
      { type: 'text', kicker: 'Process', title: 'Rules, not pictures.', body: 'Each study is a small set of rules: layered noise warped by itself, a palette sampled from a cosine gradient, and a memory of where you touched it. Change a number and the whole image changes character, which is why I treat the code itself as the sketchbook.' },
      { type: 'gallery', items: [img('afterimage', 'art_a', '1 / 1', P, 'Study A'), img('afterimage', 'art_b', '1 / 1', P, 'Study B'), img('afterimage', 'art_c', '1 / 1', P, 'Study C')], caption: 'Frames captured from the three studies.' },
      { type: 'statement', text: 'An image that only exists while you are looking at it.' },
    ],
  },

  {
    slug: 'oscillo',
    num: '06',
    title: 'Oscillo',
    subtitle: 'Identity & digital experience for a fictional sound festival',
    category: 'Brand Experience · Identity',
    status: 'Concept — 2026',
    layout: 'f',
    cover: img('oscillo', 'osc_cover', '16 / 10', L, 'Oscillo festival wordmark modulated by a waveform'),
    coverPos: '50% 50%',
    live: 'oscillo',
    theme: { bg: '#1b2bff', fg: '#f3f1ea', muted: '#b9bdf5', line: 'rgb(243 241 234 / 0.22)', accent: '#e6ff3b', title: 'wide' },
    meta: [
      ['Type', 'Self-initiated concept'],
      ['Year', '2026'],
      ['Disciplines', 'Identity, Generative system, Web'],
      ['System', 'Signal-driven wordmark'],
    ],
    lead: 'An identity where the logo is a signal, not a shape. The wordmark is drawn through a waveform that changes with every input, so posters, tickets, the website and the stage all speak the same frequency.',
    blocks: [
      { type: 'live', module: 'oscillo', title: 'The generator', text: 'Type a word. Adjust the frequency and amplitude. This is the same engine that drew every poster below.' },
      { type: 'image', size: 'full', src: img('oscillo', 'osc_posters', '16 / 9', L, 'Three festival posters generated by the system') },
      { type: 'text', kicker: 'System', title: 'One rule, infinite outputs.', body: 'The identity is a function: text in, signal applied, mark out. Line-up announcements, ticket QR stubs and stage visuals are all generated from the same parameters, so the brand stays consistent without ever repeating itself.' },
      { type: 'image', size: 'inset', src: img('oscillo', 'osc_system', '16 / 10', L, 'Identity system overview: wordmark states, colours, type') },
      { type: 'screens', desktop: img('screens', 'ui_oscillo_d', '16 / 10', D, 'Oscillo festival website, desktop'), mobile: img('screens', 'ui_oscillo_m', '9 / 19.5', M, 'Oscillo festival website, mobile') },
      { type: 'palette', colors: [['Signal Blue', '#1b2bff'], ['Volt', '#e6ff3b'], ['Paper', '#f3f1ea'], ['Night', '#0a0b1e']] },
    ],
  },
];
