/**
 * PORTANT — le portant de vêtements.
 *
 * Ce n'est pas un carrousel : c'est une petite simulation physique.
 *  - la tringle : une position continue (en nombre de pièces) avec inertie au lâcher,
 *    puis un ressort qui pose la pièce la plus proche au centre ;
 *  - les pièces se tassent loin du centre (comme des cintres poussés sur une barre),
 *    pivotent légèrement et reculent en profondeur ; la pièce choisie avance ;
 *  - chaque cintre est un pendule amorti, entraîné par l'accélération de sa propre
 *    position : il se balance quand on pousse la tringle, puis se calme ;
 *  - le vêtement suit son cintre avec un léger retard (le tissu « traîne »).
 * Souris, doigt (glisser), molette horizontale, clavier (← →, Début, Fin), clic sur
 * une pièce. Mouvement réduit : pas de balancement, déplacements directs.
 */
import { env } from '../../core/env.js';
import { esc } from '../../core/escape.js';
import { asset } from '../../core/asset.js';
import { PIECES, euro } from './data.js';

const HANGERS = {
  wire: `<path class="pt-hanger__metal" d="M300 80 L300 60 Q300 48 310 40 Q322 30 318 16 Q312 4 300 6 Q288 8 287 20" />
    <path class="pt-hanger__metal" d="M300 80 Q296 88 300 94 L104 190 Q96 200 110 206 L490 206 Q504 200 496 190 L300 94" />
    <path class="pt-hanger__shine" d="M300 96 L120 186" />`,
  clip: `<path class="pt-hanger__metal" d="M300 80 L300 60 Q300 48 310 40 Q322 30 318 16 Q312 4 300 6 Q288 8 287 20" />
    <path class="pt-hanger__metal" d="M300 80 L300 158 M128 158 L472 158" />
    <rect class="pt-hanger__clip" x="146" y="150" width="30" height="58" rx="4" /><rect class="pt-hanger__clip" x="424" y="150" width="30" height="58" rx="4" />
    <path class="pt-hanger__shine" d="M134 155 L466 155" />`,
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * @param {HTMLElement} root
 * @param {{ compact?: boolean, onAdd?: (piece, size) => void, onSelect?: (piece, i) => void, start?: number }} opts
 */
export function mountRack(root, { compact = false, onAdd, onSelect, start = 0 } = {}) {
  const N = PIECES.length;
  const H = compact ? 'h4' : 'h2'; // niveau de titre : sous le titre du bloc dans l'étude de cas, sous le h1 sur le site
  root.classList.add('pt-rack');
  if (compact) root.classList.add('pt-rack--compact');
  root.innerHTML = `
    <div class="pt-rack__stage" data-cursor="Glissez le portant">
      <div class="pt-rack__rail" aria-hidden="true"><i class="pt-rack__mount"></i><i class="pt-rack__mount"></i></div>
      <ul class="pt-rack__items" aria-label="Collection : ${N} pièces sur le portant">
        ${PIECES.map((p, i) => `
        <li class="pt-item" data-i="${i}">
          <button type="button" class="pt-item__hit" data-i="${i}" aria-pressed="false" aria-label="${esc(`${p.name}, ${p.color}, ${euro(p.price)}`)}">
            <span class="pt-item__swing">
              <svg class="pt-hanger" viewBox="0 0 600 1120" aria-hidden="true">${HANGERS[p.hanger]}</svg>
              <span class="pt-item__cloth">
                <img src="${asset(`media/works/portant/garments/${p.id}-480.webp`)}" srcset="${asset(`media/works/portant/garments/${p.id}-480.webp`)} 480w, ${asset(`media/works/portant/garments/${p.id}-900.webp`)} 900w"
                  sizes="(max-width: 700px) 56vw, 24vw" width="480" height="800" alt="" draggable="false" decoding="async" ${i < 4 ? '' : 'loading="lazy"'} />
              </span>
            </span>
          </button>
        </li>`).join('')}
      </ul>
      <p class="pt-rack__caption" aria-hidden="true"><span data-pt="name"></span><span data-pt="price"></span></p>
      <p class="pt-rack__hint" aria-hidden="true">Glissez le portant</p>
    </div>
    <div class="pt-rack__ui">
      <div class="pt-rack__nav">
        <button type="button" class="pt-rack__arrow" data-pt-step="-1" aria-label="Pièce précédente">←</button>
        <span class="pt-rack__count" data-pt="count"></span>
        <button type="button" class="pt-rack__arrow" data-pt-step="1" aria-label="Pièce suivante">→</button>
      </div>
      <div class="pt-detail">
        <div class="pt-detail__text" aria-live="polite">
          <p class="pt-detail__k" data-pt="kind"></p>
          <${H} class="pt-detail__name" data-pt="name"></${H}>
          <p class="pt-detail__price" data-pt="price"></p>
          <p class="pt-detail__desc" data-pt="desc"></p>
          <p class="pt-detail__matter" data-pt="matter"></p>
        </div>
        <fieldset class="pt-sizes">
          <legend class="pt-sizes__legend">Taille</legend>
          <div class="pt-sizes__list" data-pt="sizes"></div>
        </fieldset>
        <div class="pt-detail__actions">
          <button type="button" class="pt-add" data-pt-add>Ajouter au sac</button>
          <p class="pt-detail__msg" role="status" data-pt="msg"></p>
        </div>
      </div>
    </div>`;

  const stage = root.querySelector('.pt-rack__stage');
  const items = [...root.querySelectorAll('.pt-item')];
  const hits = items.map((li) => li.querySelector('.pt-item__hit'));
  const swings = items.map((li) => li.querySelector('.pt-item__swing'));
  const cloths = items.map((li) => li.querySelector('.pt-item__cloth'));
  const field = (k) => root.querySelectorAll(`[data-pt="${k}"]`);
  const set = (k, v) => field(k).forEach((el) => { el.textContent = v; });

  // état physique
  let pos = clamp(start, 0, N - 1);
  let vel = 0;
  let target = null;
  let dragging = false;
  const sw = PIECES.map(() => ({ th: 0, om: 0, ph: 0, pom: 0, x: 0, vx: 0 }));
  let W = 0; let S0 = 0; let S1 = 0;
  let selected = -1;
  let size = null;
  let raf = 0; let last = 0; let visible = false; let calmFrames = 0;
  const calm = () => env.reducedMotion;

  function measure() {
    W = stage.clientWidth;
    const itemW = items[0].offsetWidth || 240;
    S0 = itemW * (compact ? 0.98 : 1.02);
    S1 = itemW * 0.36;
  }

  const xOf = (d) => S1 * d + (S0 - S1) * Math.tanh(d);

  function select(i, { announce = true } = {}) {
    i = clamp(i, 0, N - 1);
    if (i === selected) return;
    selected = i;
    const p = PIECES[i];
    hits.forEach((h, k) => h.setAttribute('aria-pressed', String(k === i)));
    items.forEach((li, k) => li.classList.toggle('is-selected', k === i));
    set('name', p.name); set('price', euro(p.price)); set('desc', p.desc);
    set('matter', `${p.matter} · ${p.color}`);
    set('kind', `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')} — ${p.kind}`);
    set('count', `${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}`);
    size = null;
    root.querySelector('[data-pt="sizes"]').innerHTML = p.sizes.map((s) => `
      <label class="pt-size${p.out.includes(s) ? ' is-out' : ''}">
        <input type="radio" name="pt-size-${root.dataset.rackId}" value="${esc(s)}" ${p.out.includes(s) ? 'disabled' : ''} />
        <span>${esc(s)}</span>${p.out.includes(s) ? '<span class="visually-hidden"> (épuisé)</span>' : ''}
      </label>`).join('');
    set('msg', '');
    root.classList.remove('is-swapping');
    void root.offsetWidth; // relance la petite animation du panneau
    root.classList.add('is-swapping');
    if (announce) onSelect?.(p, i);
  }

  function goTo(i) {
    target = clamp(i, 0, N - 1);
    vel = 0;
    wake();
  }

  function layout(dt) {
    for (let i = 0; i < N; i++) {
      const d = i - pos;
      const x = xOf(d);
      const ad = Math.abs(d);
      const z = -150 * Math.pow(Math.min(ad, 3.2), 0.85) + (ad < 0.5 ? 70 * (1 - ad * 2) : 0);
      const ry = -clamp(d, -3, 3) * 13;
      const fade = clamp(4.2 - ad, 0, 1);
      items[i].style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
      items[i].style.opacity = fade.toFixed(3);
      items[i].style.zIndex = String(100 - Math.round(ad * 10));
      items[i].style.visibility = fade <= 0 ? 'hidden' : '';

      // balancement : pendule amorti entraîné par l'accélération horizontale de la pièce
      const s = sw[i];
      if (dt > 0 && !calm()) {
        const vx = (x - s.x) / dt;
        const ax = (vx - s.vx) / dt;
        s.vx = vx;
        const accel = -26 * s.th - 3.4 * s.om - clamp(ax, -20000, 20000) * 0.00042;
        s.om += accel * dt;
        s.th = clamp(s.th + s.om * dt, -0.34, 0.34);
        // le tissu suit avec retard
        const pacc = -70 * (s.ph - s.th) - 8 * s.pom;
        s.pom += pacc * dt;
        s.ph += s.pom * dt;
      }
      s.x = x;
      const lag = s.ph - s.th;
      swings[i].style.transform = `rotate(${(s.th * 57.3).toFixed(2)}deg)`;
      cloths[i].style.transform = `rotate(${(lag * 40).toFixed(2)}deg) skewX(${(lag * -22).toFixed(2)}deg)`;
    }
  }

  function step(t) {
    const dt = Math.min((t - last) / 1000 || 0.016, 0.05);
    last = t;
    if (!dragging) {
      if (target === null && Math.abs(vel) > 2.2) {
        // glisse avec frottement
        pos += vel * dt;
        vel *= Math.exp(-4.2 * dt);
        if (pos < -0.4 || pos > N - 0.6) vel *= Math.exp(-14 * dt);
      } else {
        if (target === null) target = clamp(Math.round(pos + vel * 0.12), 0, N - 1);
        // ressort critique vers la pièce visée
        const k = 70; const c = 2 * Math.sqrt(k) * 0.92;
        const a = k * (target - pos) - c * vel;
        vel += a * dt;
        pos += vel * dt;
        if (Math.abs(target - pos) < 0.0015 && Math.abs(vel) < 0.01) { pos = target; vel = 0; }
      }
    }
    if (calm() && !dragging && target !== null) { pos = target; vel = 0; }
    pos = clamp(pos, -0.8, N - 0.2);
    const near = clamp(Math.round(pos), 0, N - 1);
    if (near !== selected) select(near);
    layout(dt);
    root.classList.toggle('is-moving', dragging || Math.abs(vel) > 0.05);

    const settled = !dragging && vel === 0 && sw.every((s) => Math.abs(s.th) < 0.0008 && Math.abs(s.om) < 0.002 && Math.abs(s.ph - s.th) < 0.0008);
    calmFrames = settled ? calmFrames + 1 : 0;
    if (calmFrames > 20 || !visible) { raf = 0; return; }
    raf = requestAnimationFrame(step);
  }

  function wake() {
    if (raf || !visible) return;
    last = performance.now();
    calmFrames = 0;
    raf = requestAnimationFrame(step);
  }

  /* --- entrées --------------------------------------------------------------- */
  let downX = 0; let downY = 0; let startPos = 0; let lastX = 0; let lastT = 0; let moved = 0; let downIndex = -1; let pid = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pid = e.pointerId;
    downX = lastX = e.clientX; downY = e.clientY;
    lastT = performance.now();
    startPos = pos; moved = 0;
    downIndex = Number(e.target.closest('[data-i]')?.dataset.i ?? -1);
    dragging = true; target = null; vel = 0;
    stage.setPointerCapture(e.pointerId);
    root.classList.add('is-handled');
    wake();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = e.clientX - downX;
    moved = Math.max(moved, Math.abs(dx));
    let p = startPos - dx / S0;
    if (p < 0) p *= 0.35; // résistance au bout de la tringle
    if (p > N - 1) p = N - 1 + (p - (N - 1)) * 0.35;
    const now = performance.now();
    const dtm = Math.max(now - lastT, 1) / 1000;
    const inst = -(e.clientX - lastX) / S0 / dtm;
    vel = vel * 0.6 + inst * 0.4;
    lastX = e.clientX; lastT = now;
    pos = p;
  });
  const release = (e) => {
    if (!dragging || e.pointerId !== pid) return;
    dragging = false;
    if (moved < 6 && Math.abs(e.clientY - downY) < 8) {
      vel = 0;
      if (downIndex >= 0) goTo(downIndex); else target = clamp(Math.round(pos), 0, N - 1);
    } else {
      target = null;
      if (performance.now() - lastT > 90) vel = 0; // lâché à l'arrêt
      vel = clamp(vel, -14, 14);
    }
    wake();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  // la molette verticale reste au défilement de la page ; le geste horizontal pousse la tringle
  let wheelTimer = 0;
  stage.addEventListener('wheel', (e) => {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!dx) return;
    e.preventDefault();
    target = null; vel = 0;
    pos = clamp(pos + dx / S0 * 0.9, -0.3, N - 0.7);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { target = clamp(Math.round(pos), 0, N - 1); wake(); }, 120);
    wake();
  }, { passive: false });
  // clic clavier sur une pièce (Entrée / Espace) : la pièce vient au centre
  hits.forEach((h, i) => h.addEventListener('click', (e) => { if (e.detail === 0) goTo(i); }));
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('.pt-sizes')) return;
    const k = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (k) { e.preventDefault(); goTo((target ?? selected) + k); hits[clamp((target ?? selected), 0, N - 1)].focus({ preventScroll: true }); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End') { e.preventDefault(); goTo(N - 1); }
  });
  root.querySelectorAll('[data-pt-step]').forEach((b) => b.addEventListener('click', () => goTo((target ?? selected) + Number(b.dataset.ptStep))));
  // effleurer un cintre le fait bouger un peu
  if (env.finePointer) items.forEach((li, i) => li.addEventListener('pointerenter', () => { if (!dragging && !calm()) { sw[i].om += i === selected ? 0.25 : 0.6; wake(); } }));

  root.querySelector('[data-pt="sizes"]').parentElement.addEventListener('change', (e) => {
    size = e.target.value;
    set('msg', '');
  });
  root.querySelector('[data-pt-add]').addEventListener('click', () => {
    const p = PIECES[selected];
    if (!size) { set('msg', 'Choisissez d’abord une taille.'); root.querySelector('.pt-size:not(.is-out) input')?.focus(); return; }
    onAdd?.(p, size);
    set('msg', `${p.name}, taille ${size} : ajouté au sac. Concept — rien n’est vendu.`);
  });

  root.dataset.rackId = root.dataset.rackId || Math.random().toString(36).slice(2, 7);
  measure();
  select(clamp(Math.round(pos), 0, N - 1), { announce: false });
  layout(0);

  // entrée : la tringle glisse jusqu'à la première pièce, les cintres se balancent
  let entered = false;
  const ro = new ResizeObserver(() => { measure(); layout(0); });
  ro.observe(stage);
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !entered) {
      entered = true;
      if (!calm()) { pos = start + 2.6; target = start; layout(0); }
    }
    if (visible) wake();
  }, { threshold: 0.15 });
  io.observe(stage);

  return {
    start() { visible = true; wake(); },
    stop() { visible = false; cancelAnimationFrame(raf); raf = 0; },
    destroy() { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); raf = 0; },
    goTo,
    get selected() { return selected; },
  };
}
