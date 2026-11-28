/**
 * PORTANT — site de la boutique (concept). Le portant est le hero ; le reste de la
 * page y ramène (focus, index de la collection). Sac en mémoire, jamais envoyé.
 */
import '../concept.css';
import './rack.css';
import './portant.css';
import { env } from '../../core/env.js';
import { esc } from '../../core/escape.js';
import { asset } from '../../core/asset.js';
import { PIECES, euro } from './data.js';
import { mountRack } from './rack.js';
import { initConcept } from '../concept.js';

const rackRoot = document.querySelector('[data-rack-root]');

/* sac : en mémoire uniquement ------------------------------------------------ */
const bag = [];
const toggle = document.querySelector('[data-bag-toggle]');
const panel = document.getElementById('pt-bag-panel');
function renderBag() {
  document.querySelector('[data-bag-count]').textContent = `(${bag.length})`;
  document.querySelector('[data-bag-list]').innerHTML = bag.length
    ? bag.map((b, i) => `<li><span>${esc(b.name)} — ${esc(b.size)}</span><span>${euro(b.price)}</span><button type="button" data-remove="${i}" aria-label="Retirer ${esc(b.name)}">Retirer</button></li>`).join('')
    : '<li class="pt-bag__empty">Le sac est vide.</li>';
  document.querySelector('[data-bag-total]').textContent = bag.length ? `Total : ${euro(bag.reduce((s, b) => s + b.price, 0))}` : '';
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  panel.hidden = !open;
});
panel.addEventListener('click', (e) => {
  const r = e.target.closest('[data-remove]');
  if (!r) return;
  bag.splice(Number(r.dataset.remove), 1);
  renderBag();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); } });
document.addEventListener('click', (e) => { if (!panel.hidden && !e.target.closest('.pt-bag')) { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); } });
renderBag();

const rack = mountRack(rackRoot, {
  onAdd: (p, size) => {
    bag.push({ name: p.name, size, price: p.price });
    renderBag();
    toggle.classList.remove('is-bump'); void toggle.offsetWidth; toggle.classList.add('is-bump');
  },
});

const toRack = (i) => {
  rackRoot.scrollIntoView({ behavior: env.reducedMotion ? 'auto' : 'smooth', block: 'center' });
  setTimeout(() => rack.goTo(i), env.reducedMotion ? 0 : 450);
};

/* index de la collection : la pièce apparaît sous le pointeur ------------------- */
const list = document.querySelector('[data-pt-index]');
list.innerHTML = PIECES.map((p, i) => `
  <li class="pt-row" data-c-reveal>
    <button type="button" class="pt-row__btn" data-show="${i}" data-peek-src="${asset(`media/works/portant/garments/${p.id}-480.webp`)}">
      <span class="pt-row__n">${String(i + 1).padStart(2, '0')}</span>
      <span class="pt-row__name">${esc(p.name)}</span>
      <span class="pt-row__matter">${esc(p.matter)}</span>
      <span class="pt-row__color">${esc(p.color)}</span>
      <span class="pt-row__price">${euro(p.price)}</span>
    </button>
  </li>`).join('');
const peek = document.querySelector('.pt-index__peek');
const peekImg = peek.querySelector('[data-peek]');
if (env.finePointer && !env.reducedMotion) {
  let px = 0; let py = 0; let tx = 0; let ty = 0; let raf = 0;
  const follow = () => {
    px += (tx - px) * 0.18; py += (ty - py) * 0.18;
    peek.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.5 ? requestAnimationFrame(follow) : 0;
  };
  list.addEventListener('pointermove', (e) => {
    tx = e.clientX + 24; ty = e.clientY - 120;
    if (!raf) raf = requestAnimationFrame(follow);
  });
  list.addEventListener('pointerover', (e) => {
    const b = e.target.closest('[data-peek-src]');
    if (!b) return;
    if (peekImg.getAttribute('src') !== b.dataset.peekSrc) peekImg.src = b.dataset.peekSrc;
    peek.classList.add('is-on');
  });
  list.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-show]');
  if (b) toRack(Number(b.dataset.show));
});

initConcept();
