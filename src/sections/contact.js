/**
 * Fin de site.
 *  - le monogramme NM revient en un seul grand trait : il se trace à l'arrivée,
 *    puis se comporte comme une corde que le curseur (ou le doigt) peut pincer ;
 *  - le bouton rond « Démarrer un projet » est magnétique : il glisse vers le curseur ;
 *  - coordonnées construites uniquement depuis src/data/site.js.
 */
import { gsap, ScrollTrigger } from '../core/scroll.js';
import { env } from '../core/env.js';
import { site, mailto } from '../data/site.js';
import { esc as escAttr } from '../core/escape.js';


function renderActions(root) {
  const lines = [];
  if (site.email) {
    lines.push(`
      <li class="contact__line-item">
        <span class="label contact__label">Me contacter par e-mail</span>
        <a class="contact__value" href="${escAttr(mailto())}">${escAttr(site.email)}</a>
        <button class="chip contact__copy" type="button" data-copy="${escAttr(site.email)}">Copier<span class="contact__copied label" aria-live="polite">Adresse copiée</span></button>
      </li>`);
  }
  site.socials.forEach((s) => {
    lines.push(`
      <li class="contact__line-item">
        <span class="label contact__label">${escAttr(s.label)}</span>
        <a class="contact__value" href="${escAttr(s.url)}" target="_blank" rel="noopener noreferrer">${escAttr(s.handle || s.label)}<span aria-hidden="true"> ↗</span><span class="visually-hidden"> (nouvel onglet)</span></a>
      </li>`);
  });
  root.innerHTML = lines.length
    ? `<ul class="contact__list">${lines.join('')}</ul>`
    : '<p class="contact__note label">Coordonnées bientôt disponibles.</p>';

  root.querySelector('[data-copy]')?.addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.classList.add('is-copied');
      setTimeout(() => b.classList.remove('is-copied'), 1800);
    } catch {
      // presse-papiers indisponible : on sélectionne l'adresse pour une copie manuelle
      const value = b.parentElement.querySelector('.contact__value');
      const range = document.createRange();
      range.selectNodeContents(value);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
}

export function initContact() {
  const section = document.querySelector('.contact');
  if (!section) return;
  const svg = section.querySelector('.contact__mark');
  const line = svg.querySelector('.contact__line');
  renderActions(section.querySelector('[data-contact]'));

  // bouton magnétique (pointeur fin uniquement)
  const orb = section.querySelector('[data-magnetic]');
  if (orb && !env.reducedMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const inner = orb.querySelector('.contact__orb-in');
    const ox = gsap.quickTo(orb, 'x', { duration: 0.8, ease: 'power3.out' });
    const oy = gsap.quickTo(orb, 'y', { duration: 0.8, ease: 'power3.out' });
    const ix = gsap.quickTo(inner, 'x', { duration: 0.8, ease: 'power3.out' });
    const iy = gsap.quickTo(inner, 'y', { duration: 0.8, ease: 'power3.out' });
    orb.addEventListener('pointermove', (e) => {
      const r = orb.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      ox(dx * 0.28); oy(dy * 0.28); ix(dx * 0.12); iy(dy * 0.12);
    });
    orb.addEventListener('pointerleave', () => { ox(0); oy(0); ix(0); iy(0); });
  }

  const base = line.getAttribute('points').trim().split(/\s+/).map((p) => p.split(',').map(Number));
  const pts = base.map(([x, y]) => ({ x, y, vx: 0, vy: 0, bx: x, by: y }));
  const len = line.getTotalLength();

  if (env.reducedMotion) return;

  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.to(line, {
    strokeDashoffset: 0, duration: 2.4, ease: 'power3.inOut',
    scrollTrigger: { trigger: section, start: 'top 60%', once: true },
    onComplete: () => gsap.set(line, { clearProps: 'strokeDasharray,strokeDashoffset' }),
  });
  gsap.fromTo(svg, { color: '#1d1d20' }, {
    color: '#4b4c51', ease: 'none',
    scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 20%', scrub: true },
  });

  // string physics ----------------------------------------------------------
  const pointer = { x: -999, y: -999, px: -999, py: -999, inside: false };
  let running = false;
  let raf = 0;

  const toSvg = (cx, cy) => {
    const m = svg.getScreenCTM();
    if (!m) return { x: -999, y: -999 };
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  function step() {
    let energy = 0;
    const R = 26; // influence radius in mark units
    const vx = pointer.x - pointer.px;
    const vy = pointer.y - pointer.py;
    pointer.px = pointer.x; pointer.py = pointer.y;
    for (const p of pts) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (pointer.inside && d < R) {
        const f = (1 - d / R) ** 2;
        p.vx += vx * f * 0.55;
        p.vy += vy * f * 0.55;
      }
      // spring back to rest
      p.vx += (p.bx - p.x) * 0.06;
      p.vy += (p.by - p.y) * 0.06;
      p.vx *= 0.86; p.vy *= 0.86;
      p.x += p.vx; p.y += p.vy;
      energy += Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.bx - p.x) + Math.abs(p.by - p.y);
    }
    line.setAttribute('points', pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));
    if (energy > 0.02 || pointer.inside) raf = requestAnimationFrame(step);
    else running = false;
  }
  const wake = () => { if (!running) { running = true; raf = requestAnimationFrame(step); } };

  const onMove = (e) => {
    const p = toSvg(e.clientX, e.clientY);
    if (!pointer.inside) { pointer.px = p.x; pointer.py = p.y; }
    pointer.x = p.x; pointer.y = p.y;
    pointer.inside = true;
    wake();
  };
  const onLeave = () => { pointer.inside = false; wake(); };

  ScrollTrigger.create({
    trigger: section, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => {
      if (self.isActive) {
        section.addEventListener('pointermove', onMove, { passive: true });
        section.addEventListener('pointerleave', onLeave);
      } else {
        section.removeEventListener('pointermove', onMove);
        section.removeEventListener('pointerleave', onLeave);
        cancelAnimationFrame(raf); running = false;
      }
    },
  });
}
