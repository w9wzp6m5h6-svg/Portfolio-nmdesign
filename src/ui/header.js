/**
 * Header: live section index ("02 — The Object") and active nav state.
 * It never hides: navigation stays one tap away at every scroll position.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';

export function initHeader() {
  const header = document.querySelector('.header');
  const num = header.querySelector('.header__index-num');
  const label = header.querySelector('.header__index-label');
  const links = [...header.querySelectorAll('[data-nav]')];
  let current = null;

  const setSection = (section) => {
    if (section === current) return;
    current = section;
    const id = section.id;
    links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
    num.textContent = section.dataset.section;
    gsap.fromTo(label, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', overwrite: true });
    label.textContent = section.dataset.label;
  };

  document.querySelectorAll('[data-section]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => self.isActive && setSection(section),
    });
  });
}
