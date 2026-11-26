# SVR ART — Enter the artist's world

Concept for a client presentation: the website of SVR, contemporary painter (France).
Direction: **art brut × luxury editorial × cinematic experience**.

Static site — plain HTML / CSS / JS, no dependency, no build step.

## Run it locally

From the repository root:

```bash
npm install && npm run svr                   # Vite dev server → http://localhost:5174
# or, without Node:
cd svr-art && python3 -m http.server 4173    # → http://localhost:4173
```

Use a local server rather than opening `index.html` directly (browsers block
self-hosted fonts and images used as masks on `file://`).

Useful URL parameters while reviewing:

| Parameter | Effect |
| --- | --- |
| `?intro=1` | always play the intro (it otherwise plays once per browser session) |
| `?intro=0` | go straight to the homepage |
| `?intro=1&t=4.2` | freeze the intro on a given second, to inspect a frame |

## The experience

1. **Intro — the laptop as a portal** (`assets/js/intro.js`, ~8 s, skippable)
   - A. dark studio, a closed aluminium laptop, a light sweep across the lid
   - B. the lid opens in real 3D perspective (CSS 3D, no WebGL, no video)
   - C. the screen wakes on the **original S/R ART logo** (oval + letters)
   - D. the camera moves in and squares up to the screen
   - E/F. the screen grows until it *is* the browser window
   - G. the oval dissolves and the letters fly to their place as the homepage masthead

   The screen takes the proportions of the visitor's window, so the hand-off is exact.
   Phones and portrait tablets get a lighter version: a single aluminium-rimmed device,
   no keyboard. Skip at any time: button, `Esc`, scroll wheel, swipe or arrow keys.
   With `prefers-reduced-motion`, the intro is not played.

2. **Cover** — the masthead (his letters) and the Paint-Boards as a long, layered
   composition; the boards slide apart on scroll and react slightly to the pointer.
3. **01 · Sheet music portraits** — pinned: the painting starts as a close-up on the face
   and pulls back to the whole work; the words printed on the scores under the paint
   (Arpèges, Main gauche, Legato, Gamme chromatique) appear as annotations.
4. **02 · Paint-Boards** — the vertical scroll drives a horizontal track; each board tilts
   and catches the light under the cursor. Phones: a simple stack.
5. **03 · Studio** — "From the screen to the wood": his own MacBook photo with the board
   designs, the painted board crossing over it, then the exhibition wall.
6. **Contact** — Instagram, the only contact known so far.

## Structure

```
svr-art/
├── index.html
├── assets/css/style.css   tokens, intro scene, layout, motion (one file)
├── assets/js/site.js      hero reveal + hand-off, scroll scenes, header, menu
├── assets/js/intro.js     intro timeline (a pure function of time)
├── assets/fonts/          Bodoni Moda (+ italic), Instrument Sans — self-hosted, OFL
└── assets/img/            logo, artworks, studio photo (WebP)
```

## Identity

- **Logo** — `svr-logo-letters.webp` is extracted from the artist's own logo design
  (perspective-corrected from a photo of his screen, upscaled, edges smoothed).
  It is not redrawn. The oval is rebuilt geometrically with the measured proportions
  (1627 × 768) and grey (`#838383`). **Ask the artist for the vector file** and drop it in
  with the same name (or as SVG, updating the `src`).
- **Type** — Bodoni Moda (a Didone, the family of his logo) + Instrument Sans.
- **Palette** — aluminium `#c6c8cb`, stone `#8f8c87`, soft black `#111111`,
  off-white `#efede9`. The wood and photographic tones come from the works themselves.

## Images — to replace with the originals

All images come from phone screenshots (Instagram posts and stories), so their
resolution is limited. Replace them with HD files **using the same names**:

| File | Content | Recommended |
| --- | --- | --- |
| `svr-logo-letters.webp` / `-1081` | logo letters, transparent | vector (SVG) |
| `svr-portrait-sheet-music-873.webp` / `-560` | painting on sheet music, no frame | 1800 px + 900 px wide |
| `svr-paint-board-0X-900.webp` / `-520` | Paint-Boards, cut out, transparent | 1800 px + 900 px wide |
| `svr-studio-macbook-1179.webp` / `-700` | studio photo | 1600 px + 800 px wide |
| `svr-exhibition-view-1179.webp` / `-720` | exhibition view | 2400 px + 1200 px wide |

If sizes change, update `width` / `height` / `srcset` in `index.html`.

## Copy to confirm with the artist

Written from what is visible in the work and his posts: "Faces the street already
knows", "The music stays under the skin", the board notes (Gold grills, …),
"From the screen to the wood" and its paragraph (inferred from his August 2024 studio
story), "Exhibition view — 2025", "N°01 — Portrait on sheet music · Paint & collage".
