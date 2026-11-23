/**
 * Projets — le projet réel est mis en avant dans son propre bloc, puis la grille
 * éditoriale des concepts. Révélation par masque, parallaxe dans le cadre.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';
import { projects } from '../data/projects.js';

const SIZES = {
  a: '(max-width: 900px) 100vw, 66vw',
  b: '(max-width: 900px) 84vw, 34vw',
  c: '(max-width: 900px) 100vw, 50vw',
  d: '(max-width: 900px) 84vw, 26vw',
  e: '100vw',
  f: '(max-width: 900px) 100vw, 66vw',
  feature: '100vw',
};

function cardHTML(p) {
  return `
  <article class="card" data-layout="${p.layout}" style="--ratio:${p.cover.ratio};--pos:${p.coverPos || '50% 50%'}">
    <a class="card__link" href="#/work/${p.slug}" data-slug="${p.slug}" data-cursor="Découvrir le projet" aria-label="${p.title} : ${p.subtitle}">
      <div class="card__media">
        <div class="card__parallax"><img src="${p.cover.src}" srcset="${p.cover.srcset}" sizes="${SIZES[p.layout]}" alt="${p.cover.alt}" loading="lazy" decoding="async" /></div>
      </div>
      <div class="card__meta">
        <span class="card__num mono">${p.num}</span>
        <h3 class="card__title"><span class="card__title-inner">${p.title}</span><span class="card__arrow" aria-hidden="true">→</span></h3>
        <span class="card__status mono">${p.status}</span>
        <span class="card__cat mono">${p.real ? '<span class="card__badge">Projet réel</span>' : ''}${p.category}</span>
      </div>
    </a>
  </article>`;
}

export function initWorks() {
  const grid = document.querySelector('[data-works]');
  const featured = document.querySelector('[data-featured]');
  featured.innerHTML = projects.filter((p) => p.real).map(cardHTML).join('');
  grid.innerHTML = projects.filter((p) => !p.real).map(cardHTML).join('');
  const cards = document.querySelectorAll('.works .card');

  if (env.reducedMotion) {
    cards.forEach((c) => c.classList.add('is-revealed'));
    return;
  }

  cards.forEach((card) => {
    const media = card.querySelector('.card__media');
    const img = media.querySelector('.card__parallax');
    const meta = card.querySelectorAll('.card__num, .card__title-inner, .card__status, .card__cat');

    gsap.set(media, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(img, { scale: 1.25 });
    gsap.set(meta, { yPercent: 100, autoAlpha: 0 });

    ScrollTrigger.create({
      trigger: card, start: 'top 85%', once: true,
      onEnter: () => {
        gsap.timeline()
          .to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
          .to(img, { scale: 1, duration: 1.8, ease: 'expo.out', clearProps: 'scale' }, 0.1)
          .to(meta, { yPercent: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.05 }, 0.6)
          // hand clip-path back to CSS so the hover inset can transition
          .set(media, { clearProps: 'clipPath' })
          .add(() => card.classList.add('is-revealed'));
      },
    });

    // parallax: the image travels inside its frame
    gsap.fromTo(img, { yPercent: -4 }, {
      yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
