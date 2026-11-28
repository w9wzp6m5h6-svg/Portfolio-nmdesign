/**
 * En-tête.
 *  - page courante (aria-current) ;
 *  - s'efface quand on descend, revient dès qu'on remonte (plus de place pour le
 *    contenu, surtout sur téléphone) ; fond plein dès qu'on quitte le haut de page ;
 *  - le logo NM se trace à l'arrivée, puis se retrace au survol.
 */
import { gsap } from '../core/scroll.js';
import { env } from '../core/env.js';

export function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  const page = document.body.dataset.page;
  document.querySelectorAll('.header__nav [data-nav], .menu__nav [data-nav]').forEach((a) => {
    if (a.dataset.nav === page) { a.setAttribute('aria-current', 'page'); a.classList.add('is-active'); }
  });

  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    if (y < 140 || y < lastY - 6 || menuOpen) header.classList.remove('is-hidden');
    else if (y > lastY + 6 && !header.contains(document.activeElement)) header.classList.add('is-hidden');
    lastY = y;
    ticking = false;
  };
  update();
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  const brand = header.querySelector('.header__brand');
  const line = brand?.querySelector('.mark__line');
  if (!line || env.reducedMotion) return;
  const len = line.getTotalLength();
  const draw = (duration) => gsap.fromTo(line, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration, ease: 'power3.inOut' });
  draw(1.1);
  brand.addEventListener('mouseenter', () => draw(0.9));
}
