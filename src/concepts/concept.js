/**
 * Sites des concepts (ÉLAN, PORTANT) : comportements communs, sans dépendance.
 *  - apparitions au défilement (IntersectionObserver + transitions CSS) ;
 *  - barre de navigation qui se densifie au défilement ;
 *  - rien ne bouge en mouvement réduit.
 */
import { env } from '../core/env.js';

export function initConcept() {
  const items = document.querySelectorAll('[data-c-reveal]');
  if (env.reducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  }
  const nav = document.querySelector('[data-c-nav], .elan-nav, .pt-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  document.documentElement.classList.add('is-ready');
}
