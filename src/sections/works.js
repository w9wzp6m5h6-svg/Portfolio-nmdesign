/**
 * Projets — le centre du portfolio.
 * Chaque projet est une « scène » : un plateau à sa couleur, l'écran du site au
 * premier plan, son rendu (objet, matière) en arrière-plan, et le titre dans la
 * typographie de son identité. Même système, personnalités différentes.
 *  - accueil (data-works="home")  : la sélection, en grandes scènes alternées
 *  - page Projets (data-works="all") : tous les projets, grille rythmée + filtres
 * Chaque scène ouvre l'étude de cas (#/work/slug) avec la transition partagée.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';
import { projects } from '../data/projects.js';
import { applyCss } from '../core/css.js';
import { esc } from '../core/escape.js';

function sceneHTML(p, { size }) {
  const t = p.theme;
  const screen = p.card;
  const big = size === 'feature';
  const sizes = big ? '(max-width: 900px) 92vw, 62vw' : '(max-width: 900px) 92vw, 46vw';
  const css = `--p-bg:${t.bg};--p-fg:${t.fg};--p-accent:${t.accent};--pos:${p.coverPos || '50% 50%'}`;
  const stage = screen
    ? `<span class="scene__object"><img src="${p.cover.src}" srcset="${p.cover.srcset}" sizes="${big ? '(max-width: 900px) 50vw, 30vw' : '(max-width: 900px) 50vw, 22vw'}" alt="" loading="lazy" decoding="async" /></span>
       <span class="scene__screen" data-project-media><img src="${screen.src}" srcset="${screen.srcset}" sizes="${sizes}" alt="${esc(screen.alt)}" loading="lazy" decoding="async" /></span>`
    : `<span class="scene__screen scene__screen--full" data-project-media><img src="${p.cover.src}" srcset="${p.cover.srcset}" sizes="${sizes}" alt="${esc(p.cover.alt)}" loading="lazy" decoding="async" /></span>`;
  return `
  <article class="scene scene--${size}${screen ? '' : ' scene--flat'}${t.light ? ' is-light' : ''}" data-project-card data-tags="${(p.tags || []).join(' ')}" data-css="${css}">
    <a class="scene__link" href="#/work/${esc(p.slug)}" data-project="${esc(p.slug)}" data-cursor="Voir le projet" aria-label="${esc(`${p.title} — ${p.subtitle}`)}">
      <div class="scene__stage">${stage}</div>
      <div class="scene__info">
        <p class="scene__meta mono"><span class="scene__num">${esc(p.num)}</span><span class="scene__badge${p.real ? ' is-real' : ''}">${p.real ? 'Projet réel' : 'Concept'}</span><span class="scene__cat">${esc(p.category)}</span></p>
        <h3 class="scene__title p-title" data-style="${esc(t.title)}">${esc(p.title)}</h3>
        <p class="scene__summary">${esc(p.subtitle)}</p>
        <p class="scene__cta mono">Voir l'étude de cas <span aria-hidden="true">→</span></p>
      </div>
    </a>
  </article>`;
}

/** Apparition et profondeur : le plateau s'ouvre, l'écran et l'objet montent à des vitesses différentes. */
function animate(scenes) {
  if (env.reducedMotion) return;
  const deep = matchMedia('(min-width: 901px)').matches;
  scenes.forEach((scene) => {
    const stage = scene.querySelector('.scene__stage');
    const screen = scene.querySelector('.scene__screen');
    const object = scene.querySelector('.scene__object');
    const info = scene.querySelectorAll('.scene__meta, .scene__title, .scene__summary, .scene__cta');
    gsap.set(stage, { clipPath: 'inset(12% 6% 12% 6% round 14px)', autoAlpha: 0 });
    gsap.set(info, { autoAlpha: 0, y: 24 });
    ScrollTrigger.create({
      trigger: scene, start: 'top 85%', once: true,
      onEnter: () => {
        const tl = gsap.timeline()
          .to(stage, { clipPath: 'inset(0% 0% 0% 0% round 0px)', autoAlpha: 1, duration: 1.3, ease: 'expo.out', clearProps: 'clipPath,opacity,visibility' })
          .from(screen, { scale: 0.94, duration: 1.4, ease: 'expo.out' }, 0.1)
          .to(info, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity,visibility' }, 0.25);
        if (object) tl.from(object, { y: 110, rotation: -4, duration: 1.6, ease: 'expo.out' }, 0.15);
      },
    });
    if (deep) {
      // parallaxe : l'objet (arrière-plan) et l'écran (premier plan) glissent à des vitesses opposées
      const st = { trigger: scene, start: 'top bottom', end: 'bottom top', scrub: true };
      if (object) gsap.fromTo(object.querySelector('img'), { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: st });
      gsap.fromTo(screen, { y: 28 }, { y: -28, ease: 'none', scrollTrigger: { ...st } });
    }
  });
}

export function initWorks() {
  const grid = document.querySelector('[data-works]');
  if (!grid) return;
  const mode = grid.dataset.works;

  if (mode === 'home') {
    grid.innerHTML = projects.filter((p) => p.selected).map((p) => sceneHTML(p, { size: 'feature' })).join('');
    applyCss(grid);
    animate([...grid.children]);
    return;
  }

  // page Projets : le projet réel en grande scène, les concepts en grille rythmée
  grid.innerHTML = projects.map((p) => sceneHTML(p, { size: p.real ? 'feature' : 'tile' })).join('');
  applyCss(grid);
  const scenes = [...grid.children];
  animate(scenes);

  const bar = document.querySelector('[data-filters]');
  const count = bar?.querySelector('[data-count]');
  let filtered = false;
  const apply = (filter) => {
    let n = 0;
    let tile = 0;
    scenes.forEach((s) => {
      const on = filter === 'all' || s.dataset.tags.split(' ').includes(filter);
      s.hidden = !on;
      if (!on) return;
      n += 1;
      // décalage vertical une vignette sur deux : rythme asymétrique, recalculé après filtrage
      s.classList.toggle('is-offset', s.classList.contains('scene--tile') && tile++ % 2 === 1);
      // après un filtrage, une scène qui n'était pas encore apparue s'affiche directement
      if (filtered) gsap.set(s.querySelectorAll('.scene__stage, .scene__meta, .scene__title, .scene__summary, .scene__cta'), { clearProps: 'clipPath,transform,opacity,visibility' });
    });
    if (count) count.textContent = `${n} projet${n > 1 ? 's' : ''}`;
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
