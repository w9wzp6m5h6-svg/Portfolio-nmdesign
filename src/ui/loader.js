/**
 * Intro: the NM monogram draws itself as one continuous stroke while a counter
 * tracks real readiness (fonts), then the mark flies into the header and the
 * curtain lifts. Short on first visit, near-instant afterwards, skippable.
 */
import { gsap } from '../core/scroll.js';
import { env } from '../core/env.js';

const SEEN_KEY = 'nm-intro-seen';

function seenBefore() {
  try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; }
}
function markSeen() {
  try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }
}

/** @param {{ onReveal: () => void }} opts — onReveal fires as the curtain starts lifting */
export function runLoader({ onReveal }) {
  const root = document.querySelector('.loader');
  const line = root.querySelector('.mark__line');
  const mark = root.querySelector('.loader__mark');
  const num = root.querySelector('.loader__num');
  const meta = root.querySelector('.loader__meta');
  const skip = root.querySelector('.loader__skip');
  const brandMark = document.querySelector('.header__brand .mark');

  const fast = env.reducedMotion || seenBefore();
  const len = line.getTotalLength();
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(brandMark, { autoAlpha: 0 });

  const counter = { v: 0 };
  const renderCount = () => { num.textContent = String(Math.round(counter.v)).padStart(3, '0'); };

  let revealed = false;
  const reveal = () => { if (!revealed) { revealed = true; onReveal(); } };

  const finish = () => {
    root.remove();
    document.body.classList.remove('is-loading');
    gsap.set(brandMark, { autoAlpha: 1 });
    markSeen();
  };

  if (env.reducedMotion) {
    gsap.set(line, { strokeDashoffset: 0 });
    return document.fonts.ready.then(() => {
      gsap.to(root, { autoAlpha: 0, duration: 0.3, onStart: reveal, onComplete: finish });
    });
  }

  const rectDelta = () => {
    const from = mark.getBoundingClientRect();
    const to = brandMark.getBoundingClientRect();
    return {
      x: to.left + to.width / 2 - (from.left + from.width / 2),
      y: to.top + to.height / 2 - (from.top + from.height / 2),
      s: to.width / from.width,
    };
  };

  const draw = fast ? 0.7 : 1.5;
  const tl = gsap.timeline({ paused: true });
  tl.to(line, { strokeDashoffset: 0, duration: draw, ease: 'power3.inOut' }, 0)
    .to(counter, { v: 100, duration: draw, ease: 'power2.inOut', onUpdate: renderCount }, 0)
    .addLabel('exit', `+=${fast ? 0.05 : 0.2}`)
    .to(meta, { autoAlpha: 0, y: -8, duration: 0.4, ease: 'power2.in' }, 'exit')
    // fly the mark into the header slot (values resolved when the tween starts)
    .to(mark, {
      x: () => rectDelta().x,
      y: () => rectDelta().y,
      scale: () => rectDelta().s,
      duration: 1.1,
      ease: 'expo.inOut',
    }, 'exit')
    .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 'exit+=0.15')
    .add(reveal, 'exit+=0.35')
    .add(finish);

  gsap.set(root, { clipPath: 'inset(0% 0% 0% 0%)' });

  const skipNow = () => { if (tl.progress() < 1) tl.timeScale(4); };
  skip.addEventListener('click', skipNow);
  skip.tabIndex = 0;
  const onKey = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) skipNow(); };
  window.addEventListener('keydown', onKey);
  root.addEventListener('pointerdown', skipNow);

  // hold at the exit label until fonts are ready, so the hero never reflows on reveal
  const ready = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  tl.addPause('exit', () => ready.then(() => tl.resume()));
  tl.play();

  return new Promise((resolve) => {
    tl.eventCallback('onComplete', () => {
      window.removeEventListener('keydown', onKey);
      resolve();
    });
  });
}
