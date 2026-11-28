/**
 * Intro cinématique.
 *  1. la caméra avance dans une scène de plans flottants (CSS 3D) ;
 *  2. le logo NM original se trace d'un seul trait, « NM Design » apparaît ;
 *  3. le logo rejoint sa place dans l'en-tête, la scène s'ouvre sur le hero.
 * ~2,5 s à la première visite de la session ; ensuite (et en mouvement réduit)
 * simple fondu. Passable à tout moment : bouton, clic, Échap, Entrée, molette.
 */
import { gsap } from '../core/scroll.js';
import { env } from '../core/env.js';

const SEEN_KEY = 'nm-intro-seen';
const seenBefore = () => { try { return sessionStorage.getItem(SEEN_KEY) === '1'; } catch { return false; } };
const markSeen = () => { try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* navigation privée */ } };

/** @param {{ onReveal: () => void }} opts — onReveal : quand la scène commence à s'ouvrir */
export function runIntro({ onReveal }) {
  const root = document.querySelector('.intro');
  const brandMark = document.querySelector('.header__brand .mark');
  if (!root) { onReveal(); return Promise.resolve(); }

  const mark = root.querySelector('.intro__mark');
  const line = root.querySelector('.mark__line');
  const world = root.querySelector('.intro__world');
  const planes = root.querySelectorAll('.intro__plane');
  const word = root.querySelector('.intro__word-in');
  const meta = root.querySelector('.intro__meta');
  const count = root.querySelector('.intro__count');
  const skip = root.querySelector('.intro__skip');
  const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

  let revealed = false;
  const reveal = () => { if (!revealed) { revealed = true; onReveal(); } };
  const finish = () => {
    root.remove();
    document.body.classList.remove('is-loading');
    gsap.set(brandMark, { clearProps: 'opacity,visibility' });
    markSeen();
  };

  // visite suivante dans la session, ou mouvement réduit : un simple fondu
  if (env.reducedMotion || seenBefore()) {
    gsap.set([root.querySelector('.intro__stage'), root.querySelector('.intro__core'), meta, skip], { autoAlpha: 0 });
    return fontsReady.then(() => new Promise((resolve) => {
      gsap.to(root, { autoAlpha: 0, duration: env.reducedMotion ? 0.2 : 0.35, ease: 'power1.out', onStart: reveal, onComplete: () => { finish(); resolve(); } });
    }));
  }

  const len = line.getTotalLength();
  gsap.set(brandMark, { autoAlpha: 0 });
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(world, { z: -900, rotationX: 12, rotationY: -20 });
  gsap.set(planes, { autoAlpha: 0 });
  gsap.set(word, { yPercent: 110 });
  gsap.set(root, { clipPath: 'inset(0% 0% 0% 0%)' });

  const counter = { v: 0 };
  const toHeader = () => {
    const a = mark.getBoundingClientRect();
    const b = brandMark.getBoundingClientRect();
    return { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2), s: b.width / a.width };
  };

  const tl = gsap.timeline({ paused: true })
    // caméra : traversée lente de la scène
    .to(world, { z: 0, rotationX: 0, rotationY: 0, duration: 2.4, ease: 'power3.out' }, 0)
    .to(planes, { autoAlpha: 1, duration: 0.9, ease: 'power2.out', stagger: { each: 0.08, from: 'random' } }, 0.05)
    // logo d'un seul trait, compteur de chargement
    .to(line, { strokeDashoffset: 0, duration: 1.05, ease: 'power3.inOut' }, 0.15)
    .to(counter, { v: 100, duration: 1.05, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0.15)
    .to(word, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 0.75)
    .addLabel('exit', 1.4)
    // sortie : le logo rejoint l'en-tête, la caméra traverse les plans, le rideau s'ouvre
    .to([word, meta, skip], { autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, 'exit')
    .to(mark, { x: () => toHeader().x, y: () => toHeader().y, scale: () => toHeader().s, duration: 1, ease: 'expo.inOut' }, 'exit')
    .to(world, { z: 650, duration: 1.1, ease: 'power3.in' }, 'exit')
    .to(planes, { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, 'exit+=0.35')
    .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, 'exit+=0.2')
    .add(reveal, 'exit+=0.4')
    .add(finish);

  // on attend les polices avant d'ouvrir la scène : le hero ne bouge plus après l'apparition
  tl.addPause('exit', () => fontsReady.then(() => tl.resume()));

  let skipped = false;
  const skipNow = () => {
    if (skipped || tl.progress() === 1) return;
    skipped = true;
    gsap.set(line, { strokeDashoffset: 0 });
    if (tl.time() < tl.labels.exit) tl.seek('exit', false);
    tl.timeScale(1.6);
  };
  const onKey = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) skipNow(); };
  skip.addEventListener('click', skipNow);
  root.addEventListener('pointerdown', skipNow);
  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', skipNow, { passive: true, once: true });
  window.addEventListener('touchmove', skipNow, { passive: true, once: true });

  tl.play();
  return new Promise((resolve) => {
    tl.eventCallback('onComplete', () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', skipNow);
      window.removeEventListener('touchmove', skipNow);
      resolve();
    });
  });
}
