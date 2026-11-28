# Credits

Except **L’Empreinte — Art Gallery** (a real project for Cynthia Rimo’s gallery in Valbonne), all projects on this site are **self-initiated concepts or personal explorations** by Noah Milsztajn. None of the concepts is presented as commissioned client work.

## L’Empreinte — Art Gallery

The site shown in the case study (`public/lempreinte/index.html`, screenshots in `public/media/works/rimo/`) is the site delivered for Cynthia Rimo, permanent artist at L’Empreinte Art Gallery, Valbonne. **The artworks it displays are by Cynthia Rimo** and remain her property; they appear here only as part of the project. The site loads Archivo and Bodoni Moda from Google Fonts (SIL Open Font License 1.1) when the live preview is opened.

## Original work in the concepts

- **ÉLAN** (fictional energy-drink brand): the can is built procedurally with three.js (no third-party model); label artwork drawn in code. All renders come from the same scene.
- **PORTANT** (fictional clothing shop): the garments are parametric SVG illustrations drawn in code (`tools/garments`), not photographs.

## 3D assets

All from the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) repository. Staging, lighting, materials overrides, renders and interaction are original work for this site.

| Asset | Used in | Author / owner | Licence |
| --- | --- | --- | --- |
| Materials Variants Shoe | The Object (live 3D), Stride | © 2021 Shopify | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Car Concept | Vanta | © 2024 Darmstadt Graphics Group GmbH, Eric Chadwick | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

Changes made: textures recompressed to WebP and resized, geometry quantised (meshopt); third-party logos removed from renders (car licence plate, wheel emblem and printed tyre sidewalls hidden or replaced).

## Fonts (self-hosted via Fontsource, SIL Open Font License 1.1)

- Space Grotesk: Florian Karsten
- Inter: Rasmus Andersson

These are the only two typefaces of the portfolio and of the two concept sites. (Archivo, Instrument Serif, Inter Tight and Geist Mono remain as development dependencies, used only by the offline tools that produced older concept visuals.)

## Libraries (MIT)

three.js · GSAP (standard “no-charge” licence) · Lenis · Vite
