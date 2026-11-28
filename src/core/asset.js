/**
 * Résout un fichier public (media/, models/…) depuis la page courante.
 * Chaque page déclare sa profondeur sur <html data-root="./"> ou "../" :
 * le site fonctionne à la racine d'un domaine, dans un sous-dossier ou en démo locale.
 *   asset('models/sneaker-hd.glb') → '../models/sneaker-hd.glb' depuis /projets/
 */
const ROOT = (typeof document !== 'undefined' && document.documentElement.dataset.root) || './';
export const asset = (path) => ROOT + String(path).replace(/^\/+/, '');

/** Lien vers une page du site, lu dans la navigation (respecte le mode artefact). */
export const pageHref = (key) => document.querySelector(`.header__nav [data-nav="${key}"], .menu__nav [data-nav="${key}"]`)?.getAttribute('href') || null;

/** Lien vers une page en dossier (concepts/elan/) : ajoute index.html pour les hébergeurs sans index de dossier. */
/* global __EXPLICIT_INDEX__ */
const EXPLICIT = typeof __EXPLICIT_INDEX__ !== 'undefined' && __EXPLICIT_INDEX__;
export const pageUrl = (dir) => asset(String(dir).replace(/\/?$/, '/') + (EXPLICIT ? 'index.html' : ''));
