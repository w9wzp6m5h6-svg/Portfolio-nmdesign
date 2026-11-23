/**
 * Case-study block renderers. Each project composes these differently,
 * so the same system produces six distinct layouts.
 */
const USES_3D_ASSETS = ['stride', 'vanta', 'opale', 'rooms'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function figure(img, { cls = '', sizes = '100vw', eager = false } = {}) {
  return `<figure class="p-figure ${cls}" style="aspect-ratio:${img.ratio}" data-parallax>
    <img src="${img.src}" srcset="${img.srcset}" sizes="${sizes}" alt="${esc(img.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />
  </figure>`;
}

const caption = (text) => (text ? `<figcaption class="p-caption mono" data-reveal>${esc(text)}</figcaption>` : '');

const renderers = {
  text: (b) => `
    <section class="p-block p-grid p-text">
      <p class="p-text__kicker mono" data-reveal>${esc(b.kicker)}</p>
      <h3 class="p-text__title" data-split>${esc(b.title)}</h3>
      <p class="p-text__body" data-reveal>${esc(b.body)}</p>
    </section>`,

  statement: (b) => `
    <section class="p-block"><p class="p-statement" data-split>${esc(b.text)}</p></section>`,

  image: (b) => {
    const cls = { full: 'p-figure--full', inset: 'p-figure--inset', wide: 'p-figure--wide' }[b.size] || '';
    const fig = figure(b.src, { cls, sizes: b.size === 'inset' ? '(max-width: 1100px) 100vw, 1100px' : '100vw' });
    return b.size === 'wide'
      ? `<section class="p-block p-grid">${fig}</section>`
      : `<section class="p-block">${fig}${caption(b.caption)}</section>`;
  },

  pair: (b) => `
    <section class="p-block">
      <div class="p-grid p-pair ${b.flip ? 'is-flip' : ''}">
        ${b.items.map((img) => figure(img, { sizes: '(max-width: 900px) 100vw, 50vw' })).join('')}
      </div>
      ${b.caption ? `<div class="p-grid"><p class="p-pair__caption p-caption mono" data-reveal>${esc(b.caption)}</p></div>` : ''}
    </section>`,

  gallery: (b) => `
    <section class="p-block">
      <div class="p-grid p-gallery">${b.items.map((img) => figure(img, { sizes: '(max-width: 900px) 50vw, 33vw' })).join('')}</div>
      ${caption(b.caption)}
    </section>`,

  chapters: (b) => `
    <section class="p-block p-grid p-chapters">
      <h3 class="p-chapters__title" data-split>${esc(b.title)}</h3>
      <ol class="p-chapters__list">
        ${b.items.map(([t, d]) => `<li data-reveal><h4>${esc(t)}</h4><p>${esc(d)}</p></li>`).join('')}
      </ol>
    </section>`,

  palette: (b) => `
    <section class="p-block">
      <p class="mono p-caption" data-reveal style="margin-bottom:18px">Palette</p>
      <div class="p-grid p-palette">
        ${b.colors.map(([n, hex]) => {
          const light = parseInt(hex.slice(1, 3), 16) * 0.299 + parseInt(hex.slice(3, 5), 16) * 0.587 + parseInt(hex.slice(5, 7), 16) * 0.114 > 150;
          return `<div class="p-swatch mono" data-reveal style="background:${hex};color:${light ? '#111' : '#f3f1ea'}"><span>${esc(n)}</span><span>${hex.toUpperCase()}</span></div>`;
        }).join('')}
      </div>
    </section>`,

  type: (b) => `
    <section class="p-block">
      <p class="mono p-caption" data-reveal style="margin-bottom:18px">Typographie</p>
      <div class="p-grid p-type">
        ${b.families.map(([name, role, glyph]) => `
          <div class="p-type__item" data-reveal>
            <p class="mono">${esc(name)}</p>
            <div class="p-type__glyph" style="font-family:'${name}', '${name} Variable', serif;${name.includes('Serif') ? 'font-style:italic' : ''}">${esc(glyph)}</div>
            <p>${esc(role)}</p>
          </div>`).join('')}
      </div>
    </section>`,

  screens: (b) => `
    <section class="p-block">
      <div class="p-screens">
        <div class="p-browser" data-reveal>
          <div class="p-browser__bar" aria-hidden="true"><i></i><i></i><i></i></div>
          ${figure(b.desktop, { sizes: '(max-width: 900px) 100vw, 80vw' })}
        </div>
        <div class="p-phone" data-reveal>${figure(b.mobile, { sizes: '(max-width: 900px) 46vw, 22vw' })}</div>
      </div>
      ${caption(b.caption)}
    </section>`,

  /** Fonctionnalités : statut affiché seulement quand il est renseigné (livré, intégré, prévu, prototype) */
  intentions: (b) => `
    <section class="p-block p-grid p-intentions">
      <h3 class="p-intentions__title" data-split>${esc(b.title)}</h3>
      <ol class="p-intentions__list">
        ${b.items.map(([t, d, status], i) => `
          <li data-reveal>
            <span class="p-intentions__n mono">${String(i + 1).padStart(2, '0')}</span>
            <div><h4>${esc(t)}</h4><p>${esc(d)}</p></div>
            ${status ? `<span class="p-intentions__s mono">${esc(status)}</span>` : ''}
          </li>`).join('')}
      </ol>
    </section>`,

  /** Captures du site réel : rien n'est affiché tant qu'aucune capture n'est fournie */
  captures: (b) => (b.items?.length
    ? `<section class="p-block"><div class="p-grid p-gallery">${b.items.map((im) => figure(im, { sizes: '(max-width: 900px) 100vw, 33vw' })).join('')}</div>${caption(b.caption)}</section>`
    : ''),

  live: (b) => b.module === 'object'
    ? `<section class="p-block">
        <div class="p-live__link" data-reveal>
          <div><h3 class="p-live__title">${esc(b.title)}</h3><p class="p-live__text">${esc(b.text)}</p></div>
          <a class="btn" href="#object" data-goto-object>Ouvrir la scène 3D<span class="btn__arrow" aria-hidden="true">→</span></a>
        </div>
      </section>`
    : `<section class="p-block p-live" data-live="${b.module}">
        <div class="p-live__head" data-reveal>
          <div><h3 class="p-live__title">${esc(b.title)}</h3><p class="p-live__text">${esc(b.text)}</p></div>
        </div>
        <div class="p-live__stage" data-cursor="${b.module === 'afterimage' ? 'Bougez pour perturber' : 'Générateur en direct'}"><canvas aria-hidden="true"></canvas></div>
        <div class="p-live__controls" data-live-controls></div>
      </section>`,
};

export function renderProject(p, next) {
  const hero = p.hero || p.cover;
  return `
    <article class="p-article">
      <header class="p-hero">
        ${p.heroPlain ? '<div class="p-hero__wall" aria-hidden="true"></div>' : `<div class="p-hero__media">${figure(hero, { eager: true }).replace('data-parallax', 'data-hero-media').replace(/style="aspect-ratio:[^"]+"/, 'style="position:absolute;inset:0"')}</div>`}
        <div class="p-hero__content">
          <p class="p-hero__num mono" data-hero-fade>${p.real ? '<span class="p-badge">Projet réel</span>' : ''}${p.num} — ${esc(p.category)}</p>
          <h2 class="p-hero__title p-title" id="project-title" data-style="${p.theme.title}" data-hero-title>${esc(p.title)}</h2>
          <p class="p-hero__sub" data-hero-fade>${esc(p.subtitle)}</p>
        </div>
      </header>
      <div class="p-body">
        <section class="p-grid p-intro">
          <dl class="p-intro__meta" data-reveal>
            ${p.meta.map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
            <div><dt class="mono">Statut</dt><dd>${esc(p.status)}</dd></div>
          </dl>
          <p class="p-intro__lead" data-split>${esc(p.lead)}</p>
        </section>
        ${p.blocks.map((b) => renderers[b.type]?.(b) ?? '').join('')}
      </div>
      <footer class="p-next">
        <a class="p-next__link" href="#/work/${next.slug}" data-next="${next.slug}" data-cursor="Projet suivant">
          <span class="p-next__k mono">Projet suivant — ${next.num}</span>
          <span class="p-next__title">${esc(next.title)}</span>
          <span class="p-next__thumb"><img src="${next.cover.src.replace(/-\d+\.webp$/, '-800.webp')}" alt="" loading="lazy" decoding="async" /></span>
        </a>
        <p class="p-next__credits mono">${p.real ? 'Projet réel, réalisé pour la galerie Cynthia Rimo à Valbonne.' : `${esc(p.status)}. Concept personnel de Noah Milsztajn, pas une commande client.`}${USES_3D_ASSETS.includes(p.slug) ? ' Modèles 3D : Khronos glTF Sample Assets (licences en pied de page).' : ''}</p>
      </footer>
    </article>`;
}
