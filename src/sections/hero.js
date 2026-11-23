/**
 * Hero: fits the name to the grid, plays the arrival choreography,
 * and hands the name over to WebGL (cursor-driven flow) once it has landed.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';

export function initHero() {
  const hero = document.querySelector('.hero');
  const name = hero.querySelector('.hero__name');
  const words = [...hero.querySelectorAll('.hero__word')];
  const longest = hero.querySelector('.hero__line--2 .hero__word');
  const canvas = hero.querySelector('.hero__gl');
  const intro = hero.querySelectorAll('[data-intro]');
  const taglineLines = hero.querySelectorAll('.hero__tagline .line > span');
  const gridLines = hero.querySelectorAll('.hero__grid i');
  const xOut = hero.querySelector('.hero__x');
  const yOut = hero.querySelector('.hero__y');
  let gl = null;

  /** Font size so that "MILSZTAJN" spans the full content width. */
  function fit() {
    name.style.fontSize = '100px';
    const available = name.getBoundingClientRect().width;
    const w = longest.getBoundingClientRect().width;
    const size = (100 * available) / w;
    name.style.fontSize = `${size}px`;
    name.style.setProperty('--name-size', `${size}px`);
  }
  fit();

  // hide everything that will arrive
  if (!env.reducedMotion) {
    gsap.set(words, { yPercent: 105 });
    gsap.set(intro, { autoAlpha: 0 });
    gsap.set(taglineLines, { yPercent: 110 });
    gsap.set(gridLines, { scaleY: 0 });
  }

  async function enableGL() {
    if (!env.webgl || env.reducedMotion) return;
    try {
      const { HeroGL } = await import('../three/hero-gl.js');
      gl = new HeroGL(canvas, hero, words);
      gl.onMove = (x, y) => {
        xOut.textContent = x.toFixed(3);
        yOut.textContent = y.toFixed(3);
      };
      gl.tick(0);
      hero.classList.add('has-gl');
      // run only while the hero is on screen
      ScrollTrigger.create({
        trigger: hero, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => (self.isActive ? gl.start() : gl.stop()),
      });
      if (ScrollTrigger.isInViewport(hero)) gl.start();
      document.addEventListener('visibilitychange', () => (document.hidden ? gl.stop() : ScrollTrigger.isInViewport(hero) && gl.start()));
    } catch (err) {
      console.warn('[hero] WebGL disabled:', err);
      hero.classList.remove('has-gl');
    }
  }

  let resizeRaf = 0;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    // ignore height-only changes (mobile toolbars) — they do not affect the type
    if (window.innerWidth === lastW && gl) { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(() => gl.resize()); return; }
    lastW = window.innerWidth;
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => { fit(); gl?.resize(); ScrollTrigger.refresh(); });
  });

  // gentle exit: content drifts up and dims while the next section arrives
  if (!env.reducedMotion) {
    // the canvas moves with the DOM name (same px offset) so the GL copy stays registered
    gsap.fromTo(hero.querySelectorAll('.hero__top, .hero__name, .hero__readout, .hero__gl'), { y: 0, opacity: 1 }, {
      y: () => -window.innerHeight * 0.14, opacity: 0.25, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    });
  }

  /** Arrival choreography — called when the loader curtain starts lifting. */
  function play() {
    fit();
    if (env.reducedMotion) { enableGL(); return; }
    gsap.timeline({ onComplete: enableGL })
      .to(gridLines, { scaleY: 1, duration: 1.4, ease: 'expo.inOut', stagger: 0.06 }, 0)
      .to(words, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1 }, 0.25)
      .to(taglineLines, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }, 0.55)
      .to(intro, { autoAlpha: 1, duration: 1, ease: 'power2.out', stagger: 0.06 }, 0.7);
  }

  return { play };
}
