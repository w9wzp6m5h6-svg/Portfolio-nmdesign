/**
 * Smooth scrolling (Lenis) wired into GSAP's ticker and ScrollTrigger,
 * so every scroll-driven animation shares one clock.
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { env } from './env.js';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;
const lockReasons = new Set();

export function initScroll() {
  if (!env.reducedMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // in-page anchors → smooth scroll (with header offset of 0: sections own their padding)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2 || id.startsWith('#/')) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
    // move focus for keyboard / screen-reader users without a jump
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

export function scrollToTarget(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2), ...opts });
  else target.scrollIntoView({ behavior: env.reducedMotion ? 'auto' : 'smooth' });
}

/** Locks page scroll; several callers can hold a lock at the same time. */
export function lockScroll(reason) {
  lockReasons.add(reason);
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
}
export function unlockScroll(reason) {
  lockReasons.delete(reason);
  if (lockReasons.size) return;
  document.documentElement.style.overflow = '';
  lenis?.start();
}

export function getLenis() { return lenis; }
export { gsap, ScrollTrigger };
