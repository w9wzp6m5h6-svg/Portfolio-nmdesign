# Cynthia Rimo · L’Empreinte Art Gallery — Remaster

Site d’artiste en fichier unique (`index.html`, images intégrées). Ce dossier contient le **remaster visuel et UX** : même contenu, mêmes fonctionnalités, même identité, mais une seule direction artistique, une seule grille et une seule langue de mouvement.

> Le commit précédent contient le fichier **tel que reçu**. `git diff HEAD~1 -- sites/cynthia-rimo/index.html` montre exactement ce qui a changé.

## Ce qui a été conservé (vérifié automatiquement)

`qa/compare.cjs` compare l’original et le remaster dans Chromium, avec et sans JavaScript :

| Contrôle | Résultat |
| --- | --- |
| Texte visible (13 083 car. sans JS, 13 924 avec le contenu généré) | identique |
| Liens (62) : WhatsApp, e-mail, téléphone, réseaux, Maps | identiques |
| Images (39 dans le HTML, 71 après génération) | octets identiques |
| `aria-label` (56 / 96), sections, dialogs, métadonnées | identiques |
| Éléments générés : 16 œuvres en 3D, grille filtrée, 14 filtres, 16 ♥, 5 couleurs de mur | identiques |

Les noms, prix, dimensions, techniques, descriptions, horaires et coordonnées n’ont pas été touchés, ni aucune donnée JavaScript.

```bash
node sites/cynthia-rimo/qa/compare.cjs <original.html> sites/cynthia-rimo/index.html
```

## Direction : California aesthetic

- **Lumière** : le site passe d’un noir uniforme (avec une salle claire plaquée au milieu) à une lumière naturelle, avec des blancs chauds (`--paper`), de la pierre (`--paper-2`, `--stone`) et du sable. Le noir profond (`--ink`) encadre le récit : hero photographique, bandeau Vernissages, finale Contact et footer, menu.
- **Accents** : l’or d’origine sert de filet éditorial devant chaque label, de point « aujourd’hui » dans les horaires, de progression et de flèches sur fond noir. Sur fond clair, une variante bronze garde un contraste AA. Le rouge d’origine est réservé à l’acte d’acquérir (boutons, compteur de sélection) et à « fermé ».
- **Typographie** : Archivo condensé (titres) et Bodoni Moda italique, sur une échelle unique (`--t-hero`, `--t-h2`, `--t-statement`, `--t-h3`, `--t-row`, `--t-lead`, labels à 12 px et 0,22 em). Les tailles en ligne dans le HTML ont été retirées.
- **Grille** : une marge (`--pad`, conteneur de 1 680 px), une gouttière, un rythme vertical (`--sec`, `--head`), et une grille de 12 colonnes pour le manifeste (déclarations à gauche, textes décalés) et pour Visiter (titre et informations en deux colonnes).
- **Mouvement** : les courbes du portfolio NM (`--ease-out`, `--ease-in-out`, `--ease-soft`) et des durées partagées. Un seul système de révélation, joué une fois : montée et fondu, montée masquée pour les titres, très léger zoom sur les photos. Les trois mécanismes concurrents du hero et les animations pilotées par le défilement ont été supprimés.
- **Continuité** : en défilant, la photo du hero se retire légèrement et devient une épreuve posée sur le papier (parallaxe et échelle, uniquement des transformations composées). On passe de l’image immersive au mur de la galerie.
- **Repères** : le menu signale en or la section où l’on se trouve.

## Galerie 3D

Le principe (anneau 3D, ressort critique, glisser, inertie, molette, clavier) est conservé. Ce qui change :

- **Une vraie salle** : le mur naît du fond de page, la lumière zénithale reste douce et le sol rejoint la section suivante, sans aucune rupture. L’horizon se place sous les œuvres.
- **Poids visuel égal** : chaque œuvre a la même surface, bornée en hauteur et en largeur, sur une ligne des regards commune. Les formats extrêmes (120 × 40, 40 × 120) ne paraissent plus minuscules.
- **Profondeur lumineuse** : les œuvres latérales se fondent dans le mur au lieu d’être assombries. Elles n’ont plus de cadre ajouté (certaines photos ont déjà le leur), seulement une tranche fine et une ombre portée douce. Un reflet très discret sur le sol poli, calculé par rapport à la jonction mur/sol, ancre les œuvres dans l’espace (Chrome, Safari, Edge ; ignoré ailleurs).
- **Repères** : flèches sur la ligne des regards, légende posée au sol et alignée sur la grille. La légende affiche immédiatement l’œuvre de destination. Le curseur loupe signale l’œuvre de face, qui ouvre la fiche.
- **Fiche** : l’image voyage de l’œuvre jusqu’à la fiche (FLIP, desktop). Sur mobile, la fiche monte comme une feuille depuis le bas. La salle suit l’œuvre consultée : à la fermeture (instantanée, 0,22 s), on se retrouve devant elle. Cela vaut aussi depuis le Portfolio et la grille filtrée.
- **Arrivée** : à la première apparition, l’anneau glisse doucement jusqu’à la première œuvre.
- **Mouvement réduit** : pas de glissement, positionnement direct.

## Défauts corrigés au passage

- Le label « Notre manifeste » s’affichait en taille géante (spécificité de `.mf p`).
- Sur mobile, les retours à la ligne masqués collaient les mots (« souvenir,une », « chosesans »).
- La classe `.sw`, partagée entre les couleurs de mur et l’animation de la légende, décalait la légende de 16 px.
- La classe `.cp`, partagée entre le prix et le bouton « Copier », était compensée par une série de `!important`.
- La barre de progression de la salle dépassait 100 % entre la 16ᵉ et la 1ʳᵉ œuvre.
- Ouvrir une œuvre depuis le Portfolio ne faisait pas tourner la salle vers elle.
- En tablette portrait ou sur écran presque carré, le titre se superposait au nom peint dans le tableau du hero.
- Dans la grille « Trouver mon œuvre », les formats très verticaux agrandissaient leur case et décalaient la rangée.

## Responsive

- **Mobile** : hero empilé (l’œuvre entière, dont le nom peint sert de titre, puis le sous-titre et l’invitation), salle recalibrée, grille de recherche sur 2 colonnes, fiche en feuille.
- **Tablette** : composition dédiée selon le format d’écran. Aucun défilement horizontal de 320 à 2 560 px.

## Modifier le site

Tout le style est dans **un seul bloc** `<style id="remaster">` en tête du fichier, organisé en 16 parties numérotées (00 Tokens → 15 Mouvement réduit). Les couleurs, tailles, marges et courbes se règlent dans `:root`. Les surfaces sombres réutilisent les mêmes composants avec des variables inversées.

Les retouches JavaScript sont commentées `remaster` dans le code : FLIP de la fiche, synchronisation salle ↔ fiche, en-tête clair ou encre, géométrie de la salle.

> Le fichier d’origine ne contient pas de vidéo : le hero est l’image de couverture, traitée comme telle (cadrage, voiles de lecture, entrée cinématique, parallaxe légère).
