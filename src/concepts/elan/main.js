/**
 * ÉLAN — site de la marque (concept). Une seule scène WebGL : la canette du hero.
 * Les autres visuels sont des rendus fixes de la même canette (tools/render/elan.mjs).
 */
import '../concept.css';
import './elan.css';
import { env } from '../../core/env.js';
import { esc } from '../../core/escape.js';
import { asset } from '../../core/asset.js';
import { VARIANTS, INGREDIENTS } from './data.js';
import { mountCan } from './experience.js';
import { initConcept } from '../concept.js';

const root = document.querySelector('[data-can-root]');
const theme = document.querySelector('meta[name="theme-color"]');

// la gamme : une colonne par saveur, rendu fixe de la canette
const flavors = document.querySelector('[data-elan-flavors]');
flavors.innerHTML = VARIANTS.map((v, i) => `
  <li class="elan-flavor" data-flavor="${v.id}">
    <div class="elan-flavor__stage">
      <img src="${asset(`media/works/elan/elan_can_${v.id}-800.webp`)}" srcset="${asset(`media/works/elan/elan_can_${v.id}-800.webp`)} 800w, ${asset(`media/works/elan/elan_can_${v.id}-1400.webp`)} 1400w"
        sizes="(max-width: 700px) 46vw, 24vw" width="800" height="1000" alt="Canette ÉLAN ${esc(v.name)}" loading="lazy" decoding="async" />
    </div>
    <p class="elan-kicker">${String(i + 1).padStart(2, '0')}</p>
    <h3 class="elan-flavor__name">${esc(v.name)}</h3>
    <p class="elan-flavor__mood">${esc(v.mood)}</p>
    <button type="button" class="elan-link" data-show="${v.id}">Voir en 3D <span aria-hidden="true">↑</span></button>
  </li>`).join('');
flavors.querySelectorAll('.elan-flavor').forEach((li) => {
  const v = VARIANTS.find((x) => x.id === li.dataset.flavor);
  li.style.setProperty('--flavor', v.body);
});

document.querySelector('[data-elan-ingredients]').innerHTML = INGREDIENTS.map(([name, text], i) => `
  <li class="elan-ingredient" data-c-reveal>
    <span class="elan-ingredient__num">${String(i + 1).padStart(2, '0')}</span>
    <h3 class="elan-ingredient__name">${esc(name)}</h3>
    <p class="elan-ingredient__text">${esc(text)}</p>
  </li>`).join('');

// la page prend une teinte très légère de la saveur choisie
const tint = (v) => {
  document.body.style.setProperty('--page', v.page);
  document.body.style.setProperty('--can-body', v.body);
  document.body.style.setProperty('--can-accent', v.accent);
  document.body.toggleAttribute('data-dark-cta', !!v.dark);
  theme?.setAttribute('content', v.page);
};

const goTop = (focusList = true) => {
  root.scrollIntoView({ behavior: env.reducedMotion ? 'auto' : 'smooth', block: 'start' });
  if (focusList) setTimeout(() => root.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true }), env.reducedMotion ? 0 : 650);
};

mountCan(root, { onVariant: tint }).then((can) => {
  tint(VARIANTS[0]);
  can.start();
  flavors.addEventListener('click', (e) => {
    const b = e.target.closest('[data-show]');
    if (!b) return;
    can.setVariant(b.dataset.show);
    goTop(false);
  });
});

// l'indication s'efface dès la première prise en main
root.querySelector('[data-can-canvas]')?.addEventListener('pointerdown', () => root.classList.add('is-handled'), { once: true });

document.querySelectorAll('[data-pick]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); goTop(); }));

initConcept();
