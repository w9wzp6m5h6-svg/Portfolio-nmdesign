/**
 * Ton de la page : ivoire ou presque noir, selon la section au centre de l'écran.
 * Chaque section porte data-tone="light" | "dark" ; la page entière (fond, texte,
 * boutons, en-tête) glisse d'un ton à l'autre (transition CSS sur body). Les
 * projets et la fin du site sont sombres : on éteint la salle quand le travail commence.
 */
import { ScrollTrigger } from '../core/scroll.js';

export function initTone() {
  const html = document.documentElement;
  const sections = [...document.querySelectorAll('[data-tone]')];
  const set = (tone) => { if (html.dataset.tone !== tone) html.dataset.tone = tone; };
  set(sections[0]?.dataset.tone || 'light');
  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) set(section.dataset.tone); },
    });
  });
}
