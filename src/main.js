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

initScroll();
initPageTransitions();
initHeader();
initMenu();
initCursorTag();
initLiveSites();
const hero = initHero();
initWorks();
initStudio();
initObject();
initContact();
initAbout();
const projectView = initProjectView();
const commerce = initCommerce();
initTone();
hero.play();

// les révélations au défilement découpent les lignes : on attend les vraies polices
document.fonts.ready.then(() => {
  initReveals();
  ScrollTrigger.refresh();
  projectView.openFromURL();
  commerce.openFromURL();
  // ancre de section dans l'URL (ex. lien partagé vers #object)
  // getElementById : une ancre arbitraire (ex. « #1abc », « #<x> ») ne peut ni planter ni cibler autre chose qu'un id
  let anchor = null;
  if (location.hash.length > 1 && !location.hash.startsWith('#/')) {
    try { anchor = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* ancre mal encodée : ignorée */ }
  }
  anchor?.scrollIntoView();
});
