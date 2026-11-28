/**
 * Le studio (accueil) : le portrait glissé dans la phrase s'ouvre comme une
 * pastille quand la phrase arrive ; les mots s'allument au fil du défilement
 * (data-words, ui/reveals.js).
 */
import { gsap } from '../core/scroll.js';
import { env } from '../core/env.js';

export function initStudio() {
  const face = document.querySelector('.studio__face');
  if (!face || env.reducedMotion) return;
  gsap.fromTo(face, { width: 0, marginLeft: 0, marginRight: 0 }, {
    width: '1.9em', marginLeft: '0.08em', marginRight: '0.08em', duration: 1.3, ease: 'expo.out',
    scrollTrigger: { trigger: face, start: 'top 78%', once: true },
  });
}
