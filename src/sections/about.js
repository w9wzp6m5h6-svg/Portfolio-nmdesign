/**
 * À propos — portrait révélé puis en parallaxe, qualités qui s'allument au fil
 * du défilement, parcours en chapitres (numéro ocre, barre de progression,
 * chapitre actif). Tout le contenu reste lisible sans animation.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';

export function initAbout() {
  const section = document.querySelector('.about');
  if (!section) return;
  const portrait = section.querySelector('[data-portrait]');
  const img = portrait.querySelector('img');
  const name = portrait.querySelector('.portrait__name');
  const skills = [...section.querySelectorAll('.about__skills-list li')];
  const chapters = [...section.querySelectorAll('.chapter')];
  const num = section.querySelector('.journey__num-inner');
  const bar = section.querySelector('.journey__bar i');
  const list = section.querySelector('.journey__list');

  const setChapter = (el) => {
    chapters.forEach((c) => c.classList.toggle('is-active', c === el));
    const next = el.dataset.chapter;
    if (num.textContent === next) return;
    if (env.reducedMotion) { num.textContent = next; return; }
    gsap.timeline()
      .to(num, { yPercent: -100, duration: 0.35, ease: 'power2.in' })
      .add(() => { num.textContent = next; })
      .fromTo(num, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
  };

  chapters.forEach((c) => ScrollTrigger.create({
    trigger: c, start: 'top 62%', end: 'bottom 38%',
    onToggle: (self) => self.isActive && setChapter(c),
  }));
  chapters[0]?.classList.add('is-active');

  if (env.reducedMotion) {
    skills.forEach((li) => li.classList.add('is-lit'));
    gsap.set(bar, { scaleX: 1 });
    return;
  }

  // portrait: rideau qui se lève, puis l'image glisse dans son cadre
  gsap.set(portrait.querySelector('.portrait__img'), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(img, { scale: 1.2 });
  gsap.set(name, { yPercent: 40, autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: portrait, start: 'top 80%', once: true,
    onEnter: () => gsap.timeline()
      .to(portrait.querySelector('.portrait__img'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
      .to(img, { scale: 1, duration: 2, ease: 'expo.out' }, 0.15)
      .to(name, { yPercent: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out' }, 0.9),
  });
  gsap.fromTo(img, { yPercent: -4 }, {
    yPercent: 4, ease: 'none',
    scrollTrigger: { trigger: portrait, start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // qualités : elles s'allument une à une au défilement
  ScrollTrigger.create({
    trigger: section.querySelector('.about__skills'), start: 'top 85%', end: 'bottom 45%', scrub: true,
    onUpdate: (self) => {
      const lit = Math.round(self.progress * skills.length);
      skills.forEach((li, i) => li.classList.toggle('is-lit', i < lit));
    },
  });

  // barre de progression du parcours
  gsap.fromTo(bar, { scaleX: 0.2 }, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: list, start: 'top 60%', end: 'bottom 60%', scrub: true },
  });
}
