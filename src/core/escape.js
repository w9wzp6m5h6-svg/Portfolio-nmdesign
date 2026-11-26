/**
 * Échappement HTML pour les gabarits (contenu de balise et valeurs d'attribut,
 * entre guillemets simples ou doubles). Toute donnée insérée via innerHTML passe par ici.
 */
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => MAP[c]);
