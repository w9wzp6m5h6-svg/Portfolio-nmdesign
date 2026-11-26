/**
 * The Object — binds the sneaker stage to its interface.
 * The 3D module and model only load when the section approaches the viewport.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';
import { model, variants, hotspots } from '../data/sneaker.js';
import { asset } from '../core/asset.js';
import { applyCss } from '../core/css.js';
import { esc } from '../core/escape.js';

export function initObject() {
  const section = document.querySelector('.object');
  if (!section) return;
  const canvas = section.querySelector('.object__gl');
  const layer = section.querySelector('.object__hotspots');
  const loadingText = section.querySelector('.object__loading-text');
  const loadingBar = section.querySelector('.object__loading-bar i');
  const swatchWrap = section.querySelector('[data-variants]');
  const panel = {
    i: section.querySelector('.object__panel-i'),
    t: section.querySelector('.object__panel-t'),
    d: section.querySelector('.object__panel-d'),
    root: section.querySelector('.object__panel'),
  };
  const hint = section.querySelector('.object__hint');
  let stage = null;
  let activeSpot = null;
  const controls = section.querySelector('.object__controls');

  section.querySelector('.object__title').innerHTML = model.title;
  section.querySelector('.object__credit').textContent = model.credit;
  // controls stay disabled until the model is ready, so no button ever does nothing
  controls.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  if (!hotspots.length) panel.root.hidden = true;

  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Sneaker 3D interactive. Glissez, ou utilisez les flèches du clavier, pour la faire pivoter. Plus et moins pour zoomer.');
  canvas.dataset.cursor = 'Faire pivoter';

  // swatches ----------------------------------------------------------------
  swatchWrap.innerHTML = variants.map((v, i) => `
    <button type="button" class="swatch" data-variant="${v.id}" aria-pressed="${i === 0}" data-css="--c1:${v.c1};--c2:${v.c2}">
      <span class="swatch__chip" aria-hidden="true"></span><span class="swatch__name">${esc(v.name)}</span>
    </button>`).join('');
  applyCss(swatchWrap);

  // hotspots ----------------------------------------------------------------
  const spotEls = hotspots.map((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hotspot';
    b.setAttribute('aria-label', `Détail ${i + 1} : ${h.label}`);
    b.innerHTML = `<span class="hotspot__dot"></span><span class="hotspot__label mono">${String(i + 1).padStart(2, '0')} ${esc(h.label)}</span>`;
    b.addEventListener('click', () => selectSpot(i));
    layer.append(b);
    return b;
  });

  function setPanel(kicker, title, text) {
    const nodes = [panel.t, panel.d];
    gsap.timeline()
      .to(nodes, { autoAlpha: 0, y: -6, duration: 0.2, ease: 'power2.in' })
      .add(() => { panel.i.textContent = kicker; panel.t.textContent = title; panel.d.textContent = text; })
      .fromTo(nodes, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.05 });
  }

  function selectSpot(i) {
    if (!stage) return;
    activeSpot = i;
    const h = hotspots[i];
    spotEls.forEach((el, j) => el.classList.toggle('is-active', j === i));
    stage.focus(h);
    setPanel(`${String(i + 1).padStart(2, '0')} / ${String(hotspots.length).padStart(2, '0')}`, h.label, h.text);
  }

  function clearSpot() {
    activeSpot = null;
    spotEls.forEach((el) => el.classList.remove('is-active'));
    setPanel('—', 'Choisissez un point', 'Sélectionnez un repère sur la chaussure : la caméra vient se placer sur ce détail.');
  }

  function placeHotspots(s) {
    hotspots.forEach((h, i) => {
      const p = s.project(h.pos, h.normal);
      const el = spotEls[i];
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      el.classList.toggle('is-behind', !p.visible);
      el.tabIndex = p.visible ? 0 : -1;
    });
  }

  // controls ----------------------------------------------------------------
  swatchWrap.addEventListener('click', (e) => {
    const b = e.target.closest('[data-variant]');
    if (!b || !stage) return;
    swatchWrap.querySelectorAll('[data-variant]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    stage.setVariant(b.dataset.variant);
  });
  section.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
    if (!stage) return;
    section.querySelectorAll('[data-mode]').forEach((x) => {
      const on = x === b;
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-pressed', String(on));
    });
    stage.setMode(b.dataset.mode);
    section.classList.toggle('is-xray', b.dataset.mode === 'xray');
  }));
  section.querySelectorAll('[data-zoom]').forEach((b) => b.addEventListener('click', () => stage?.zoom(+b.dataset.zoom)));
  section.querySelector('[data-reset]').addEventListener('click', () => { stage?.reset(); clearSpot(); });

  // lazy boot ---------------------------------------------------------------
  // repli élégant : rendu fixe de l'objet à la place de la scène 3D
  function showFallback(message) {
    stage = null;
    const img = document.createElement('img');
    img.className = 'object__fallback';
    img.src = asset('media/works/stride/shoe_profile-1400.webp');
    img.alt = 'Rendu de la sneaker en maille, vue de profil';
    img.decoding = 'async';
    canvas.replaceWith(img);
    loadingText.textContent = message;
    section.classList.add('is-fallback');
    controls.hidden = true;
    panel.root.hidden = true;
    hint.hidden = true;
  }

  async function boot() {
    if (!env.webgl) {
      showFallback('Vue 3D indisponible sur cet appareil : voici un rendu de l’objet.');
      return;
    }
    try {
      const { SneakerStage } = await import('../three/sneaker-stage.js');
      stage = new SneakerStage(canvas, {
        onFrame: placeHotspots,
      });
    } catch (err) {
      console.warn('[object] WebGL indisponible', err);
      showFallback('Vue 3D indisponible sur cet appareil : voici un rendu de l’objet.');
      return;
    }
    stage.onInteract = () => gsap.to(hint, { autoAlpha: 0, duration: 0.6 });
    const url = asset(env.lite ? model.lite : model.hd);
    let available = [];
    try {
      available = await stage.load(url, (p) => {
        loadingBar.style.transform = `scaleX(${p})`;
        loadingText.textContent = `Chargement de l’objet — ${Math.round(p * 100)} %`;
      }, { rotation: model.rotation });
    } catch (err) {
      console.error('[object] failed to load model', err);
      stage?.dispose?.();
      showFallback('L’objet 3D n’a pas pu être chargé : voici un rendu fixe. Rechargez la page pour réessayer.');
      return;
    }
    // only offer colourways that the loaded file actually contains
    const offered = variants.filter((v) => available.includes(v.id));
    swatchWrap.querySelectorAll('[data-variant]').forEach((b) => { if (!available.includes(b.dataset.variant)) b.remove(); });
    if (!offered.length) swatchWrap.closest('.object__group').hidden = true;
    else stage.setVariant(offered[0].id);
    controls.querySelectorAll('button').forEach((b) => { b.disabled = false; });
    section.classList.add('is-ready');
    if (import.meta.env.DEV) window.__stage = stage;

    ScrollTrigger.create({
      trigger: section, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (self.isActive ? stage.start() : stage.stop()),
    });
    if (ScrollTrigger.isInViewport(section)) stage.start();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stage.stop();
      else if (ScrollTrigger.isInViewport(section)) stage.start();
    });
    new ResizeObserver(() => stage.resize()).observe(canvas);
  }

  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      // boot in idle time so parsing/compiling never lands in the middle of a scroll gesture
      const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 120));
      idle(() => boot(), { timeout: 1200 });
    }
  }, { rootMargin: '120% 0px' });
  io.observe(section);

  // entrance
  if (!env.reducedMotion) {
    const title = section.querySelector('.object__title');
    gsap.from([section.querySelector('.object__kicker'), title, section.querySelector('.object__lead')], {
      y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: section, start: 'top 70%', once: true },
    });
    gsap.from([panel.root, section.querySelector('.object__controls')], {
      y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: section, start: 'top 40%', once: true },
    });
  }

  return { selectSpot, clearSpot, get activeSpot() { return activeSpot; } };
}
