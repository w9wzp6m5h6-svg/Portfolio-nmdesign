/**
 * Contextual label that follows the (native) cursor over elements with
 * [data-cursor="Label"]. Desktop fine pointers only.
 */
import { gsap } from '../core/scroll.js';
import { env } from '../core/env.js';

export function initCursorTag() {
  if (!env.finePointer) return;
  const tag = document.querySelector('.cursor-tag');
  const text = tag.querySelector('.cursor-tag__text');
  const xTo = gsap.quickTo(tag, 'x', { duration: 0.45, ease: 'power3.out' });
  const yTo = gsap.quickTo(tag, 'y', { duration: 0.45, ease: 'power3.out' });
  let active = null;
  const last = { x: -1, y: -1 };

  const update = (target) => {
    const el = target?.closest?.('[data-cursor]');
    const label = el?.dataset.cursor || null;
    if (label === active) return;
    active = label;
    if (label) {
      text.textContent = label;
      gsap.to(tag, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
    } else {
      gsap.to(tag, { opacity: 0, scale: 0.85, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
    }
  };
  // re-evaluate what is under a still cursor (content scrolled or an overlay opened)
  const recheck = () => { if (last.x >= 0) update(document.elementFromPoint(last.x, last.y)); };

  window.addEventListener('pointermove', (e) => {
    last.x = e.clientX; last.y = e.clientY;
    xTo(e.clientX + 18);
    yTo(e.clientY + 18);
    update(e.target);
  }, { passive: true });
  window.addEventListener('scroll', recheck, { passive: true, capture: true });
  window.addEventListener('click', () => { active = null; update(null); setTimeout(recheck, 1400); }, { capture: true });

  document.documentElement.addEventListener('pointerleave', () => {
    active = null;
    gsap.to(tag, { opacity: 0, duration: 0.2 });
  });
}

