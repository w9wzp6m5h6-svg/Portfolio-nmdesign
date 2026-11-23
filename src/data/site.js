/**
 * Coordonnées et informations légales. Uniquement des informations réelles,
 * fournies par Noah. Les sections Contact, pied de page, demande de projet et
 * mentions légales se construisent à partir de ce fichier.
 */
export const site = {
  name: 'Noah Milsztajn',
  role: 'Web designer & créatif digital',

  email: 'nm.officestudiodesign@gmail.com',
  /** objet pré-rempli des liens e-mail et du formulaire */
  emailSubject: 'Demande de projet — Noah Milsztajn',

  socials: [
    { label: 'Instagram', handle: '@noah.mlzn_', url: 'https://www.instagram.com/noah.mlzn_/' },
  ],

  /**
   * Mentions légales — À COMPLÉTER avant la mise en ligne (obligation légale
   * pour une activité professionnelle en France). Les champs vides ne sont pas
   * affichés ; le build affiche un avertissement tant qu'ils manquent.
   */
  legal: {
    status: '',        // ex. « Entrepreneur individuel (micro-entreprise) »
    siret: '',         // ex. « 123 456 789 00012 »
    address: '',       // adresse professionnelle ou de domiciliation
    vatNote: '',       // ex. « TVA non applicable, art. 293 B du CGI » si c'est votre cas
    host: { name: '', address: '', url: '' }, // ex. Netlify, Inc. — 512 2nd Street…
  },
};

/** Lien mailto avec objet (et corps facultatif), correctement encodé. */
export function mailto(subject = site.emailSubject, body = '') {
  const q = [];
  if (subject) q.push(`subject=${encodeURIComponent(subject)}`);
  if (body) q.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${site.email}${q.length ? `?${q.join('&')}` : ''}`;
}
