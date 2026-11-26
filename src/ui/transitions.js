/**
 * Transition entre pages : fondu court (≈ 0,3 s) à la sortie, apparition à
 * l'arrivée. Uniquement pour les liens internes vers une autre page ; les
 * ancres, nouveaux onglets, e-mails et liens externes ne sont pas touchés.
 */
import { env } from '../core/env.js';

export function initPageTransitions() {
  const root = document.documentElement;
  // retour arrière (cache navigateur) : la page doit réapparaître
  window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('is-leaving'); });
  if (env.reducedMotion) return;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto|tel|sms):/i.test(href)) return;
    let url;
    try { url = new URL(a.href, location.href); } catch { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // même page
    e.preventDefault();
    root.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 280);
  });
}
