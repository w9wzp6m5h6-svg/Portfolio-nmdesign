/**
 * Hero (accueil).
 *  - mot-symbole NM DESIGN ajusté à la largeur de la grille ;
 *  - « constellation » : les écrans des projets flottent en perspective (CSS 3D,
 *    transformations GPU uniquement), la scène suit le pointeur, chaque écran
 *    ouvre son étude de cas ;
 *  - arrivée courte quand l'intro s'ouvre ; rien ne bouge en mouvement réduit.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';
import { projects } from '../data/projects.js';
import { esc } from '../core/escape.js';

const CONSTELLATION = ['cynthia-rimo', 'stride', 'opale', 'vanta', 'oscillo'];

function screenHTML(p, i) {
  const visual = p.card || p.cover;
  // raccourcis visuels pour la souris : au clavier et au lecteur d'écran, les mêmes
  // projets sont accessibles juste en dessous (section Projets)
  return `
    <a class="hero__screen hero__screen--${i + 1}" href="#/work/${esc(p.slug)}" data-project="${esc(p.slug)}" data-project-card
       data-cursor="Voir le projet" tabindex="-1" aria-hidden="true">
      <span class="hero__screen-in">
        <span class="hero__screen-media" data-project-media>
          <img src="${visual.src}" srcset="${visual.srcset}" sizes="(max-width: 700px) 56vw, (max-width: 900px) 40vw, 25vw" alt="" decoding="async" ${i < 3 ? '' : 'loading="lazy"'} />
        </span>
        <span class="hero__screen-label mono"><b>${esc(p.num)}</b>${esc(p.title)}</span>
      </span>
    </a>`;
}

export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return { play() {} };
  const name = hero.querySelector('.hero__name');
  const words = [...hero.querySelectorAll('.hero__word')];
  const intro = hero.querySelectorAll('[data-intro]');
  const orbit = hero.querySelector('.hero__orbit');

  if (orbit) {
    orbit.innerHTML = CONSTELLATION.map((slug) => projects.find((p) => p.slug === slug)).filter(Boolean).map(screenHTML).join('');
  }
  const screens = orbit ? [...orbit.querySelectorAll('.hero__screen-in')] : [];

  /* Taille du mot-symbole --------------------------------------------------
     sonde invisible : mesure le texte à 100 px avec la typo réelle du titre,
     indépendamment de l'état (animations en cours) du titre lui-même */
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
  function fit() {
    const available = name.getBoundingClientRect().width;
    const stacked = getComputedStyle(name).flexDirection === 'column';
    const widths = words.map((w) => measure(w.textContent));
    const w = stacked ? Math.max(...widths) : widths.reduce((a, b) => a + b, 0) + 0.22 * 100 * (widths.length - 1);
    if (!(w > 0) || !(available > 0)) return;
    // plafond : le mot-symbole laisse la place aux écrans, même sur les écrans larges et bas
    const size = Math.min((100 * available) / w, window.innerHeight * (stacked ? 0.17 : 0.26));
    name.style.fontSize = `${size}px`;
  }
  fit();
  document.fonts?.ready.then(fit);
  window.addEventListener('load', fit, { once: true });
  let lastW = window.innerWidth;
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => { fit(); ScrollTrigger.refresh(); });
  });

  if (env.reducedMotion) return { play: fit };

  gsap.set(words, { yPercent: 105 });
  gsap.set(intro, { autoAlpha: 0, y: 12 });
  gsap.set(screens, { autoAlpha: 0, y: 60, z: -260 });

  /* Vie de la scène : flottement, pointeur, défilement ---------------------- */
  const floats = screens.map((el, i) => gsap.to(el, {
    y: i % 2 ? 9 : -9, rotationZ: i % 2 ? 0.5 : -0.5,
    duration: 4.2 + i * 0.55, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true,
  }));
  const setFloat = (on) => floats.forEach((t) => (on ? t.play() : t.pause()));

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (orbit && fine) {
    const rotY = gsap.quickTo(orbit, 'rotationY', { duration: 1.4, ease: 'power3.out' });
    const rotX = gsap.quickTo(orbit, 'rotationX', { duration: 1.4, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      rotY(((e.clientX - r.left) / r.width - 0.5) * 12);
      rotX(-((e.clientY - r.top) / r.height - 0.5) * 8);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { rotY(0); rotX(0); });
  }

  if (orbit) {
    // en quittant le hero, la caméra traverse la scène
    gsap.to(orbit, { z: 220, yPercent: -8, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  let arrived = false;
  ScrollTrigger.create({
    trigger: hero, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { if (arrived) setFloat(self.isActive && !document.hidden); },
  });
  document.addEventListener('visibilitychange', () => { if (arrived) setFloat(!document.hidden && ScrollTrigger.isInViewport(hero)); });

  /** Arrivée — appelée quand l'intro s'ouvre. */
  function play() {
    fit();
    gsap.timeline({ onComplete: () => { arrived = true; setFloat(ScrollTrigger.isInViewport(hero)); } })
      .to(words, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }, 0.1)
      .to(screens, { autoAlpha: 1, y: 0, z: 0, duration: 1.4, ease: 'expo.out', stagger: { each: 0.09, from: 'center' } }, 0.15)
      .to(intro, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.06 }, 0.5);
  }

  return { play };
}
