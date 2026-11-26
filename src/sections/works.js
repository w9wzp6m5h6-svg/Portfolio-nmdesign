/**
 * Grilles de projets.
 *  - accueil (data-works="home") : la sélection, un grand visuel puis deux
 *  - page Projets (data-works="all") : tous les projets, même format, filtres
 * Chaque carte ouvre l'étude de cas (#/work/slug). Révélation sobre et courte.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';
import { projects } from '../data/projects.js';
import { applyCss } from '../core/css.js';
import { esc } from '../core/escape.js';

const SIZES = {
  wide: '(max-width: 900px) 100vw, 92vw',
  half: '(max-width: 700px) 100vw, 46vw',
};

function cardHTML(p, { size, showSummary }) {
  // vignette : l'écran du site quand il existe (cadré en haut), sinon le visuel de couverture
  const visual = p.card || p.cover;
  const pos = p.card ? '50% 0%' : (p.coverPos || '50% 50%');
  return `
  <article class="card card--${size}" data-tags="${(p.tags || []).join(' ')}" data-css="--pos:${pos}">
    <a class="card__link" href="#/work/${esc(p.slug)}" data-slug="${esc(p.slug)}" data-cursor="Voir le projet" aria-label="${esc(`${p.title} — ${p.subtitle}`)}">
      <div class="card__media">
        <img src="${visual.src}" srcset="${visual.srcset}" sizes="${SIZES[size]}" alt="${esc(visual.alt)}" loading="lazy" decoding="async" />
      </div>
      <div class="card__meta">
        <h3 class="card__title"><span class="card__num mono">${esc(p.num)}</span>${esc(p.title)}<span class="card__arrow" aria-hidden="true">→</span></h3>
        <p class="card__cat mono"><span class="card__badge${p.real ? ' is-real' : ''}">${p.real ? 'Projet réel' : 'Concept'}</span>${esc(p.category)}</p>
        ${showSummary ? `<p class="card__summary">${esc(p.subtitle)}</p>` : ''}
      </div>
    </a>
  </article>`;
}

function reveal(cards) {
  if (env.reducedMotion) return;
  cards.forEach((card) => {
    gsap.set(card, { autoAlpha: 0, y: 28 });
    ScrollTrigger.create({
      trigger: card, start: 'top 90%', once: true,
      onEnter: () => gsap.to(card, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }),
    });
  });
}

export function initWorks() {
  const grid = document.querySelector('[data-works]');
  if (!grid) return;
  const mode = grid.dataset.works;

  if (mode === 'home') {
    const list = projects.filter((p) => p.selected);
    grid.innerHTML = list.map((p, i) => cardHTML(p, { size: i === 0 ? 'wide' : 'half', showSummary: true })).join('');
    applyCss(grid);
    reveal([...grid.children]);
    return;
  }

  // le projet réel ouvre la grille en grand format, les concepts suivent par deux
  grid.innerHTML = projects.map((p) => cardHTML(p, { size: p.real ? 'wide' : 'half', showSummary: true })).join('');
  applyCss(grid);
  const cards = [...grid.children];
  reveal(cards);

  // filtres
  const bar = document.querySelector('[data-filters]');
  const count = bar?.querySelector('[data-count]');
  const apply = (filter) => {
    let n = 0;
    cards.forEach((c) => {
      const on = filter === 'all' || c.dataset.tags.split(' ').includes(filter);
      c.hidden = !on;
      if (on) { n += 1; gsap.set(c, { clearProps: 'transform,opacity,visibility' }); }
    });
    if (count) count.textContent = `${n} projet${n > 1 ? 's' : ''}`;
    ScrollTrigger.refresh();
  };
  bar?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    bar.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply(b.dataset.filter);
  });
  apply('all');
}
