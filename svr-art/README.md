# SVR ART — the Mac is the portal

Concept for a client presentation: the website of SVR, contemporary painter (France).
The Mac is the portal, the logo is the signature, the works are the heart.

Static site — plain HTML / CSS / JS, no dependency, no build step.

## Run it locally

```bash
npm install && npm run svr                   # from the repository root → http://localhost:5174
# or, without Node:
cd svr-art && python3 -m http.server 4173    # → http://localhost:4173
```

Use a local server rather than opening `index.html` directly (browsers block
self-hosted fonts on `file://`).

### Review parameters

| URL | Effect |
| --- | --- |
| `?intro=1` | play the full intro (removed from the address bar once read) |
| `?intro=short` | the short signature entrance |
| `?intro=0` | no intro |
| `?intro=1&t=4.2` | freeze the intro on a given second |
| `?intro=1&ts=0.25` | play the intro at quarter speed |

## Who sees what

| Visitor | Entrance |
| --- | --- |
| First visit | full intro (~8 s on desktop, ~5 s on phones), skippable at any moment |
| Came back within 7 days, or *Save-Data* on | short signature (1.7 s): the logo appears, then settles in the navigation |
| `prefers-reduced-motion` | no intro, the page simply appears |
| No JavaScript | the full page, no intro |

Skip: the *Skip intro →* button, `Esc`, `Space`, `Enter`, arrow down, scroll wheel or a swipe.
The footer's *Replay intro* plays it again.

## The intro (`assets/js/intro.js`)

1. **Darkness** — a light comes up; a closed aluminium laptop in a studio (back light,
   floor pool, contact shadow, reflection, grain). A specular light crosses the lid.
2. **Opening** — the lid opens with a slight settle at the end, for weight.
3. **The screen wakes** — soft black, the original oval, then the letters, one pass of light.
4. **Entering** — the camera squares up to the screen. The real homepage then appears
   *inside the screen* while the logo travels to its place in the navigation; the screen
   grows until it is the browser window. No cut, no loading between scenes: the page you
   land on is the one you saw in the screen.

CSS 3D only (no WebGL, no model to download). The screen takes the proportions of the
visitor's window, which is what makes the final hand-off exact. Phones and portrait
tablets get a single aluminium-rimmed device instead of the laptop.

## The site

- **Cover** — the logo in the navigation, one dominant work (Paint-Board, gold grills),
  one secondary work, a short editorial line, a lot of black.
- **01 · Work — a private view** — the painting on sheet music starts as a close-up on the
  face and pulls back to the whole work (the words printed on the scores appear as
  annotations), then the Paint-Boards in an editorial rhythm: dominant, secondary, a
  typographic pause, dominant, offset.
- **Viewer** (`assets/js/viewer.js`) — every work opens alone on black, growing out of its
  place on the page. Previous / next (buttons, ← →, swipe), `Esc` or *Close*, focus returns
  to the work. Only the information actually known is shown (series, medium as visible,
  a description of the image) — no invented title, year or dimensions.
- **02 · Studio** — his own photo of the board designs on his MacBook, the finished board,
  then the exhibition wall.
- **03 · Contact** — Instagram (the only contact known so far).

## Structure

```
svr-art/
├── index.html
├── assets/css/style.css   tokens, intro scene, layout, motion — one file, in page order
├── assets/js/site.js      hero reveal, scroll scenes, header, active section, menu
├── assets/js/intro.js     intro timeline (a pure function of time) + entrances
├── assets/js/viewer.js    the work viewer (native <dialog>)
├── assets/fonts/          Bodoni Moda (+ italic), Instrument Sans — self-hosted, OFL
└── assets/img/            logo, works, studio photo (WebP)
```

## Identity

- **Logo** — `svr-logo-letters.webp` is extracted from the artist's own logo design
  (perspective-corrected from a photo of his screen, upscaled, edges smoothed); not redrawn.
  The oval is rebuilt with the measured proportions (1627 × 768) and grey (`#838383`).
  **Ask the artist for the vector file** and drop it in with the same name.
- **Palette** — deep black `#080808`, secondary black `#111111`, off-white `#F2F0EB`,
  editorial grey `#858585`, a bronze `#A8895B` used only for tiny states (current section,
  arrows on hover).
- **Type** — Bodoni Moda (a Didone, the family of his logo) for identity and titles;
  Instrument Sans for the interface; capitals with 0.22em tracking for micro-texts.

## Images — to replace with the originals

All images come from phone screenshots (Instagram posts and stories), so their resolution
is limited; the viewer never enlarges them beyond their real size on desktop.
Replace them with HD files **using the same names**:

| File | Content | Recommended |
| --- | --- | --- |
| `svr-logo-letters.webp` / `-1081` | logo letters, transparent | vector (SVG) |
| `svr-portrait-sheet-music-873.webp` / `-560` | painting on sheet music, no frame | 2000 px + 900 px tall |
| `svr-paint-board-0X-900.webp` / `-520` | Paint-Boards, cut out, transparent | 1800 px + 900 px wide |
| `svr-studio-macbook-1179.webp` / `-700` | studio photo | 1600 px + 800 px wide |
| `svr-exhibition-view-1179.webp` / `-720` | exhibition view | 2400 px + 1200 px wide |

If sizes change, update `width` / `height` / `srcset` / `data-w` / `data-h` in `index.html`.

## To confirm with the artist

- Titles, years, techniques and dimensions of each work (the viewer will show them as soon
  as they are added as `data-title`, `data-medium`, … on each work).
- Copy written from what is visible in the work and his posts: "Faces the street already
  knows", "The music stays under the skin", "Black and white. Raw wood. Old scores.",
  "From the screen to the wood" and its paragraph (inferred from his August 2024 studio
  story), "Exhibition view — 2025".
- An e-mail address for commissions, if he wants one next to Instagram.
