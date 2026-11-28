/**
 * Menu plein écran (≤ 900 px) : rideau sombre, liens qui montent un à un,
 * piège de focus, Échap pour fermer, défilement bloqué pendant l'ouverture.
 */
import { gsap, lockScroll, unlockScroll } from '../core/scroll.js';
import { env } from '../core/env.js';

export function initMenu() {
  const toggle = document.querySelector('.header__menu');
  const menu = document.getElementById('menu');
  const bg = menu.querySelector('.menu__bg');
  const labels = menu.querySelectorAll('.menu__label, .menu__num');
  const foot = menu.querySelector('.menu__foot');
  const toggleLabel = toggle.querySelector('.header__menu-label');
  let open = false;
  let tl;

  const focusables = () => [toggle, ...menu.querySelectorAll('a')];

  function setOpen(next, { returnFocus = true } = {}) {
    if (next === open) return;
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Fermer' : 'Menu';
    tl?.kill();
    const d = env.reducedMotion ? 0 : 1;

    document.documentElement.classList.toggle('menu-open', open);
    if (open) {
      menu.inert = false;
      menu.classList.add('is-open');
      lockScroll('menu');
      tl = gsap.timeline()
        .fromTo(bg, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9 * d, ease: 'expo.inOut' })
        .fromTo(labels, { yPercent: 110 }, { yPercent: 0, duration: 0.9 * d, ease: 'expo.out', stagger: 0.04 * d }, 0.35 * d)
        .fromTo(foot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 * d }, 0.6 * d);
      menu.querySelector('a')?.focus({ preventScroll: true });
    } else {
      menu.inert = true;
      unlockScroll('menu');
      tl = gsap.timeline({ onComplete: () => menu.classList.remove('is-open') })
        .to([labels, foot], { autoAlpha: 0, duration: 0.3 * d, ease: 'power2.in' })
        .to(bg, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8 * d, ease: 'expo.inOut' }, 0.1 * d)
        .set([labels, foot], { autoAlpha: 1 });
      if (returnFocus) toggle.focus({ preventScroll: true });
    }
  }

  toggle.addEventListener('click', () => setOpen(!open));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a, [data-open-brief]')) setOpen(false, { returnFocus: false });
  });
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Tab') {
      const f = focusables();
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  // leaving the mobile breakpoint with the menu open → close it
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && setOpen(false, { returnFocus: false }));
}
