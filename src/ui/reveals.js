/**
 * Scroll reveals — one shared motion language:
 *  [data-split]  → masked line rise
 *  [data-reveal] → soft rise + fade
 *  [data-words]  → word-by-word opacity scrubbed by scroll
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { splitLines, splitWords } from '../core/split.js';
import { env } from '../core/env.js';

export function revealLines(el, { delay = 0, scroll = true } = {}) {
  const { lines } = splitLines(el);
  gsap.set(lines, { yPercent: 105 });
  const play = () => gsap.to(lines, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay });
  if (scroll) ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: play });
  else play();
}

export function initReveals(scope = document) {
  if (env.reducedMotion) return;

  scope.querySelectorAll('[data-split]').forEach((el) => revealLines(el));

  scope.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.set(el, { autoAlpha: 0, y: 32 });
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out' }),
    });
  });

  scope.querySelectorAll('[data-words]').forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
    });
  });
}
