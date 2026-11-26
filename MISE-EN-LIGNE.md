# Mise en ligne — checklist

Le site est prêt techniquement. Ces étapes demandent **ton intervention** (compte, domaine, informations légales) : je ne peux pas les faire à ta place.

## 1. Avant de publier (obligatoire)

- [ ] **Mentions légales** — dans `src/data/site.js` → `legal` : statut (ex. micro‑entreprise), SIRET, adresse professionnelle ou de domiciliation, mention TVA si elle te concerne, et l'hébergeur (nom, adresse, site). En France, ces informations sont obligatoires pour une activité professionnelle. Tant qu'elles manquent, le build affiche un avertissement et les lignes vides ne sont pas affichées.
- [ ] **Domaine** — achète le domaine (ex. `noahmilsztajn.fr`) chez un registrar (OVH, Gandi, Infomaniak…).
- [ ] **Adresse publique** — crée un fichier `.env` à la racine (copie de `.env.example`) avec `SITE_URL=https://www.ton-domaine.fr`, puis `npm run build`. Le build ajoute alors la balise canonical, `og:url`, les URL absolues de l'image de partage et génère `sitemap.xml` + `robots.txt`.

## 2. Héberger

Dépose le **contenu** de `dist/` sur un hébergeur statique : Netlify (glisser‑déposer), Vercel, Cloudflare Pages, GitHub Pages, OVH, o2switch… Puis relie ton domaine dans l'interface de l'hébergeur (il donne les enregistrements DNS à copier chez le registrar). Active le HTTPS (automatique chez Netlify, Vercel, Cloudflare).

Vérifie ensuite sur le site en ligne :
- [ ] `https://ton-domaine/robots.txt` et `https://ton-domaine/sitemap.xml` s'ouvrent ;
- [ ] l'aperçu de partage (colle l'URL dans WhatsApp, iMessage ou https://www.opengraph.xyz) ;
- [ ] le formulaire « Démarrer un projet » et les liens e‑mail / Instagram depuis ton iPhone et un ordinateur.

## 3. Formulaire « Démarrer un projet »

**Par défaut (aucune configuration)** : à l'envoi, la messagerie du visiteur s'ouvre avec la demande déjà rédigée, adressée à `nm.officestudiodesign@gmail.com`, objet « Demande de projet — Noah Milsztajn ». Le site l'explique clairement et propose de copier la demande si aucune messagerie ne s'ouvre (fréquent sur un ordinateur sans application mail configurée). Aucun faux message « envoyé ».

**Envoi direct (recommandé une fois en ligne)** : crée un formulaire gratuit chez **Formspree** (https://formspree.io) ou **Web3Forms** (https://web3forms.com) avec ton adresse Gmail, puis dans `.env` :

```
# Formspree
VITE_FORM_ENDPOINT=https://formspree.io/f/xxxxxxx
# ou Web3Forms
VITE_FORM_ENDPOINT=https://api.web3forms.com/submit
VITE_FORM_ACCESS_KEY=ta-cle-publique
```

Rebuild (`npm run build`), republie `dist/`, puis **envoie‑toi une demande de test**. La confirmation « Demande envoyée » n'apparaît que si le service répond positivement ; en cas d'échec, le visiteur peut basculer sur l'e‑mail. Mets aussi à jour l'hébergeur et le service d'envoi dans les mentions légales (le texte de confidentialité s'adapte automatiquement).

## 4. Google Search Console

Le site n'est **pas** indexé tant que ces étapes ne sont pas faites (et Google peut prendre de quelques jours à quelques semaines).

1. Va sur https://search.google.com/search-console avec ton compte Google.
2. **Ajouter une propriété** → type **Domaine** → saisis `ton-domaine.fr`.
3. Google affiche un enregistrement **TXT** : ajoute‑le dans la zone DNS de ton registrar, attends quelques minutes, clique **Valider**.
4. Menu **Sitemaps** → saisis `sitemap.xml` → **Envoyer**.
5. Menu **Inspection de l'URL** → colle `https://ton-domaine.fr/` → **Demander une indexation**.
6. Quelques jours plus tard, consulte **Pages** (erreurs d'indexation) et **Expérience** (Core Web Vitals sur mobile).

Pour la recherche locale (« web designer Valbonne »…), crée aussi une fiche **Google Business Profile** (zone desservie, sans adresse publique si tu travailles chez toi) avec le lien vers le site.

## 5. Ce qui est déjà en place

- Titre et description pensés pour la recherche (« Noah Milsztajn — Web designer & créatif digital · Côte d'Azur »).
- Un seul H1, hiérarchie H2/H3 par section, textes alternatifs sur toutes les images.
- Open Graph + Twitter card, image de partage 1200 × 630.
- Données structurées schema.org (Person + ProfessionalService avec zones desservies et formules) : vérifiables sur https://search.google.com/test/rich-results une fois en ligne.
- Aucun cookie, aucun traceur, aucune police ou script tiers.
- Quatre pages indexables, chacune avec son titre et sa description : Accueil, Projets (`/projets/`), À propos (`/a-propos/`), Offres (`/offres/`). Elles sont toutes dans le sitemap.
- Les études de cas s'ouvrent par `#/work/…` par-dessus la page : elles ne sont pas des pages indexables séparées.

## 6. Lien direct pour ta prospection

`https://ton-domaine.fr/#demarrer` (ou `/offres/#demarrer`) ouvre directement le formulaire de demande de projet — utile dans ta bio Instagram ou tes messages.
