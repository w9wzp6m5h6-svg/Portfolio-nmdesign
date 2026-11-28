/**
 * ÉLAN — branche la canette 3D sur une interface existante (site de marque ou étude de cas).
 * Le balisage appartient à la page ; ce module le remplit et le pilote :
 *   [data-can-canvas]     le canvas WebGL
 *   [data-can-variants]   reçoit un bouton par saveur
 *   [data-can-field=…]    name · notes · mood · caffeine · sugar · kcal · index
 *   [data-can-tool=…]     zoom-in · zoom-out · front · back · top · side · reset
 *   [data-can-fallback]   image fixe, affichée si WebGL est indisponible
 * Three.js n'est chargé qu'à l'appel (import dynamique).
 */
import { env } from '../../core/env.js';
import { esc } from '../../core/escape.js';
import { VARIANTS, variantById } from './data.js';

export function paintVariant(root, v) {
  root.style.setProperty('--can-body', v.body);
  root.style.setProperty('--can-accent', v.accent);
  root.style.setProperty('--can-page', v.page);
  root.dataset.variant = v.id;
  const i = VARIANTS.indexOf(v);
  const fields = {
    name: v.name, notes: v.notes, mood: v.mood,
    caffeine: `${v.caffeine} mg`, sugar: `${v.sugar} g`, kcal: `${v.kcal} kcal`,
    index: `${String(i + 1).padStart(2, '0')} / ${String(VARIANTS.length).padStart(2, '0')}`,
  };
  root.querySelectorAll('[data-can-field]').forEach((el) => {
    const value = fields[el.dataset.canField];
    if (value !== undefined) el.textContent = value;
  });
  root.querySelectorAll('[data-can-variant]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.canVariant === v.id)));
}

/**
 * @param {HTMLElement} root
 * @param {{ variant?: string, onVariant?: (v: object) => void, autostart?: boolean }} opts
 * @returns {Promise<{ start(): void, stop(): void, destroy(): void, setVariant(id: string): void }>}
 */
export async function mountCan(root, { variant = VARIANTS[0].id, onVariant, autostart = true } = {}) {
  const canvas = root.querySelector('[data-can-canvas]');
  const list = root.querySelector('[data-can-variants]');
  const fallback = root.querySelector('[data-can-fallback]');
  let current = variantById(variant);

  if (list && !list.children.length) {
    list.innerHTML = VARIANTS.map((v) => `
      <button type="button" class="can-swatch" data-can-variant="${v.id}" aria-pressed="false" style-var="${v.body}">
        <span class="can-swatch__dot" aria-hidden="true"></span><span class="can-swatch__name">${esc(v.short)}</span>
      </button>`).join('');
    // couleur des pastilles via CSSOM (compatible CSP)
    list.querySelectorAll('[style-var]').forEach((b) => { b.style.setProperty('--dot', b.getAttribute('style-var')); b.removeAttribute('style-var'); });
  }
  paintVariant(root, current);

  let stage = null;
  const set = (id) => {
    const v = variantById(id);
    if (v === current) return;
    current = v;
    paintVariant(root, v);
    stage?.setVariant(v.id);
    onVariant?.(v);
  };
  list?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-can-variant]');
    if (b) set(b.dataset.canVariant);
  });

  const noGL = () => {
    root.classList.add('is-static');
    if (fallback) fallback.hidden = false;
    canvas?.setAttribute('hidden', '');
  };
  if (!env.webgl || !canvas) {
    noGL();
    return { start() {}, stop() {}, destroy() {}, setVariant: set };
  }

  let visible = false;
  try {
    const { CanStage } = await import('./can-stage.js');
    stage = new CanStage(canvas, { variant: current.id });
    await stage.init();
  } catch (err) {
    console.warn('ÉLAN : rendu 3D indisponible', err);
    stage = null;
    noGL();
    return { start() {}, stop() {}, destroy() {}, setVariant: set };
  }
  root.classList.add('is-ready');
  if (fallback) fallback.hidden = true;

  root.querySelectorAll('[data-can-tool]').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.canTool;
    if (t === 'zoom-in') stage.zoom(1);
    else if (t === 'zoom-out') stage.zoom(-1);
    else if (t === 'reset') stage.reset();
    else stage.view(t);
  }));

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !document.hidden) stage?.start(); else stage?.stop();
  }, { threshold: 0.02 });
  io.observe(canvas);
  const onVis = () => { if (document.hidden) stage?.stop(); else if (visible) stage?.start(); };
  document.addEventListener('visibilitychange', onVis);

  return {
    start() { if (visible || !autostart) stage?.start(); },
    stop() { stage?.stop(); },
    setVariant: set,
    destroy() {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      stage?.dispose();
      stage = null;
    },
  };
}
