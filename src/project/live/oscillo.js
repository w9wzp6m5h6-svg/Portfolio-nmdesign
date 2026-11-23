/**
 * Oscillo — signal-driven wordmark engine.
 * Text is rasterised into a mask, then redrawn as horizontal scan lines that
 * travel through a waveform: the letters only exist where the signal passes.
 * The same function draws the live generator and every brand visual.
 */

export const OSC_COLORS = { bg: '#1b2bff', fg: '#f3f1ea', accent: '#e6ff3b', night: '#0a0b1e' };

const maskCache = new Map();

function getMask(text, w, h, fontFamily) {
  const key = `${text}|${w}|${h}`;
  if (maskCache.has(key)) return maskCache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  let size = h * 0.8;
  const setFont = () => { g.font = `800 expanded ${size}px ${fontFamily}`; if ('fontStretch' in g) g.fontStretch = 'expanded'; };
  setFont();
  const m = g.measureText(text);
  size *= Math.min(1, (w * 0.94) / Math.max(m.width, 1));
  setFont();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';
  g.fillText(text, w / 2, h / 2 + size * 0.04);
  const data = g.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = data[i * 4 + 3] > 110 ? 1 : 0;
  const out = { mask, w, h };
  if (maskCache.size > 24) maskCache.clear();
  maskCache.set(key, out);
  return out;
}

/**
 * Draws the wordmark into `ctx` inside the rect (x, y, w, h).
 * @param {object} o — { text, freq, amp, t, rows, color, accent, lineWidth, fontFamily }
 */
export function drawSignalMark(ctx, x, y, w, h, o) {
  const text = (o.text || 'OSCILLO').toUpperCase().slice(0, 14);
  const res = Math.max(1, Math.round(w / 360));            // mask sampling step
  const mw = Math.round(w / res); const mh = Math.round(h / res);
  const { mask } = getMask(text, mw, mh, o.fontFamily || '"Archivo Variable", Archivo, sans-serif');
  const rows = o.rows || 46;
  const freq = o.freq ?? 0.5;
  const amp = o.amp ?? 0.5;
  const t = o.t || 0;
  const rowH = h / rows;

  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = o.lineWidth || Math.max(1, rowH * 0.34);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const accentRow = Math.floor(rows * 0.62);

  for (let r = 0; r < rows; r++) {
    const baseY = (r + 0.5) * rowH;
    const my = Math.min(mh - 1, Math.floor(baseY / res));
    ctx.beginPath();
    let drawing = false;
    const isAccent = o.accent && r === accentRow;
    ctx.strokeStyle = isAccent ? o.accent : o.color;
    for (let px = 0; px <= w; px += 2) {
      const mx = Math.min(mw - 1, Math.floor(px / res));
      const on = mask[my * mw + mx] === 1;
      // the signal: a carrier wave + slow modulation, stronger at the centre rows
      const env = Math.sin((r / rows) * Math.PI);
      const wave = Math.sin(px * 0.02 * (0.4 + freq * 2.4) + t * 2.2 + r * 0.35) * Math.sin(px * 0.0035 + t * 0.6);
      const yy = baseY + wave * rowH * (0.15 + amp * 2.4) * env;
      if (on) {
        if (!drawing) { ctx.moveTo(px, yy); drawing = true; } else ctx.lineTo(px, yy);
      } else if (drawing) {
        drawing = false;
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Live generator mounted inside the Oscillo case study. */
export function mountOscillo(block) {
  const canvas = block.querySelector('canvas');
  const stage = block.querySelector('.p-live__stage');
  const controls = block.querySelector('[data-live-controls]');
  const ctx = canvas.getContext('2d');
  const state = { text: 'OSCILLO', freq: 0.45, amp: 0.35, t: 0, playing: true };
  let raf = 0; let running = false; let last = 0;

  controls.innerHTML = `
    <label class="mono">Mot <input type="text" value="${state.text}" maxlength="12" spellcheck="false" autocomplete="off" aria-label="Mot à encoder" data-osc-text /></label>
    <label class="mono">Fréquence <input type="range" min="0" max="1" step="0.01" value="${state.freq}" data-osc-freq /></label>
    <label class="mono">Amplitude <input type="range" min="0" max="1" step="0.01" value="${state.amp}" data-osc-amp /></label>
    <button type="button" class="chip" aria-pressed="true" data-osc-play>Signal actif</button>`;
  controls.querySelector('[data-osc-text]').addEventListener('input', (e) => { state.text = e.target.value.replace(/[^\p{L}\p{N} &-]/gu, '') || ' '; draw(); });
  controls.querySelector('[data-osc-freq]').addEventListener('input', (e) => { state.freq = +e.target.value; draw(); });
  controls.querySelector('[data-osc-amp]').addEventListener('input', (e) => { state.amp = +e.target.value; draw(); });
  const play = controls.querySelector('[data-osc-play]');
  play.addEventListener('click', () => {
    state.playing = !state.playing;
    play.setAttribute('aria-pressed', String(state.playing));
    play.textContent = state.playing ? 'Signal actif' : 'Signal coupé';
    if (state.playing) start(); else draw();
  });
  stage.style.background = OSC_COLORS.bg;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    draw();
  }

  function draw() {
    const W = canvas.width; const H = canvas.height;
    ctx.fillStyle = OSC_COLORS.bg;
    ctx.fillRect(0, 0, W, H);
    const pad = W * 0.06;
    const markH = Math.min(H * 0.62, (W - pad * 2) * 0.36);
    drawSignalMark(ctx, pad, (H - markH) / 2, W - pad * 2, markH, {
      text: state.text, freq: state.freq, amp: state.amp, t: state.t,
      color: OSC_COLORS.fg, accent: OSC_COLORS.accent, rows: W < 700 ? 30 : 46,
    });
    ctx.fillStyle = OSC_COLORS.fg;
    ctx.font = `${Math.round(W * 0.012 + 8)}px "Geist Mono Variable", monospace`;
    ctx.textBaseline = 'top';
    ctx.fillText(`F ${(20 + state.freq * 180).toFixed(0)} HZ   A ${(state.amp * 100).toFixed(0)}%`, pad, pad * 0.6);
    ctx.textAlign = 'right';
    ctx.fillText('OSCILLO / SIGNAL ENGINE', W - pad, pad * 0.6);
    ctx.textAlign = 'left';
  }

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (state.playing) state.t += dt;
    draw();
    if (running && state.playing) raf = requestAnimationFrame(loop);
  }
  function start() {
    running = true;
    if (!state.playing) return;
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  return { start, stop, destroy: () => { stop(); ro.disconnect(); } };
}
