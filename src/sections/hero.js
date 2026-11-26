/**
 * Hero (accueil) : le mot-symbole NM DESIGN est le seul très grand élément du
 * site. Il est ajusté à la largeur de la grille, arrive en masque, puis passe
 * en WebGL (léger flux au curseur) une fois posé.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';

export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return { play() {} };
  const name = hero.querySelector('.hero__name');
  const words = [...hero.querySelectorAll('.hero__word')];
  const canvas = hero.querySelector('.hero__gl');
  const intro = hero.querySelectorAll('[data-intro]');
  let gl = null;

  /** Taille du mot-symbole : il occupe exactement la largeur de contenu. */
  // sonde invisible : mesure le texte à 100 px avec la typo réelle du titre,
  // indépendamment de l'état (animations, styles en cours d'application) du titre lui-même
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-size:100px;line-height:1;';
  document.body.append(probe);
  const measure = (text) => {
    const cs = getComputedStyle(name);
    const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize);
    Object.assign(probe.style, {
      fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, fontVariationSettings: cs.fontVariationSettings,
      fontStretch: cs.fontStretch, textTransform: cs.textTransform, letterSpacing: `${ls}em`,
    });
    probe.textContent = text;
    return probe.getBoundingClientRect().width;
  };

  /** Taille du mot-symbole : il occupe exactement la largeur de contenu. */
  function fit() {
    const available = name.getBoundingClientRect().width;
    const stacked = getComputedStyle(name).flexDirection === 'column';
    const widths = words.map((w) => measure(w.textContent));
    const gapEm = 0.22;
    const w = stacked ? Math.max(...widths) : widths.reduce((a, b) => a + b, 0) + gapEm * 100 * (widths.length - 1);
    if (!(w > 0) || !(available > 0)) return;
    let size = (100 * available) / w;
    // plafond : le mot-symbole ne doit jamais écraser l'écran (écrans larges et bas)
    size = Math.min(size, window.innerHeight * (stacked ? 0.2 : 0.36));
    name.style.fontSize = `${size}px`;
  }
  fit();
  // la taille dépend de la police réelle : on réajuste dès qu'elle est chargée
  document.fonts?.ready.then(() => { fit(); gl?.resize(); });
  window.addEventListener('load', () => { fit(); gl?.resize(); }, { once: true });

  if (!env.reducedMotion) {
    gsap.set(words, { yPercent: 105 });
    gsap.set(intro, { autoAlpha: 0, y: 12 });
  }

  async function enableGL() {
    if (!env.webgl || env.reducedMotion || !canvas) return;
    try {
      const { HeroGL } = await import('../three/hero-gl.js');
      gl = new HeroGL(canvas, hero, words);
      gl.tick(0);
      hero.classList.add('has-gl');
      ScrollTrigger.create({
        trigger: hero, start: 'top bottom', end: 'bottom top',
        onToggle: (self) => (self.isActive ? gl.start() : gl.stop()),
      });
      if (ScrollTrigger.isInViewport(hero)) gl.start();
      document.addEventListener('visibilitychange', () => (document.hidden ? gl.stop() : ScrollTrigger.isInViewport(hero) && gl.start()));
    } catch (err) {
      console.warn('[hero] WebGL désactivé :', err);
      hero.classList.remove('has-gl');
    }
  }

  let resizeRaf = 0;
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW && gl) { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(() => gl.resize()); return; }
    lastW = window.innerWidth;
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => { fit(); gl?.resize(); ScrollTrigger.refresh(); });
  });

  /** Arrivée — appelée quand le rideau d'intro se lève. Courte et sobre. */
  function play() {
    fit();
    if (env.reducedMotion) { enableGL(); return; }
    gsap.timeline({ onComplete: enableGL })
      .to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.1)
      .to(intro, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.06 }, 0.45);
  }

  return { play };
}
