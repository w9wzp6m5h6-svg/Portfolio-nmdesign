/**
 * Showcase des projets — le cœur du portfolio, sur fond sombre.
 * Chaque projet est une scène avec sa propre mise en scène (data showcase.layout) :
 *   live    → le vrai site (L'Empreinte), explorable en direct dans la scène
 *   object  → l'objet en grand, l'écran du site flotte devant (Stride, Opale)
 *   cinema  → format cinéma 21:9, pellicule de vues (Vanta)
 *   space   → portrait d'espace, l'interface en surimpression (Quiet Rooms)
 *   art     → les œuvres, une à une (Afterimage)
 *   signal  → le signal génératif d'Oscillo, en direct, piloté par le pointeur
 * Interactions : profondeur au curseur (couches à vitesses différentes), vues à
 * parcourir (survol, clic, clavier), apparition cinématique, index de navigation.
 * Chaque scène ouvre l'étude de cas (#/work/slug) avec la transition partagée.
 */
import { gsap, ScrollTrigger, scrollToTarget } from '../core/scroll.js';
import { env } from '../core/env.js';
import { projects } from '../data/projects.js';
import { applyCss } from '../core/css.js';
import { esc } from '../core/escape.js';
import { asset } from '../core/asset.js';

const FINE = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

function caseHTML(p, i) {
  const t = p.theme;
  const sc = p.showcase || { layout: 'object', thumbs: [] };
  // visuel principal : le site lui-même pour le projet réel, le rendu (objet, voiture, œuvre) sinon
  const main = sc.layout === 'live' ? (p.card || p.cover) : sc.layout === 'cinema' ? (sc.thumbs?.[0] || p.cover) : p.cover;
  const float = (sc.layout === 'object' || sc.layout === 'space') && p.card ? p.card : null;
  const wide = sc.layout === 'cinema' || sc.layout === 'signal';
  const sizes = wide ? '(max-width: 900px) 100vw, 92vw' : '(max-width: 900px) 100vw, 64vw';
  const css = `--p-bg:${t.bg};--p-fg:${t.fg};--p-accent:${t.accent};--pos:${p.coverPos || '50% 50%'}`;
  // vues : visuel principal, vignettes du projet, et l'écran du site quand il n'est pas déjà à l'image
  const extra = [!float && p.card, sc.layout === 'cinema' && p.cover].filter((v) => v && v.src !== main.src);
  const views = [main, ...(sc.thumbs || []).filter((v) => v.src !== main.src), ...extra].filter((v, k, a) => a.findIndex((x) => x.src === v.src) === k).slice(0, 5);
  return `
  <article class="case case--${sc.layout}${t.light ? ' is-light' : ''}${i % 2 ? ' is-flip' : ''}" id="case-${esc(p.slug)}" data-project-card data-tags="${(p.tags || []).join(' ')}" data-css="${css}">
    <div class="case__stage"${p.site ? ' data-site' : ''}>
      <a class="case__media" href="#/work/${esc(p.slug)}" data-project="${esc(p.slug)}" data-cursor="Explorer le projet" aria-label="${esc(`${p.title} — ${p.subtitle}`)}">
        <span class="case__visual" data-project-media>${views.map((v, k) => `<img class="case__view${k === 0 ? ' is-on' : ''}" src="${v.src}" srcset="${v.srcset}" sizes="${sizes}" alt="${k === 0 ? esc(v.alt || p.cover.alt) : ''}" loading="lazy" decoding="async" />`).join('')}</span>
        ${float ? `<span class="case__float"><img src="${float.src}" srcset="${float.srcset}" sizes="(max-width: 900px) 60vw, 30vw" alt="" loading="lazy" decoding="async" /></span>` : ''}
        ${sc.layout === 'signal' ? '<canvas class="case__signal" aria-hidden="true"></canvas>' : ''}
      </a>
      ${p.site ? `<div class="case__site-frame" data-site-frame></div>
      <button class="case__site-go btn" type="button" data-site-launch="${asset(p.site)}" data-site-title="Site de Cynthia Rimo — L’Empreinte, aperçu interactif">Explorer le site en direct<span class="btn__arrow" aria-hidden="true">→</span></button>` : ''}
      ${views.length > 1 ? `<div class="case__views" role="group" aria-label="Vues du projet ${esc(p.title)}">${views.map((v, k) => `<button class="case__thumb" type="button" data-view="${k}" aria-pressed="${k === 0}" aria-label="Vue ${k + 1} sur ${views.length}"><img src="${v.src}" srcset="${v.srcset}" sizes="96px" alt="" loading="lazy" decoding="async" /></button>`).join('')}</div>` : ''}
    </div>
    <div class="case__info">
      <p class="case__meta label"><span class="case__num">${esc(p.num)}</span><span class="case__badge${p.real ? ' is-real' : ''}">${p.real ? 'Projet réel' : 'Concept'}</span><span>${esc(p.category)}</span></p>
      <h3 class="case__title p-title" data-style="${esc(t.title)}">${esc(p.title)}</h3>
      <p class="case__summary">${esc(p.subtitle)}</p>
      <p class="case__actions"><a class="case__cta link-arrow" href="#/work/${esc(p.slug)}" data-project="${esc(p.slug)}">Explorer le projet <span aria-hidden="true">→</span></a>${p.site ? '<button class="link-arrow" type="button" data-site-full hidden>Site en plein écran <span aria-hidden="true">↗</span></button>' : ''}</p>
    </div>
  </article>`;
}

/** Vues : survol ou clic sur une vignette = la vue principale change (fondu + léger zoom). */
function initViews(card) {
  const imgs = [...card.querySelectorAll('.case__view')];
  const thumbs = [...card.querySelectorAll('.case__thumb')];
  const signal = card.querySelector('.case__signal'); // Oscillo : la première vue est le signal en direct
  if (thumbs.length < 2) return;
  let current = 0;
  const show = (k) => {
    if (k === current) return;
    imgs[current].classList.remove('is-on');
    imgs[k].classList.add('is-on');
    signal?.classList.toggle('is-off', k !== 0);
    if (!env.reducedMotion) gsap.fromTo(imgs[k], { scale: 1.06 }, { scale: 1, duration: 1.2, ease: 'expo.out' });
    thumbs.forEach((b, i) => b.setAttribute('aria-pressed', String(i === k)));
    current = k;
  };
  thumbs.forEach((b, k) => {
    b.addEventListener('click', () => show(k));
    if (FINE()) b.addEventListener('pointerenter', () => show(k));
  });
}

/** Profondeur : l'image, l'écran flottant et la scène bougent à des vitesses différentes. */
function initDepth(card) {
  if (env.reducedMotion || !FINE()) return;
  const stage = card.querySelector('.case__stage');
  const visual = card.querySelector('.case__visual');
  const float = card.querySelector('.case__float');
  const q = (el, prop) => el && gsap.quickTo(el, prop, { duration: 1, ease: 'power3.out' });
  const vx = q(visual, 'x'); const vy = q(visual, 'y');
  const fx = q(float, 'x'); const fy = q(float, 'y');
  const rx = q(stage, 'rotationX'); const ry = q(stage, 'rotationY');
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    vx(x * -18); vy(y * -12);
    fx?.(x * 30); fy?.(y * 22);
    ry(x * 4); rx(y * -3);
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { vx(0); vy(0); fx?.(0); fy?.(0); rx(0); ry(0); });
}

/** Apparition : la scène s'ouvre comme un plan de cinéma, le texte suit. */
function initReveal(card) {
  if (env.reducedMotion) return;
  const stage = card.querySelector('.case__stage');
  const visual = card.querySelector('.case__visual');
  const float = card.querySelector('.case__float');
  const info = card.querySelectorAll('.case__meta, .case__title, .case__summary, .case__actions');
  gsap.set(stage, { clipPath: 'inset(10% 8% 10% 8% round 32px)' });
  gsap.set(visual, { scale: 1.18 });
  gsap.set(info, { autoAlpha: 0, y: 28 });
  if (float) gsap.set(float, { autoAlpha: 0, y: 80 });
  ScrollTrigger.create({
    trigger: card, start: 'top 82%', once: true,
    onEnter: () => {
      const tl = gsap.timeline()
        .to(stage, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' })
        .to(visual, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'scale' }, 0.15)
        .to(info, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, clearProps: 'transform,opacity,visibility' }, 0.45);
      if (float) tl.to(float, { autoAlpha: 1, y: 0, duration: 1.4, ease: 'expo.out' }, 0.55);
    },
  });
  if (float && FINE()) gsap.fromTo(float, { yPercent: 10 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
}

/** Oscillo : le signal tourne en direct ; le pointeur règle fréquence et amplitude. */
async function initSignal(card) {
  const canvas = card.querySelector('.case__signal');
  if (!canvas) return;
  const { drawSignalMark, OSC_COLORS } = await import('../project/live/oscillo.js');
  const ctx = canvas.getContext('2d');
  const state = { freq: 0.42, amp: 0.34, tf: 0.42, ta: 0.34, t: 1.7 };
  let raf = 0; let running = false; let last = 0;
  const draw = () => {
    const { width: w, height: h } = canvas;
    ctx.fillStyle = OSC_COLORS.bg; ctx.fillRect(0, 0, w, h);
    drawSignalMark(ctx, w * 0.06, h * 0.22, w * 0.88, h * 0.56, { text: 'OSCILLO', freq: state.freq, amp: state.amp, t: state.t, color: OSC_COLORS.fg, accent: OSC_COLORS.accent, rows: 46 });
  };
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    draw();
  };
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    state.t += dt * 0.6;
    state.freq += (state.tf - state.freq) * 0.06;
    state.amp += (state.ta - state.amp) * 0.06;
    draw();
    if (running) raf = requestAnimationFrame(loop);
  };
  const start = () => { if (running || env.reducedMotion) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  new ResizeObserver(resize).observe(canvas);
  resize();
  card.querySelector('.case__stage').addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    state.tf = 0.15 + ((e.clientX - r.left) / r.width) * 0.7;
    state.ta = 0.1 + (1 - (e.clientY - r.top) / r.height) * 0.6;
  }, { passive: true });
  ScrollTrigger.create({ trigger: card, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive && !document.hidden ? start() : stop()) });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : ScrollTrigger.isInViewport(card) && start()));
}

/** Index : la liste des projets reste à portée pendant le showcase (grand écran). */
function initIndex(section, cards) {
  const nav = document.createElement('nav');
  nav.className = 'showcase__index';
  nav.setAttribute('aria-label', 'Projets');
  nav.innerHTML = cards.map((c) => {
    const p = projects.find((x) => `case-${x.slug}` === c.id);
    return `<a href="#${c.id}" data-target="${c.id}" aria-label="${esc(`${p.num} — ${p.title}`)}"><span class="showcase__index-num">${esc(p.num)}</span><span class="showcase__index-name">${esc(p.title)}</span></a>`;
  }).join('');
  section.append(nav);
  const links = [...nav.querySelectorAll('a')];
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    scrollToTarget(document.getElementById(a.dataset.target));
  });
  ScrollTrigger.create({ trigger: section.querySelector('.showcase__list'), start: 'top 70%', end: 'bottom 40%', onToggle: (s) => nav.classList.toggle('is-on', s.isActive) });
  cards.forEach((c) => ScrollTrigger.create({
    trigger: c, start: 'top 50%', end: 'bottom 50%',
    onToggle: (s) => { if (s.isActive) links.forEach((l) => l.classList.toggle('is-active', l.dataset.target === c.id)); },
  }));
  return { refresh: () => links.forEach((l) => { l.hidden = document.getElementById(l.dataset.target)?.hidden; }) };
}

export function initWorks() {
  const list = document.querySelector('[data-works]');
  if (!list) return;
  const mode = list.dataset.works;
  const items = mode === 'home' ? projects.filter((p) => p.selected) : projects;
  list.innerHTML = items.map(caseHTML).join('');
  applyCss(list);
  const cards = [...list.children];
  cards.forEach((card) => { initViews(card); initDepth(card); initReveal(card); initSignal(card); });
  const index = initIndex(list.closest('.showcase'), cards);

  if (mode === 'home') return;
  const bar = document.querySelector('[data-filters]');
  const count = bar?.querySelector('[data-count]');
  let filtered = false;
  const apply = (filter) => {
    let n = 0;
    cards.forEach((c) => {
      const on = filter === 'all' || c.dataset.tags.split(' ').includes(filter);
      c.hidden = !on;
      if (!on) return;
      n += 1;
      // après un filtrage, une scène pas encore apparue s'affiche directement
      if (filtered) gsap.set(c.querySelectorAll('.case__stage, .case__visual, .case__float, .case__meta, .case__title, .case__summary, .case__actions'), { clearProps: 'clipPath,transform,scale,opacity,visibility' });
    });
    if (count) count.textContent = `${n} projet${n > 1 ? 's' : ''}`;
    index.refresh();
    ScrollTrigger.refresh();
    filtered = true;
  };
  bar?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    bar.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply(b.dataset.filter);
  });
  apply('all');
}
