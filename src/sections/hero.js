/**
 * Lancement (accueil).
 *  - titre ajusté à sa colonne (la ligne la plus longue occupe toute la largeur) ;
 *  - bobine : les projets défilent dans une grande fenêtre (toutes les 4,5 s), en pause
 *    au survol, au focus, hors écran ou onglet caché ; précédent / suivant / pause ;
 *    la fenêtre s'incline légèrement sous le pointeur et un reflet le suit ;
 *  - arrivée < 1,2 s, jamais bloquante ; rien ne bouge seul en mouvement réduit.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';
import { projects } from '../data/projects.js';
import { esc } from '../core/escape.js';
import { applyCss } from '../core/css.js';

const DELAY = 4.5;

function slideHTML(p, i) {
  const v = p.cover;
  return `
    <a class="reel__slide${i === 0 ? ' is-current' : ''}" href="#/work/${esc(p.slug)}" data-project="${esc(p.slug)}" data-project-card
       data-cursor="Voir le projet" data-css="--pos:${p.coverPos || '50% 50%'}" ${i === 0 ? '' : 'tabindex="-1" aria-hidden="true"'}
       aria-label="${esc(`${p.title} — ${p.subtitle}`)}">
      <span class="reel__media" data-project-media><img src="${v.src}" srcset="${v.srcset}" sizes="(max-width: 900px) 92vw, 32vw" alt="" decoding="async" ${i < 2 ? '' : 'loading="lazy"'} /></span>
    </a>`;
}

function buildReel(root) {
  root.innerHTML = `
    <div class="reel">
      <div class="reel__stage">
        ${projects.map(slideHTML).join('')}
        <span class="reel__light" aria-hidden="true"></span>
        <span class="reel__progress" aria-hidden="true"><i></i></span>
      </div>
      <div class="reel__caption">
        <p class="reel__info" aria-live="polite"><span class="reel__count label"></span><span class="reel__name"></span><span class="reel__cat label"></span></p>
        <div class="reel__nav">
          <button class="reel__btn" type="button" data-reel-prev aria-label="Projet précédent">←</button>
          <button class="reel__btn" type="button" data-reel-toggle aria-label="Mettre en pause le défilement">❙❙</button>
          <button class="reel__btn" type="button" data-reel-next aria-label="Projet suivant">→</button>
        </div>
      </div>
    </div>`;
  applyCss(root);
}

export function initHero() {
  const hero = document.querySelector('.hero');
  if (!hero) return { play() {} };
  const title = hero.querySelector('.hero__title');
  const words = [...hero.querySelectorAll('.hero__word')];
  const fades = hero.querySelectorAll('[data-hero-fade]');
  const reelRoot = hero.querySelector('[data-reel]');

  /* Titre : la ligne la plus longue remplit la colonne ------------------------ */
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-size:100px;line-height:1;';
  document.body.append(probe);
  const measure = (el) => {
    const cs = getComputedStyle(el.querySelector('em') || el.querySelector('.hero__word') || el);
    Object.assign(probe.style, { fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle, letterSpacing: `${parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize) || 0}em` });
    probe.textContent = el.textContent;
    return probe.getBoundingClientRect().width;
  };
  function fit() {
    const available = title.getBoundingClientRect().width;
    // ordinateur : chaque ligne entière ; téléphone : « Des » et « expériences. » passent sur deux lignes
    const narrow = window.matchMedia('(max-width: 600px)').matches;
    const units = narrow ? [...title.querySelectorAll('.hero__line:not(.hero__line--split), .hero__line--split .hero__word')] : [...title.querySelectorAll('.hero__line')];
    const widest = Math.max(...units.map(measure));
    if (!(widest > 0) || !(available > 0)) return;
    const size = Math.min((100 * available) / widest, window.innerHeight * (window.innerWidth > 900 ? 0.17 : 0.16));
    title.style.fontSize = `${Math.floor(size * 0.98)}px`;
  }
  fit();
  document.fonts?.ready.then(fit);
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    requestAnimationFrame(() => { fit(); ScrollTrigger.refresh(); });
  });

  /* Bobine ----------------------------------------------------------------- */
  let reel = null;
  if (reelRoot) {
    buildReel(reelRoot);
    const stage = reelRoot.querySelector('.reel__stage');
    const slides = [...reelRoot.querySelectorAll('.reel__slide')];
    const bar = reelRoot.querySelector('.reel__progress i');
    const count = reelRoot.querySelector('.reel__count');
    const name = reelRoot.querySelector('.reel__name');
    const cat = reelRoot.querySelector('.reel__cat');
    const toggle = reelRoot.querySelector('[data-reel-toggle]');
    let index = 0;
    let userPaused = env.reducedMotion;
    let hovered = false;
    let visible = true;
    let timer = null;

    const caption = () => {
      const p = projects[index];
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
      name.textContent = p.title;
      cat.textContent = p.real ? 'Projet réel' : 'Concept';
    };
    const show = (next, dir = 1) => {
      if (next === index) return;
      const from = slides[index];
      const to = slides[next];
      index = next;
      slides.forEach((s) => { const on = s === to; s.classList.toggle('is-current', on); s.tabIndex = on ? 0 : -1; s.toggleAttribute('aria-hidden', !on); });
      caption();
      if (env.reducedMotion) return;
      gsap.killTweensOf([from, to, to.querySelector('img')]);
      gsap.set(to, { zIndex: 3 });
      gsap.set(from, { zIndex: 2 });
      gsap.fromTo(to, { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', onComplete: () => gsap.set([to, from], { clearProps: 'zIndex,clipPath' }) });
      gsap.fromTo(to.querySelector('img'), { scale: 1.18, xPercent: dir * 6 }, { scale: 1, xPercent: 0, duration: 1.6, ease: 'expo.out' });
    };
    const running = () => !userPaused && !hovered && visible && !document.hidden;
    const schedule = () => {
      timer?.kill();
      gsap.set(bar, { scaleX: 0 });
      if (!running()) return;
      timer = gsap.to(bar, { scaleX: 1, duration: DELAY, ease: 'none', onComplete: () => { show((index + 1) % slides.length); schedule(); } });
    };
    const pauseOrResume = () => { if (running()) { if (!timer?.isActive()) schedule(); else timer.resume(); } else timer?.pause(); };

    reelRoot.querySelector('[data-reel-next]').addEventListener('click', () => { show((index + 1) % slides.length, 1); schedule(); });
    reelRoot.querySelector('[data-reel-prev]').addEventListener('click', () => { show((index - 1 + slides.length) % slides.length, -1); schedule(); });
    toggle.addEventListener('click', () => {
      userPaused = !userPaused;
      toggle.textContent = userPaused ? '▶' : '❙❙';
      toggle.setAttribute('aria-label', userPaused ? 'Reprendre le défilement' : 'Mettre en pause le défilement');
      if (userPaused) timer?.pause(); else schedule();
    });
    if (userPaused) { toggle.textContent = '▶'; toggle.setAttribute('aria-label', 'Reprendre le défilement'); }
    reelRoot.addEventListener('pointerenter', () => { hovered = true; pauseOrResume(); });
    reelRoot.addEventListener('pointerleave', () => { hovered = false; pauseOrResume(); });
    reelRoot.addEventListener('focusin', () => { hovered = true; pauseOrResume(); });
    reelRoot.addEventListener('focusout', (e) => { if (!reelRoot.contains(e.relatedTarget)) { hovered = false; pauseOrResume(); } });
    document.addEventListener('visibilitychange', pauseOrResume);
    ScrollTrigger.create({ trigger: reelRoot, start: 'top bottom', end: 'bottom top', onToggle: (self) => { visible = self.isActive; pauseOrResume(); } });

    // profondeur : la fenêtre s'incline vers le pointeur, un reflet suit le curseur
    if (!env.reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const rx = gsap.quickTo(stage, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const ry = gsap.quickTo(stage, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        ry((x - 0.5) * 8);
        rx(-(y - 0.5) * 6);
        stage.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        stage.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      }, { passive: true });
      stage.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }
    caption();
    reel = { start: schedule };
  }

  /* Arrivée : rapide, jamais bloquante ------------------------------------ */
  if (env.reducedMotion) return { play: () => reel?.start() };
  gsap.set(words, { yPercent: 110 });
  gsap.set(fades, { autoAlpha: 0, y: 14 });
  const stage = reelRoot?.querySelector('.reel__stage');
  if (stage) gsap.set(stage, { clipPath: 'inset(100% 0% 0% 0% round 18px)' });

  function play() {
    gsap.timeline({ onComplete: () => reel?.start() })
      .to(words, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.07 }, 0.05)
      .to(stage || [], { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.1)
      .from(stage?.querySelector('.is-current img') || [], { scale: 1.2, duration: 1.6, ease: 'expo.out' }, 0.1)
      .to(fades, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.06 }, 0.35);
  }
  return { play };
}
