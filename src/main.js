/**
 * Noah Milsztajn — Portfolio V2
 * Boot order: styles → smooth scroll → sections (static) → intro → hero arrival.
 */
import './styles/index.css';
import { initScroll, ScrollTrigger } from './core/scroll.js';
import { runLoader } from './ui/loader.js';
import { initHeader } from './ui/header.js';
import { initMenu } from './ui/menu.js';
import { initCursorTag } from './ui/cursor-tag.js';
import { initReveals } from './ui/reveals.js';
import { initHero } from './sections/hero.js';
import { initWorks } from './sections/works.js';
import { initObject } from './sections/object.js';
import { initContact } from './sections/contact.js';
import { initAbout } from './sections/about.js';
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
const hero = initHero();
initWorks();
initObject();
initContact();
initAbout();
const projectView = initProjectView();
const commerce = initCommerce();

// reveals need final fonts for correct line breaks
document.fonts.ready.then(() => {
  initReveals();
  ScrollTrigger.refresh();
});

runLoader({ onReveal: () => hero.play() }).then(() => {
  ScrollTrigger.refresh();
  projectView.openFromURL();
  commerce.openFromURL();
  // honour a section anchor in the URL (e.g. shared link to #object)
  // getElementById : une ancre arbitraire (ex. « #1abc », « #<x> ») ne peut ni planter ni cibler autre chose qu'un id
  let anchor = null;
  if (location.hash.length > 1 && !location.hash.startsWith('#/')) {
    try { anchor = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* ancre mal encodée : ignorée */ }
  }
  anchor?.scrollIntoView();
});
