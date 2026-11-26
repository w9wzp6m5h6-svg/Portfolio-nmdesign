/**
 * Styles dynamiques compatibles avec la Content-Security-Policy.
 *
 * La CSP du site interdit les attributs style="…" dans le HTML (pas de
 * 'unsafe-inline'). Les gabarits écrivent donc data-css="prop:valeur;…" et
 * applyCss() recopie ces déclarations via le CSSOM (element.style), que la CSP
 * autorise. Les valeurs viennent uniquement des fichiers de données du site.
 */
export function applyCss(root) {
  if (!root) return;
  const els = root.matches?.('[data-css]') ? [root, ...root.querySelectorAll('[data-css]')] : root.querySelectorAll('[data-css]');
  els.forEach((el) => {
    el.style.cssText += `;${el.dataset.css}`;
    el.removeAttribute('data-css');
  });
}
