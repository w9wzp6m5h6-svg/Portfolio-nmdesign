/**
 * Offline capture of generated artwork. Uses the exact engines the site runs:
 *  - Afterimage (src/project/live/afterimage.js)
 *  - Oscillo signal mark (src/project/live/oscillo.js)
 */
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/geist-mono/wght.css';
import '@fontsource/instrument-serif/400-italic.css';
import { Afterimage } from '../../src/project/live/afterimage.js';
import { drawSignalMark, OSC_COLORS } from '../../src/project/live/oscillo.js';

const q = new URLSearchParams(location.search);
const W = +q.get('w'); const H = +q.get('h');
const canvas = document.getElementById('c');
canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;

const MONO = '"Geist Mono Variable", monospace';
const C = OSC_COLORS;

function mono(g, text, x, y, size, color, align = 'left') {
  g.font = `400 ${size}px ${MONO}`;
  g.fillStyle = color; g.textAlign = align; g.textBaseline = 'top';
  g.fillText(text, x, y);
  g.textAlign = 'left';
}

const pieces = {
  async afterimage() {
    const piece = new Afterimage(canvas, { scale: 1 });
    piece.setStudy(+(q.get('study') || 0));
    piece.resize();
    const frames = +(q.get('frames') || 90);
    const t0 = +(q.get('t') || 0);
    piece.time = t0;
    for (let i = 0; i < frames; i++) {
      const k = i / frames;
      piece.mouseGoal.set(0.3 + k * 0.45, 0.35 + Math.sin(k * 5) * 0.15);
      piece.pushGoal = 1;
      piece.frame(1 / 30);
    }
  },

  async osc_cover() {
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const pad = W * 0.05;
    drawSignalMark(g, pad, H * 0.26, W - pad * 2, H * 0.48, { text: 'OSCILLO', freq: 0.42, amp: 0.38, t: 1.7, color: C.fg, accent: C.accent, rows: 54 });
    const s = W * 0.011;
    mono(g, 'SOUND & LIGHT FESTIVAL', pad, pad * 0.8, s, C.fg);
    mono(g, 'EDITION 01 — CONCEPT', W - pad, pad * 0.8, s, C.fg, 'right');
    mono(g, '12—14.06', pad, H - pad * 0.8 - s, s, C.fg);
    mono(g, 'F 96 HZ   A 38%', W - pad, H - pad * 0.8 - s, s, C.accent, 'right');
  },

  async osc_posters() {
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');
    g.fillStyle = '#d9d6cc'; g.fillRect(0, 0, W, H);
    const gap = W * 0.035;
    const ph = H * 0.8; const pw = ph * (2 / 3);
    const total = pw * 3 + gap * 2;
    let x = (W - total) / 2; const y = (H - ph) / 2;
    const posters = [
      { bg: C.bg, fg: C.fg, ac: C.accent, word: 'OSCILLO', top: 'SOUND & LIGHT FESTIVAL', mid: 'THREE NIGHTS', bot: '12—14.06', f: 0.4, a: 0.45 },
      { bg: C.accent, fg: C.night, ac: C.bg, word: 'NIGHT 01', top: 'OSCILLO — STAGE A', mid: 'DOORS 22:00', bot: 'FRI 12.06', f: 0.75, a: 0.6 },
      { bg: C.fg, fg: C.bg, ac: C.night, word: 'SIGNAL', top: 'OSCILLO — EDITION 01', mid: 'LIGHT / SOUND / SPACE', bot: 'TICKETS SOON', f: 0.2, a: 0.25 },
    ];
    for (const p of posters) {
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = W * 0.02; g.shadowOffsetY = W * 0.008;
      g.fillStyle = p.bg; g.fillRect(x, y, pw, ph);
      g.restore();
      const pp = pw * 0.07;
      const s = pw * 0.028;
      mono(g, p.top, x + pp, y + pp, s, p.fg);
      // the mark, stacked: one word per band, giant
      drawSignalMark(g, x + pp * 0.5, y + ph * 0.16, pw - pp, ph * 0.3, { text: p.word, freq: p.f, amp: p.a, t: 0.8, color: p.fg, accent: p.ac, rows: 30 });
      drawSignalMark(g, x + pp * 0.5, y + ph * 0.48, pw - pp, ph * 0.22, { text: p.word, freq: p.f * 1.6, amp: p.a * 0.5, t: 2.4, color: p.fg, rows: 22 });
      g.fillStyle = p.fg; g.fillRect(x + pp, y + ph * 0.78, pw - pp * 2, Math.max(1, pw * 0.003));
      mono(g, p.mid, x + pp, y + ph * 0.8, s * 1.2, p.fg);
      mono(g, p.bot, x + pp, y + ph - pp - s * 1.6, s * 1.6, p.fg);
      mono(g, 'CONCEPT', x + pw - pp, y + ph - pp - s, s, p.fg, 'right');
      x += pw + gap;
    }
  },

  async osc_system() {
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');
    g.fillStyle = C.fg; g.fillRect(0, 0, W, H);
    const pad = W * 0.05;
    const s = W * 0.01;
    mono(g, 'OSCILLO — IDENTITY SYSTEM', pad, pad * 0.7, s, C.night);
    mono(g, 'ONE RULE, INFINITE OUTPUTS', W - pad, pad * 0.7, s, C.night, 'right');
    // 2 × 2 grid of mark states
    const cols = 2; const cellW = (W * 0.62 - pad) / cols; const cellH = (H - pad * 2.6) / 2;
    const states = [
      { f: 0.1, a: 0.08, l: 'IDLE — F 38 HZ / A 8%' },
      { f: 0.42, a: 0.38, l: 'PRIMARY — F 96 HZ / A 38%' },
      { f: 0.8, a: 0.62, l: 'PEAK — F 164 HZ / A 62%' },
      { f: 1, a: 1, l: 'DROP — F 200 HZ / A 100%' },
    ];
    states.forEach((st, i) => {
      const cx = pad + (i % cols) * cellW; const cy = pad * 1.6 + Math.floor(i / cols) * cellH;
      g.fillStyle = i === 1 ? C.bg : C.night;
      g.fillRect(cx + 4, cy + 4, cellW - 8, cellH - 8);
      drawSignalMark(g, cx + cellW * 0.08, cy + cellH * 0.25, cellW * 0.84, cellH * 0.5, { text: 'OSCILLO', freq: st.f, amp: st.a, t: 1.2, color: C.fg, accent: i === 1 ? C.accent : null, rows: 26 });
      mono(g, st.l, cx + 4 + cellW * 0.05, cy + cellH - 8 - s * 2.4, s * 0.9, C.fg);
    });
    // colours
    const rx = W * 0.62 + pad * 0.6; const rw = W - rx - pad;
    const sw = [[C.bg, 'SIGNAL BLUE', C.fg], [C.accent, 'VOLT', C.night], [C.night, 'NIGHT', C.fg]];
    sw.forEach(([col, n, tc], i) => {
      const yy = pad * 1.6 + i * (cellH * 0.42);
      g.fillStyle = col; g.fillRect(rx, yy + 4, rw, cellH * 0.42 - 8);
      mono(g, n, rx + rw * 0.06, yy + 4 + rw * 0.06, s, tc);
      mono(g, col.toUpperCase(), rx + rw * 0.06, yy + cellH * 0.42 - 8 - rw * 0.06 - s, s, tc);
    });
    // type
    const ty = pad * 1.6 + cellH * 1.26;
    g.fillStyle = C.night;
    g.font = `800 expanded ${cellH * 0.32}px "Archivo Variable"`;
    if ('fontStretch' in g) g.fontStretch = 'expanded';
    g.textBaseline = 'top';
    g.fillText('Aa', rx, ty);
    mono(g, 'ARCHIVO EXPANDED — HEADLINES', rx, ty + cellH * 0.38, s, C.night);
    mono(g, 'GEIST MONO — DATA, TIMES, TICKETS', rx, ty + cellH * 0.38 + s * 1.8, s, C.night);
  },
};

try {
  await document.fonts.load('800 expanded 100px "Archivo Variable"');
  await document.fonts.load('400 20px "Geist Mono Variable"');
  await document.fonts.ready;
  await pieces[q.get('piece')]();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__done = true;
} catch (e) {
  window.__error = String(e.stack || e);
}
