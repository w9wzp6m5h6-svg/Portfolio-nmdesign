/**
 * Étiquette de la canette ÉLAN, dessinée en code (Canvas 2D) pour chaque saveur.
 * L'image fait le tour complet de la canette : x = 0 et x = W se rejoignent au dos,
 * la face avant est au centre (x = W / 2). Les proportions suivent la surface réelle
 * du corps (circonférence × hauteur imprimée), donc rien n'est déformé une fois posé.
 */
import { INGREDIENTS } from './data.js';

const DISPLAY = '"Space Grotesk Variable", "Space Grotesk", sans-serif';
const TEXT = '"Inter Variable", "Inter", system-ui, sans-serif';

/** Charge les deux familles avant de dessiner (sinon le canvas prend une police de secours). */
export function loadLabelFonts() {
  if (!document.fonts?.load) return Promise.resolve();
  return Promise.all([
    document.fonts.load(`700 200px ${DISPLAY}`),
    document.fonts.load(`500 40px ${DISPLAY}`),
    document.fonts.load(`500 20px ${TEXT}`),
    document.fonts.load(`400 20px ${TEXT}`),
  ]).catch(() => {});
}

/**
 * @param {object} v       saveur (data.js)
 * @param {number} width   largeur en px (2048 ordinateur, 1024 appareils modestes)
 * @param {number} aspect  hauteur / largeur de la zone imprimée
 */
export function drawLabel(v, width = 2048, aspect = 0.643) {
  const W = 2048;
  const H = Math.round(W * aspect);
  const c = document.createElement('canvas');
  c.width = width;
  c.height = Math.round(width * aspect);
  const g = c.getContext('2d');
  g.scale(width / W, width / W);
  const front = W / 2;

  // fond
  g.fillStyle = v.body;
  g.fillRect(0, 0, W, H);

  // trame fine dans le bas de la face : la couleur « vibre » à l'impression
  g.save();
  g.globalAlpha = 0.16;
  g.fillStyle = v.accent;
  for (let y = H * 0.56; y < H; y += 14) {
    const k = (y - H * 0.56) / (H * 0.44);
    for (let x = 0; x < W; x += 14) {
      const r = 0.6 + k * 3.6 * (0.75 + 0.25 * Math.sin(x * 0.004));
      g.beginPath(); g.arc(x + ((y / 14) % 2) * 7, y, r, 0, Math.PI * 2); g.fill();
    }
  }
  g.restore();

  // la trajectoire : un grand arc qui monte de bas à gauche vers le haut à droite
  const arc = (lw, offset, color, alpha = 1) => {
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = color;
    g.lineWidth = lw;
    g.lineCap = 'butt';
    g.beginPath();
    g.ellipse(front - 260, H + 520 + offset, 1500, 1500, 0, -Math.PI * 0.98, -Math.PI * 0.22);
    g.stroke();
    g.restore();
  };
  arc(230, 0, v.accent);
  arc(26, -190, v.accent);
  arc(6, -246, v.paper, 0.85);
  arc(6, 150, v.paper, 0.5);

  // logotype vertical, lu de bas en haut, sur la face avant
  g.save();
  g.translate(front, H / 2);
  g.rotate(-Math.PI / 2);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  let size = 470;
  g.font = `700 ${size}px ${DISPLAY}`;
  const target = H * 0.9;
  size *= target / g.measureText('ÉLAN').width;
  g.font = `700 ${size}px ${DISPLAY}`;
  if ('letterSpacing' in g) g.letterSpacing = `${-0.04 * size}px`;
  // léger décalage de repérage, comme une impression offset
  g.fillStyle = v.accent;
  g.fillText('ÉLAN', 9, 12);
  g.fillStyle = v.paper;
  g.fillText('ÉLAN', 0, 0);
  g.restore();

  // colonne gauche : mention verticale
  g.save();
  g.translate(front - 330, H - 70);
  g.rotate(-Math.PI / 2);
  g.fillStyle = v.paper;
  g.font = `500 30px ${TEXT}`;
  if ('letterSpacing' in g) g.letterSpacing = '6px';
  g.fillText('ÉNERGIE NATURELLE — 250 ML', 0, 0);
  g.restore();

  // colonne droite : la saveur
  const rx = front + 250;
  g.fillStyle = v.paper;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  if ('letterSpacing' in g) g.letterSpacing = '-2px';
  g.font = `600 74px ${DISPLAY}`;
  const [l1, ...rest] = v.name.split(' ');
  g.fillText(l1, rx, 170);
  g.fillText(rest.join(' '), rx, 246);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  g.font = `400 26px ${TEXT}`;
  wrap(g, v.notes, rx, 300, 300, 34);
  g.font = `600 26px ${TEXT}`;
  if ('letterSpacing' in g) g.letterSpacing = '3px';
  g.fillText(`${v.caffeine} MG CAFÉINE`, rx, H - 190);
  g.fillText(`${v.sugar} G SUCRES AJOUTÉS`, rx, H - 150);
  if ('letterSpacing' in g) g.letterSpacing = '0px';

  // pastille « zéro sucre »
  g.save();
  g.translate(rx + 70, H - 340);
  g.fillStyle = v.accent;
  g.beginPath(); g.arc(0, 0, 70, 0, Math.PI * 2); g.fill();
  g.fillStyle = v.accent === '#1e3bff' ? '#ffffff' : v.paper;
  g.textAlign = 'center';
  g.font = `700 44px ${DISPLAY}`;
  g.fillText('0', 0, 4);
  g.font = `600 17px ${TEXT}`;
  if ('letterSpacing' in g) g.letterSpacing = '2px';
  g.fillText('SUCRE', 0, 34);
  g.restore();

  // côté gauche : composition, valeurs, mentions
  const back = (x0) => {
    g.save();
    g.fillStyle = v.paper;
    g.textAlign = 'left';
    g.font = `600 22px ${TEXT}`;
    if ('letterSpacing' in g) g.letterSpacing = '3px';
    g.fillText('COMPOSITION', x0, 150);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.font = `400 21px ${TEXT}`;
    const list = `Eau de source gazéifiée, ${v.juice} (6 %), acidifiant : acide citrique, extrait de guarana (caféine naturelle), gingembre, arômes naturels, édulcorant : glycosides de stéviol, vitamines (B3, B6, B12).`;
    let y = wrap(g, list, x0, 186, 330, 28) + 30;
    g.font = `600 22px ${TEXT}`;
    if ('letterSpacing' in g) g.letterSpacing = '3px';
    g.fillText('POUR 250 ML', x0, y);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    y += 14;
    g.font = `400 21px ${TEXT}`;
    for (const [k, val] of [['Énergie', `${v.kcal} kcal`], ['Sucres', `${v.sugar} g`], ['Caféine', `${v.caffeine} mg`], ['Sel', '0,1 g']]) {
      y += 34;
      g.globalAlpha = 0.35; g.fillRect(x0, y - 26, 330, 1.5); g.globalAlpha = 1;
      g.fillText(k, x0, y);
      g.textAlign = 'right'; g.fillText(val, x0 + 330, y); g.textAlign = 'left';
    }
    y += 52;
    g.font = `400 17px ${TEXT}`;
    wrap(g, 'Teneur élevée en caféine (32 mg/100 ml). Déconseillé aux enfants et aux femmes enceintes ou allaitantes.', x0, y, 330, 22);
    g.font = `500 16px ${TEXT}`;
    g.globalAlpha = 0.8;
    g.fillText('Produit fictif — concept NM Design', x0, H - 56);
    g.restore();
  };
  back(150);

  // filets d'impression en haut et en bas
  g.fillStyle = v.paper;
  g.globalAlpha = 0.9;
  g.fillRect(0, 22, W, 3);
  g.fillRect(0, H - 25, W, 3);
  g.globalAlpha = 1;
  return c;
}

function wrap(g, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); line = w; y += lh; } else line = test;
  }
  if (line) g.fillText(line, x, y);
  return y;
}

export { INGREDIENTS };
