/**
 * NM Design — portfolio de Noah Milsztajn
 * Démarrage : styles → défilement → sections → ton des sections → arrivée.
 * Aucun écran de chargement : le contenu est là tout de suite, l'animation
 * d'entrée (≈ 1 s) se joue par-dessus sans jamais bloquer la page.
 */
import './styles/index.css';
import { initScroll, ScrollTrigger } from './core/scroll.js';
import { initHeader } from './ui/header.js';
import { initMenu } from './ui/menu.js';
import { initCursorTag } from './ui/cursor-tag.js';
import { initReveals } from './ui/reveals.js';
import { initTone } from './ui/tone.js';
import { initLiveSites } from './ui/live-site.js';
import { initHero } from './sections/hero.js';
import { initWorks } from './sections/works.js';
import { initObject } from './sections/object.js';
import { initContact } from './sections/contact.js';
import { initAbout } from './sections/about.js';
import { initStudio } from './sections/studio.js';
import { initProjectView } from './project/view.js';
import { initCommerce } from './sections/commerce.js';
import { initPageTransitions } from './ui/transitions.js';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// Chaque module démarre isolément : une erreur propre à un navigateur (navigateur intégré d'une appli,
// WebView ancienne, WebGL refusé…) reste dans son module et ne laisse jamais la page à moitié prête.
const safe = (name, fn, fallback) => {
  try { return fn(); } catch (err) { console.error(`[NM] ${name} :`, err); return fallback; }
};
// filet de sécurité : si l'entrée du titre ne peut pas se jouer, le titre s'affiche tel quel
const showHero = () => document.querySelectorAll('.hero__word, [data-hero-fade]').forEach((el) => { el.style.transform = ''; el.style.opacity = ''; el.style.visibility = ''; });

safe('défilement', initScroll);
safe('transitions', initPageTransitions);
safe('en-tête', initHeader);
safe('menu', initMenu);
safe('curseur', initCursorTag);
safe('site en direct', initLiveSites);
const hero = safe('accueil', initHero, null);
safe('projets', initWorks);
safe('studio', initStudio);
safe('lab 3D', initObject);
safe('contact', initContact);
safe('à propos', initAbout);
const projectView = safe('études de cas', initProjectView, { openFromURL() {} });
const commerce = safe('offres', initCommerce, { openFromURL() {} });
safe('tons', initTone);
if (!hero || safe('entrée', () => { hero.play(); return true; }, false) === false) showHero();

// les révélations au défilement découpent les lignes : on attend les vraies polices
const fontsReady = document.fonts?.ready || Promise.resolve();
fontsReady.then(() => {
  safe('révélations', initReveals);
  safe('mise en page', () => ScrollTrigger.refresh());
  safe('lien vers un projet', () => projectView.openFromURL());
  safe('lien vers une offre', () => commerce.openFromURL());
  // ancre de section dans l'URL (ex. lien partagé vers #object)
  // getElementById : une ancre arbitraire (ex. « #1abc », « #<x> ») ne peut ni planter ni cibler autre chose qu'un id
  let anchor = null;
  if (location.hash.length > 1 && !location.hash.startsWith('#/')) {
    try { anchor = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* ancre mal encodée : ignorée */ }
  }
  anchor?.scrollIntoView();
});
