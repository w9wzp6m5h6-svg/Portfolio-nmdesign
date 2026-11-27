# SVR ART — street / underground, executed clean

Concept for a client presentation: the website of SVR, painter, 20, France.
A new-generation artist: the site borrows from clips, record sleeves, concert posters and
streetwear labels — and only ever shows his own images.

Static site — plain HTML / CSS / JS, no dependency, no build step.

## Run it locally

```bash
npm install && npm run svr                   # from the repository root → http://localhost:5174
# or, without Node:
cd svr-art && python3 -m http.server 4173    # → http://localhost:4173
```

Review parameters: `?intro=1` full intro · `?intro=short` · `?intro=0` none ·
`?intro=1&t=2.2` freeze the intro on a given second.

## Direction

- **Palette** — coal `#0B0B0B`, concrete `#2B2B29` / `#8C8B86`, paper `#ECEBE6`,
  and one accent, signal red `#FF3B1D`, used only for what is live or chosen:
  REC, the current chapter, the progress of the page, hovers, cuts, the title wipes.
- **Type** — Archivo (variable, condensed to 62 % and heavy) for XXL titles that take the
  room; Geist Mono for the interface voice (timecodes, labels, care tags); Bodoni Moda
  italic — the family of his logo — for the few soft lines.
- **Texture** — analog grain on the page, video noise and scan lines on the clip only,
  a worn-ink mask on XXL titles (like a photocopied poster). Never on the works.
- **Details** — crop marks around the clip, care-label tags for each work, a tracklist
  index, a log with dated facts only.

## The experience

1. **Intro — the Mac is the portal** (`assets/js/intro.js`, 3.9 s desktop, 3.5 s phones):
   letterbox, REC and timecode; the closed laptop, one push-in, the lid opens with weight;
   the screen wakes on his original logo; the clip is already playing *inside* the screen
   while the logo goes to the bar; the screen becomes the window, the bars open, a short flash.
   Returning visitors (7 days) or Save-Data: a 1-second signature. Reduced motion: none.
   Skip at any time (button, `Esc`, `Space`, `Enter`, ↓, wheel, swipe).
2. **Hero** — the clip (16:9 on wide screens, a recomposed 9:16 on phones), the name XXL,
   one line. Click / tap the clip to *cut* to the next shot; a Pause / Play button is
   always there (it is the default state with reduced motion or Save-Data).
3. **01 Works** — the painting on sheet music pulls back from the face to the whole work
   (pinned), its series name huge behind it; the Paint-Boards slide in on a rack as you
   scroll; the index works like the back of a record sleeve (hover: red row + print).
   Every work opens in the viewer (`assets/js/viewer.js`): prev / next, arrows, swipe, Esc.
4. **02 Studio** — his own photo of the designs on his MacBook, the finished board, the
   exhibition wall, and a log of dated facts.
5. **03 Booking** — commissions, exhibitions, collabs → Instagram DM (the only contact known).

The bar is a playback bar for the page: logo, three chapters (the current one is marked in
red), Instagram, and a red progress line.

## The clip (`assets/video/`)

Ten seconds cut from his own images only — the painting, the four boards, the studio
photo, the exhibition view. Hard cuts on a ~100 BPM grid, slow pushes and pans, a
contrasted grade, one flash and one glitch per loop. Built by `tools/render-clip.py`
(Pillow + numpy + ffmpeg); re-run it when HD originals arrive:

```bash
python3 svr-art/tools/render-clip.py
```

| File | Size |
| --- | --- |
| `svr-clip-wide.webm` / `.mp4` (960×540) | ~1.0 / 1.5 MB |
| `svr-clip-tall.webm` / `.mp4` (540×960) | ~1.0 / 1.4 MB |
| posters `.webp` | ~50 kB |

Only the cut that fits the screen is loaded; it pauses when it leaves the screen or the tab.

## Structure

```
svr-art/
├── index.html
├── assets/css/style.css   tokens, intro, bar, hero, chapters, viewer — in page order
├── assets/js/site.js      reveals, scroll scenes, bar, menu, index print
├── assets/js/clip.js      the hero clip: cut, timecode, shot, pause, visibility
├── assets/js/intro.js     intro timeline (a pure function of time) + entrances
├── assets/js/viewer.js    the work viewer (native <dialog>)
├── assets/fonts/          Archivo (variable), Geist Mono, Bodoni Moda italic — OFL
├── assets/img/            logo, works, studio photo, ink texture
├── assets/video/          the clip (wide + tall), posters, shot list
└── tools/render-clip.py   rebuilds the clip from the images
```

## To get from the artist

- HD originals of the works and photos (same file names), the logo as a vector file,
  and — if there are any — real videos of him at work: they would replace the cut-up clip.
- Titles, years, techniques, dimensions of each work (the viewer shows them as soon as
  they are added as `data-*` on each work).
- More dated events for the log, and an e-mail for booking if he wants one.
- Copy to confirm: "Faces the street already knows", the board descriptions,
  "From the screen to the wood" and its paragraph (inferred from his August 2024 story),
  the 2025.12 exhibition date (from his December 2025 story).
