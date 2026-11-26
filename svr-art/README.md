# SVR — ART · first visual

Spontaneous art-direction proposal for the website of SVR, contemporary painter (France).
Direction: **dark contemporary gallery × luxury editorial × street art**.

Static site — plain HTML / CSS / JS, no dependency, no build step.

## Run it locally

From the repository root:

```bash
npm install && npm run svr   # Vite dev server → http://localhost:5174
# or, without Node:
cd svr-art && python3 -m http.server 4173   # → http://localhost:4173
```

Use a local server rather than opening `index.html` directly: browsers block
self-hosted fonts on `file://`.

## Structure

```
svr-art/
├── index.html            hero + Work / About / Contact
├── assets/css/style.css  tokens, layout, animations (one file)
├── assets/js/main.js     intro, scroll reveals, header, hero depth, menu
├── assets/fonts/         Bodoni Moda (+ italic), Instrument Sans — self-hosted, OFL
└── assets/img/           artworks (WebP)
```

## Design notes

- **Hero** — the painting on sheet music is shown whole, at its true proportions
  (873 × 1102), on a charcoal "wall" lit from above like the artist's booth.
  Labels hang off the painting's edges like gallery wall labels.
  - Wide screens (laptop, desktop, tablet landscape): painting centred,
    signature running vertically along its left edge, caption at bottom right.
  - Tablet portrait: larger painting, labels under it.
  - Phones: the painting runs edge to edge when the screen is tall enough,
    a single line of labels under it; very short phones drop the caption.
- **Type** — Bodoni Moda (a Didone, close to the artist's own SVR wordmark) for
  artistic elements; Instrument Sans for navigation and information.
- **Palette** — charcoal `#141312`, deep black `#0b0a09`, mineral grey `#77726b`,
  off-white `#ece7de`, natural wood `#c8a676` used as an accent only.
- **Motion** — the spotlight comes on, the painting is unveiled from the top,
  the text rises from line masks. Light pointer depth on desktop, a gentle
  recede on scroll. No scroll-jacking, no custom cursor.
  `prefers-reduced-motion` keeps the composition and drops the movement.

## Images — to replace with the originals

All current images were cropped from phone screenshots (Instagram posts and
stories) and are therefore limited in resolution. Before going live, ask the
artist for HD files and replace them **with the same file names**:

| File | Content | Recommended size |
| --- | --- | --- |
| `svr-portrait-sheet-music-873.webp` / `-560` | hero painting, without its frame | 1800 px wide + 900 px wide |
| `svr-paint-board-0X-900.webp` / `-520` | Paint-Boards, cut out (transparent PNG/WebP) | 1800 px wide + 900 px wide |
| `svr-exhibition-view-1179.webp` / `-720` | exhibition view | 2000 px wide + 1000 px wide |

If the size changes, update the `width` / `height` / `srcset` values in
`index.html` (and `--art-ratio` in `style.css` if a different hero painting is used).

## Copy to confirm with the artist

Wording is a proposal written from what is visible in the work:
"N°01 — Portrait on sheet music — Paint & collage" (title and medium to confirm),
"Portraits painted between the street and the gallery", the About paragraph,
"Exhibition view — 2025". The only contact shown is the real Instagram account
(@svr__art); add an e-mail address once one is provided.
