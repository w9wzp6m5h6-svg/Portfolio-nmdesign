/**
 * PORTANT — vêtements dessinés en code (SVG paramétrique), pour le concept de dressing.
 * Ce ne sont pas des photographies : ce sont des illustrations ombrées (volume, plis de
 * gravité, trame de tissu, coutures), rendues en WebP transparents par render.mjs.
 *
 * Repère commun (600 × 1000) : la ligne d'épaules suit les bras du cintre, dont le
 * crochet est au-dessus de l'image (le cintre est dessiné par le site, pas ici).
 */

const CX = 300;

const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map(ch).map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

function defs(id, color, { noise = 0.9, noiseOpacity = 0.1, knit = false, sheen = 0 } = {}) {
  return `
  <defs>
    <filter id="${id}-blur-s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
    <filter id="${id}-blur-m" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="11" /></filter>
    <filter id="${id}-blur-l" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22" /></filter>
    <filter id="${id}-drop" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#2a2118" flood-opacity="0.2" />
    </filter>
    <filter id="${id}-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${noise}" numOctaves="2" seed="7" result="n" />
      <!-- grain neutre : points sombres là où le bruit dépasse 0,5, points clairs en dessous -->
      <feColorMatrix in="n" type="matrix" result="dark" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${noiseOpacity * 6} 0 0 0 ${-noiseOpacity * 3}" />
      <feColorMatrix in="n" type="matrix" result="light" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${-noiseOpacity * 6} 0 0 0 ${noiseOpacity * 3}" />
      <feMerge><feMergeNode in="dark" /><feMergeNode in="light" /></feMerge>
    </filter>
    <linearGradient id="${id}-side" x1="0" x2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0.26" />
      <stop offset="0.18" stop-color="#000" stop-opacity="0.04" />
      <stop offset="0.45" stop-color="#fff" stop-opacity="${0.07 + sheen * 0.1}" />
      <stop offset="0.6" stop-color="#fff" stop-opacity="0.02" />
      <stop offset="0.85" stop-color="#000" stop-opacity="0.08" />
      <stop offset="1" stop-color="#000" stop-opacity="0.3" />
    </linearGradient>
    <linearGradient id="${id}-top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.12" />
      <stop offset="0.35" stop-color="#fff" stop-opacity="0" />
      <stop offset="1" stop-color="#000" stop-opacity="0.2" />
    </linearGradient>
    ${knit ? `<pattern id="${id}-knit" width="9" height="12" patternUnits="userSpaceOnUse">
      <path d="M0 0 L4.5 8 L9 0" fill="none" stroke="#000" stroke-opacity="0.16" stroke-width="1.6" />
      <path d="M0 4 L4.5 12 L9 4" fill="none" stroke="#fff" stroke-opacity="0.08" stroke-width="1" />
    </pattern>` : ''}
    <pattern id="${id}-rib" width="8" height="10" patternUnits="userSpaceOnUse">
      <rect width="4" height="10" fill="#000" fill-opacity="0.18" /><rect x="4" width="1.4" height="10" fill="#fff" fill-opacity="0.12" />
    </pattern>
  </defs>`;
}

/** Corps + manches d'un haut (chemise, pull, veste, manteau, t-shirt). */
function topShape(o) {
  const { nw, nd, sw, sy, cw, ay, hw, L, curve = 0, sleeve } = o;
  const neck = o.vneck
    ? `L ${CX} ${24 + nd} L ${CX + nw} 22`
    : `Q ${CX - nw * 0.95} ${24 + nd} ${CX} ${24 + nd} Q ${CX + nw * 0.95} ${24 + nd} ${CX + nw} 22`;
  const body = `M ${CX - nw} 22 ${neck}
    L ${CX + sw} ${sy} L ${CX + cw} ${ay}
    C ${CX + cw + 6} ${ay + (L - ay) * 0.4} ${CX + hw + 2} ${L - (L - ay) * 0.3} ${CX + hw} ${L}
    Q ${CX} ${L + curve} ${CX - hw} ${L}
    C ${CX - hw - 2} ${L - (L - ay) * 0.3} ${CX - cw - 6} ${ay + (L - ay) * 0.4} ${CX - cw} ${ay}
    L ${CX - sw} ${sy} Z`;
  const sl = (dir) => {
    const { len, top, cuff, out } = sleeve;
    const ax = CX + dir * sw;
    // départ de la tête de manche sur la pente d'épaule : épaule arrondie, jamais carrée
    const t = (sw - 24 - nw) / (sw - nw);
    const a0x = CX + dir * (sw - 24); const a0y = 22 + (sy - 22) * t;
    const bx = CX + dir * (sw - top); const by = sy + top * 1.05;
    const dx = CX + dir * (sw + out); const dy = sy + len;
    const cx2 = dx - dir * cuff * 2; const cy2 = dy + 4;
    return {
      d: `M ${a0x} ${a0y} C ${ax + dir * 8} ${sy - 6} ${ax + dir * 15} ${sy + 22} ${ax + dir * 14} ${sy + 58}
        C ${ax + dir * (14 + (out - 14) * 0.35)} ${sy + len * 0.45} ${dx + dir * 2} ${dy - len * 0.3} ${dx} ${dy}
        L ${cx2} ${cy2} C ${cx2 - dir * 2} ${cy2 - len * 0.35} ${bx + dir * 6} ${by + len * 0.22} ${bx} ${by}
        Q ${bx + dir * top * 0.1} ${sy + 12} ${a0x} ${a0y} Z`,
      cuffLine: (h) => `M ${dx + dir * 1} ${dy - h} L ${cx2 - dir * 1} ${cy2 - h}`,
      inner: `M ${bx} ${by} C ${bx + dir * 6} ${by + len * 0.22} ${cx2 - dir * 2} ${cy2 - len * 0.35} ${cx2} ${cy2}`,
      cap: `M ${a0x} ${a0y} C ${ax + dir * 8} ${sy - 6} ${ax + dir * 15} ${sy + 22} ${ax + dir * 14} ${sy + 58}`,
      cuff: { dx, dy, cx2, cy2 },
    };
  };
  return { body, left: sl(-1), right: sl(1) };
}

function wrap(id, inner, { color, sheen = 0, knit = false, noise, noiseOpacity }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1000" width="600" height="1000">
  ${defs(id, color, { knit, sheen, noise, noiseOpacity })}
  <g filter="url(#${id}-drop)">${inner}</g>
</svg>`;
}

/** Ombre, volume et trame appliqués à une forme. */
function finish(id, d, color, { folds = [], lights = [], knit = false, stroke = true } = {}) {
  const clip = `${id}-c${Math.abs(hash(d))}`;
  return `
    <clipPath id="${clip}"><path d="${d}" /></clipPath>
    <path d="${d}" fill="${color}" />
    <g clip-path="url(#${clip})">
      ${knit ? `<rect width="600" height="1000" fill="url(#${id}-knit)" />` : ''}
      <rect width="600" height="1000" filter="url(#${id}-grain)" />
      <rect x="${CX - 230}" width="460" height="1000" fill="url(#${id}-side)" opacity="0.75" />
      <rect width="600" height="1000" fill="url(#${id}-top)" />
      ${folds.map(([p, w, o]) => `<path d="${p}" fill="none" stroke="#000" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round" filter="url(#${id}-blur-m)" />`).join('')}
      ${lights.map(([p, w, o]) => `<path d="${p}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round" filter="url(#${id}-blur-m)" />`).join('')}
    </g>
    ${stroke ? `<path d="${d}" fill="none" stroke="${shade(color, -0.35)}" stroke-opacity="0.55" stroke-width="1.6" />` : ''}`;
}

let h0 = 0;
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return h + (h0++); }

const stitch = (d, color, o = 0.45) => `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${o}" stroke-width="1.4" stroke-dasharray="5 4" />`;
const seam = (d, color, o = 0.4) => `<path d="${d}" fill="none" stroke="${color}" stroke-opacity="${o}" stroke-width="1.6" />`;
const button = (x, y, r, fill) => `<circle cx="${x}" cy="${y + 2}" r="${r}" fill="#000" fill-opacity="0.18" /><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" /><circle cx="${x}" cy="${y}" r="${r * 0.62}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="1" /><circle cx="${x - r * 0.22}" cy="${y - r * 0.2}" r="${r * 0.14}" fill="#000" fill-opacity="0.3" /><circle cx="${x + r * 0.22}" cy="${y + r * 0.2}" r="${r * 0.14}" fill="#000" fill-opacity="0.3" />`;

/** Plis de gravité communs à tous les hauts : ils partent des épaules (là où le cintre porte). */
function gravityFolds(o, extra = []) {
  const { sw, sy, hw, L } = o;
  return [
    [`M ${CX - sw * 0.55} ${sy + 20} C ${CX - sw * 0.5} ${sy + 200} ${CX - hw * 0.55} ${L - 260} ${CX - hw * 0.42} ${L - 10}`, 26, 0.16],
    [`M ${CX + sw * 0.6} ${sy + 20} C ${CX + sw * 0.52} ${sy + 220} ${CX + hw * 0.5} ${L - 240} ${CX + hw * 0.5} ${L - 10}`, 22, 0.14],
    [`M ${CX - 30} ${sy + 120} C ${CX - 40} ${sy + 300} ${CX - 10} ${L - 160} ${CX - 20} ${L}`, 16, 0.08],
    ...extra,
  ];
}
function gravityLights(o, extra = []) {
  const { sw, sy, hw, L } = o;
  return [
    [`M ${CX - sw * 0.35} ${sy + 40} C ${CX - sw * 0.3} ${sy + 220} ${CX - hw * 0.3} ${L - 220} ${CX - hw * 0.24} ${L - 20}`, 30, 0.12],
    [`M ${CX + sw * 0.38} ${sy + 40} C ${CX + sw * 0.32} ${sy + 220} ${CX + hw * 0.3} ${L - 220} ${CX + hw * 0.3} ${L - 20}`, 24, 0.09],
    ...extra,
  ];
}
function sleeveFolds(s, len) {
  const { dx, dy } = s.cuff;
  const dir = dx > CX ? 1 : -1;
  return [
    [s.inner, 18, 0.26],
    [`M ${dx - dir * 8} ${dy - len * 0.45} q ${-dir * 30} 14 ${-dir * 56} 6`, 10, 0.2],
    [`M ${dx - dir * 6} ${dy - len * 0.25} q ${-dir * 26} 10 ${-dir * 50} 2`, 8, 0.18],
  ];
}

/* ------------------------------------------------------------------------------- */

export const GARMENTS = {
  // Manteau droit en laine, camel
  coat() {
    const id = 'coat'; const color = '#b58b5e'; const lining = '#6e5236';
    const o = { nw: 52, nd: 330, vneck: true, sw: 196, sy: 66, cw: 182, ay: 168, hw: 198, L: 950, sleeve: { len: 600, top: 74, cuff: 34, out: 40 } };
    const { body, left, right } = topShape(o);
    const lapelL = `M ${CX - 52} 22 L ${CX - 112} 150 L ${CX - 92} 168 L ${CX - 104} 196 L ${CX - 6} 356 L ${CX} 354 Z`;
    const lapelR = `M ${CX + 52} 22 L ${CX + 112} 150 L ${CX + 92} 168 L ${CX + 104} 196 L ${CX + 6} 356 L ${CX} 354 Z`;
    const inner = `M ${CX - 52} 22 L ${CX} 354 L ${CX + 52} 22 Q ${CX} 40 ${CX - 52} 22 Z`;
    return wrap(id, `
      ${finish(id, inner, lining, { folds: [[`M ${CX} 60 L ${CX} 340`, 30, 0.3]] })}
      ${finish(id, body, color, { folds: gravityFolds(o, [[`M ${CX + 8} 360 L ${CX + 4} ${o.L}`, 14, 0.2]]), lights: gravityLights(o) })}
      ${finish(id, lapelL, shade(color, -0.04), { folds: [[`M ${CX - 104} 196 L ${CX - 8} 350`, 12, 0.25]], lights: [[`M ${CX - 80} 120 L ${CX - 30} 300`, 16, 0.18]] })}
      ${finish(id, lapelR, shade(color, -0.04), { folds: [[`M ${CX + 104} 196 L ${CX + 8} 350`, 12, 0.25]], lights: [[`M ${CX + 70} 140 L ${CX + 30} 300`, 12, 0.12]] })}
      ${seam(`M ${CX + 4} 356 L ${CX + 2} ${o.L}`, shade(color, -0.45), 0.5)}
      ${button(CX - 16, 470, 13, '#3a2b1d')}${button(CX - 16, 590, 13, '#3a2b1d')}
      ${finish(id, `M ${CX - 168} 652 L ${CX - 54} 652 L ${CX - 52} 690 Q ${CX - 110} 696 ${CX - 168} 690 Z`, shade(color, -0.06), { folds: [[`M ${CX - 166} 692 L ${CX - 54} 692`, 8, 0.3]] })}
      ${finish(id, `M ${CX + 168} 652 L ${CX + 54} 652 L ${CX + 52} 690 Q ${CX + 110} 696 ${CX + 168} 690 Z`, shade(color, -0.06), { folds: [[`M ${CX + 166} 692 L ${CX + 54} 692`, 8, 0.3]] })}
      ${finish(id, left.d, shade(color, -0.03), { folds: sleeveFolds(left, 600), lights: [[`M ${CX - 214} 120 L ${CX - 226} 600`, 18, 0.12]] })}
      ${finish(id, right.d, shade(color, -0.03), { folds: sleeveFolds(right, 600), lights: [[`M ${CX + 222} 120 L ${CX + 232} 600`, 14, 0.08]] })}
      ${seam(left.cuffLine(70), shade(color, -0.4), 0.35)}${seam(right.cuffLine(70), shade(color, -0.4), 0.35)}
    `, { color, noise: 1.1, noiseOpacity: 0.12 });
  },

  // Chemise en popeline, écru
  shirt() {
    const id = 'shirt'; const color = '#ebe5d8';
    const o = { nw: 42, nd: 30, sw: 176, sy: 64, cw: 162, ay: 160, hw: 160, L: 700, curve: 46, sleeve: { len: 560, top: 68, cuff: 30, out: 34 } };
    const { body, left, right } = topShape(o);
    const collarL = `M ${CX - 44} 20 Q ${CX - 60} 60 ${CX - 76} 104 L ${CX - 6} 78 Q ${CX - 20} 46 ${CX - 4} 26 Z`;
    const collarR = `M ${CX + 44} 20 Q ${CX + 60} 60 ${CX + 76} 104 L ${CX + 6} 78 Q ${CX + 20} 46 ${CX + 4} 26 Z`;
    const placket = `M ${CX - 15} 70 L ${CX + 15} 70 L ${CX + 15} ${o.L + 40} L ${CX - 15} ${o.L + 40} Z`;
    const cuff = (s) => { const { dx, dy, cx2, cy2 } = s.cuff; return `M ${dx} ${dy} L ${cx2} ${cy2} L ${cx2 + (dx > CX ? 1 : -1) * 2} ${cy2 - 58} L ${dx + (dx > CX ? 1 : -1) * 3} ${dy - 58} Z`; };
    const ink = '#9c958a';
    return wrap(id, `
      ${finish(id, body, color, { folds: gravityFolds(o), lights: gravityLights(o) })}
      ${seam(`M ${CX - 168} 104 Q ${CX} 124 ${CX + 168} 104`, ink, 0.45)}
      ${finish(id, placket, shade(color, 0.04), { folds: [[`M ${CX + 15} 80 L ${CX + 15} ${o.L + 30}`, 6, 0.18]], stroke: false })}
      ${stitch(`M ${CX - 11} 80 L ${CX - 11} ${o.L + 30}`, ink, 0.5)}${stitch(`M ${CX + 11} 80 L ${CX + 11} ${o.L + 30}`, ink, 0.5)}
      ${[118, 210, 302, 394, 486, 578].map((y) => button(CX, y, 6.5, '#f7f3ea')).join('')}
      ${finish(id, collarL, shade(color, 0.03), { folds: [[`M ${CX - 70} 100 L ${CX - 8} 76`, 10, 0.22]] })}
      ${finish(id, collarR, shade(color, 0.03), { folds: [[`M ${CX + 70} 100 L ${CX + 8} 76`, 10, 0.22]] })}
      ${finish(id, `M ${CX - 44} 20 Q ${CX} 6 ${CX + 44} 20 L ${CX + 4} 26 Q ${CX} 22 ${CX - 4} 26 Z`, shade(color, -0.12), {})}
      ${finish(id, left.d, color, { folds: sleeveFolds(left, 560) })}
      ${finish(id, right.d, color, { folds: sleeveFolds(right, 560) })}
      ${finish(id, cuff(left), shade(color, 0.03), {})}${finish(id, cuff(right), shade(color, 0.03), {})}
      ${button(left.cuff.dx + 26, left.cuff.dy - 30, 5.5, '#f7f3ea')}${button(right.cuff.dx - 26, right.cuff.dy - 30, 5.5, '#f7f3ea')}
    `, { color, noise: 1.4, noiseOpacity: 0.06 });
  },

  // Pull col rond en mérinos, rouille
  sweater() {
    const id = 'sweater'; const color = '#a4522f';
    const o = { nw: 54, nd: 54, sw: 176, sy: 70, cw: 168, ay: 176, hw: 150, L: 640, sleeve: { len: 560, top: 78, cuff: 27, out: 26 } };
    const { body, left, right } = topShape(o);
    const neckRib = `M ${CX - 54} 22 Q ${CX - 51} ${78} ${CX} ${78} Q ${CX + 51} ${78} ${CX + 54} 22 L ${CX + 74} 26 Q ${CX + 70} ${100} ${CX} ${100} Q ${CX - 70} ${100} ${CX - 74} 26 Z`;
    const hemRib = `M ${CX - 150} ${o.L - 60} Q ${CX} ${o.L - 54} ${CX + 150} ${o.L - 60} L ${CX + 150} ${o.L} Q ${CX} ${o.L + 4} ${CX - 150} ${o.L} Z`;
    const cuffRib = (s) => { const { dx, dy, cx2, cy2 } = s.cuff; const dir = dx > CX ? 1 : -1; return `M ${dx} ${dy} L ${cx2} ${cy2} L ${cx2 - dir * 2} ${cy2 - 70} L ${dx + dir * 6} ${dy - 70} Z`; };
    const rib = (d) => `<path d="${d}" fill="url(#${id}-rib)" />`;
    return wrap(id, `
      ${finish(id, body, color, { knit: true, folds: gravityFolds(o), lights: gravityLights(o) })}
      ${finish(id, hemRib, shade(color, -0.05), { folds: [[`M ${CX - 150} ${o.L - 58} Q ${CX} ${o.L - 50} ${CX + 150} ${o.L - 58}`, 8, 0.3]] })}${rib(hemRib)}
      ${finish(id, neckRib, shade(color, -0.04), {})}${rib(neckRib)}
      ${finish(id, left.d, color, { knit: true, folds: sleeveFolds(left, 560) })}
      ${finish(id, right.d, color, { knit: true, folds: sleeveFolds(right, 560) })}
      ${finish(id, cuffRib(left), shade(color, -0.05), {})}${rib(cuffRib(left))}
      ${finish(id, cuffRib(right), shade(color, -0.05), {})}${rib(cuffRib(right))}
    `, { color, knit: true, noise: 0.8, noiseOpacity: 0.12 });
  },

  // Veste de travail en coton, indigo, surpiqûres contrastées
  jacket() {
    const id = 'jacket'; const color = '#2f3b57'; const thread = '#d8c9a3';
    const o = { nw: 46, nd: 40, sw: 182, sy: 66, cw: 172, ay: 166, hw: 172, L: 690, sleeve: { len: 576, top: 74, cuff: 32, out: 36 } };
    const { body, left, right } = topShape(o);
    const collarL = `M ${CX - 46} 20 Q ${CX - 70} 70 ${CX - 92} 128 L ${CX - 4} 96 Q ${CX - 18} 56 ${CX - 2} 30 Z`;
    const collarR = `M ${CX + 46} 20 Q ${CX + 70} 70 ${CX + 92} 128 L ${CX + 4} 96 Q ${CX + 18} 56 ${CX + 2} 30 Z`;
    const pocket = (x, y, w, h) => ({ d: `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h - 10} Q ${x + w / 2} ${y + h + 4} ${x} ${y + h - 10} Z`, top: `M ${x + 4} ${y + 12} L ${x + w - 4} ${y + 12}`, side: `M ${x + 6} ${y + 14} L ${x + 6} ${y + h - 14} M ${x + w - 6} ${y + 14} L ${x + w - 6} ${y + h - 14}` });
    const pk = [pocket(CX - 138, 200, 92, 104), pocket(CX - 160, 430, 120, 134), pocket(CX + 40, 430, 120, 134)];
    return wrap(id, `
      ${finish(id, body, color, { folds: gravityFolds(o), lights: gravityLights(o) })}
      ${seam(`M ${CX + 2} 96 L ${CX + 2} ${o.L}`, '#0d1220', 0.6)}
      ${stitch(`M ${CX + 12} 100 L ${CX + 12} ${o.L - 6}`, thread, 0.55)}
      ${pk.map((p) => `${finish(id, p.d, shade(color, 0.03), { folds: [[p.d, 6, 0.22]] })}${stitch(p.top, thread, 0.6)}${stitch(p.side, thread, 0.45)}`).join('')}
      ${[150, 280, 410, 540].map((y) => button(CX - 4, y, 9, '#c7c0b0')).join('')}
      ${finish(id, collarL, shade(color, 0.04), { folds: [[`M ${CX - 86} 124 L ${CX - 6} 94`, 12, 0.3]] })}
      ${finish(id, collarR, shade(color, 0.04), { folds: [[`M ${CX + 86} 124 L ${CX + 6} 94`, 12, 0.3]] })}
      ${stitch(`M ${CX - 82} 116 L ${CX - 12} 90`, thread, 0.5)}${stitch(`M ${CX + 82} 116 L ${CX + 12} 90`, thread, 0.5)}
      ${finish(id, left.d, color, { folds: sleeveFolds(left, 576) })}
      ${finish(id, right.d, color, { folds: sleeveFolds(right, 576) })}
      ${stitch(left.cuffLine(56), thread, 0.55)}${stitch(right.cuffLine(56), thread, 0.55)}
      ${stitch(`M ${CX - 166} ${o.L - 14} L ${CX + 166} ${o.L - 14}`, thread, 0.5)}
    `, { color, noise: 1.2, noiseOpacity: 0.14 });
  },

  // Robe nuisette en satin, noir
  dress() {
    const id = 'dress'; const color = '#1d1c20';
    const d = `M ${CX - 138} 214 Q ${CX - 70} 236 ${CX} 300 Q ${CX + 70} 236 ${CX + 138} 214
      C ${CX + 150} 330 ${CX + 176} 600 ${CX + 222} 900 Q ${CX + 120} 930 ${CX} 916 Q ${CX - 120} 930 ${CX - 222} 900
      C ${CX - 176} 600 ${CX - 150} 330 ${CX - 138} 214 Z`;
    const strap = (dir) => `<path d="M ${CX + dir * 112} 44 L ${CX + dir * 128} 216" stroke="${shade(color, 0.12)}" stroke-width="5" stroke-linecap="round" />`;
    return wrap(id, `
      ${strap(-1)}${strap(1)}
      ${finish(id, d, color, {
        folds: [
          [`M ${CX - 60} 320 C ${CX - 80} 520 ${CX - 110} 700 ${CX - 130} 905`, 34, 0.5],
          [`M ${CX + 30} 330 C ${CX + 40} 520 ${CX + 60} 720 ${CX + 70} 915`, 28, 0.45],
          [`M ${CX + 120} 260 C ${CX + 140} 500 ${CX + 170} 700 ${CX + 190} 900`, 22, 0.4],
        ],
        lights: [
          [`M ${CX - 100} 260 C ${CX - 112} 480 ${CX - 150} 700 ${CX - 172} 900`, 20, 0.34],
          [`M ${CX - 14} 320 C ${CX - 20} 520 ${CX - 30} 720 ${CX - 36} 915`, 26, 0.4],
          [`M ${CX + 80} 280 C ${CX + 96} 500 ${CX + 114} 720 ${CX + 128} 912`, 18, 0.3],
        ],
      })}
      ${seam(`M ${CX - 138} 214 Q ${CX - 70} 236 ${CX} 300 Q ${CX + 70} 236 ${CX + 138} 214`, '#000', 0.6)}
    `, { color, sheen: 1, noise: 2, noiseOpacity: 0.04 });
  },

  // Pantalon large à pinces, pierre (cintre à pinces)
  trousers() {
    const id = 'trousers'; const color = '#cbbfa6'; const ink = '#8f8370';
    const legL = `M ${CX - 152} 60 L ${CX - 2} 60 L ${CX - 2} 360 C ${CX - 6} 520 ${CX - 22} 760 ${CX - 26} 960 L ${CX - 178} 960 C ${CX - 172} 700 ${CX - 160} 300 ${CX - 152} 60 Z`;
    const legR = `M ${CX + 152} 60 L ${CX + 2} 60 L ${CX + 2} 360 C ${CX + 6} 520 ${CX + 22} 760 ${CX + 26} 960 L ${CX + 178} 960 C ${CX + 172} 700 ${CX + 160} 300 ${CX + 152} 60 Z`;
    const band = `M ${CX - 154} 58 L ${CX + 154} 58 L ${CX + 154} 104 L ${CX - 154} 104 Z`;
    return wrap(id, `
      ${finish(id, legL, color, { folds: [[`M ${CX - 90} 120 C ${CX - 96} 400 ${CX - 100} 700 ${CX - 104} 955`, 16, 0.22], [`M ${CX - 30} 380 C ${CX - 34} 600 ${CX - 40} 800 ${CX - 44} 955`, 22, 0.2]], lights: [[`M ${CX - 70} 120 C ${CX - 74} 400 ${CX - 78} 700 ${CX - 82} 955`, 14, 0.3]] })}
      ${finish(id, legR, shade(color, -0.03), { folds: [[`M ${CX + 90} 120 C ${CX + 96} 400 ${CX + 100} 700 ${CX + 104} 955`, 16, 0.22], [`M ${CX + 150} 140 C ${CX + 158} 500 ${CX + 166} 800 ${CX + 170} 955`, 22, 0.24]], lights: [[`M ${CX + 110} 120 C ${CX + 116} 400 ${CX + 120} 700 ${CX + 124} 955`, 14, 0.24]] })}
      ${seam(`M ${CX - 120} 104 L ${CX - 116} 250`, ink, 0.5)}${seam(`M ${CX - 70} 104 L ${CX - 70} 220`, ink, 0.45)}
      ${seam(`M ${CX + 120} 104 L ${CX + 116} 250`, ink, 0.5)}${seam(`M ${CX + 70} 104 L ${CX + 70} 220`, ink, 0.45)}
      ${seam(`M ${CX - 146} 108 L ${CX - 118} 236`, ink, 0.55)}${seam(`M ${CX + 146} 108 L ${CX + 118} 236`, ink, 0.55)}
      ${stitch(`M ${CX + 22} 108 L ${CX + 22} 290 Q ${CX + 22} 320 ${CX} 330`, ink, 0.6)}
      ${finish(id, band, shade(color, 0.02), { folds: [[`M ${CX - 150} 104 L ${CX + 150} 104`, 6, 0.3]] })}
      ${[-128, -64, 0, 64, 128].map((x) => `<rect x="${CX + x - 6}" y="54" width="12" height="56" rx="2" fill="${shade(color, 0.05)}" stroke="${ink}" stroke-opacity="0.45" />`).join('')}
      ${button(CX - 10, 81, 7, '#6d6150')}
    `, { color, noise: 1.3, noiseOpacity: 0.1 });
  },

  // T-shirt épais, gris chiné
  tee() {
    const id = 'tee'; const color = '#a9a7a0';
    const o = { nw: 56, nd: 44, sw: 182, sy: 68, cw: 170, ay: 170, hw: 164, L: 610, sleeve: { len: 150, top: 70, cuff: 40, out: 72 } };
    const { body, left, right } = topShape(o);
    const neckRib = `M ${CX - 56} 22 Q ${CX - 53} 66 ${CX} 66 Q ${CX + 53} 66 ${CX + 56} 22 L ${CX + 68} 24 Q ${CX + 66} 80 ${CX} 80 Q ${CX - 66} 80 ${CX - 68} 24 Z`;
    return wrap(id, `
      ${finish(id, body, color, { folds: gravityFolds(o), lights: gravityLights(o) })}
      ${stitch(`M ${CX - 164} ${o.L - 20} L ${CX + 164} ${o.L - 20}`, '#6f6d66', 0.55)}
      ${finish(id, neckRib, shade(color, -0.06), {})}
      ${finish(id, left.d, color, { folds: [[left.inner, 16, 0.24]] })}
      ${finish(id, right.d, color, { folds: [[right.inner, 16, 0.24]] })}
      ${stitch(left.cuffLine(16), '#6f6d66', 0.5)}${stitch(right.cuffLine(16), '#6f6d66', 0.5)}
    `, { color, noise: 0.7, noiseOpacity: 0.16 });
  },
};
