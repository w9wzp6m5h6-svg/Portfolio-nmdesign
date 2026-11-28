/**
 * Aperçu interactif d'un vrai site livré (L'Empreinte).
 * Le site n'est chargé qu'à la demande (bouton) : rien n'est téléchargé tant que
 * le visiteur ne le décide pas. Il tourne dans une iframe « sandbox » SANS
 * allow-same-origin : origine opaque, aucun accès au portfolio (ni DOM, ni
 * stockage), ses liens WhatsApp / Instagram s'ouvrent dans un nouvel onglet.
 */
const SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox';

export function launchSite(frame, src, title) {
  if (!frame || frame.querySelector('iframe')) return;
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title;
  iframe.setAttribute('sandbox', SANDBOX);
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.className = 'live-site__frame';
  frame.classList.add('is-loading');
  iframe.addEventListener('load', () => {
    frame.classList.remove('is-loading');
    frame.classList.add('is-live');
    iframe.focus({ preventScroll: true });
  }, { once: true });
  frame.append(iframe);
  // plein écran : on agrandit le cadre isolé lui-même (le site ne quitte jamais sa sandbox).
  // Le bouton est hors du cadre, pour ne masquer aucun élément du site.
  const full = frame.closest('[data-project-card], .p-site')?.querySelector('[data-site-full]');
  if (full && document.fullscreenEnabled && frame.requestFullscreen) {
    full.hidden = false;
    full.onclick = () => (document.fullscreenElement ? document.exitFullscreen() : frame.requestFullscreen().catch(() => {}));
  }
}

/** Délégation : tout bouton [data-site-launch] lance l'aperçu dans son [data-site-frame]. */
export function initLiveSites(root = document) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-site-launch]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const frame = b.closest('[data-site]')?.querySelector('[data-site-frame]');
    launchSite(frame, b.dataset.siteLaunch, b.dataset.siteTitle || 'Aperçu interactif du site');
    b.hidden = true;
  });
}
