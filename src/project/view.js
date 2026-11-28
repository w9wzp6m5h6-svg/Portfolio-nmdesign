/**
 * Project case study overlay.
 *  - routes: #/work/<slug> (deep-linkable, back button closes)
 *  - open: the visual that was clicked grows into the fullscreen hero (shared-element transition).
 *    Any link with data-project="slug" opens a case study; its closest [data-project-card]
 *    holds the visual ([data-project-media]) used for the transition (hero screens, scenes, cards).
 *  - close: curtain wipe back to the grid, focus returns to the card
 *  - next: content wipes up, the next project's hero rises in
 */
import Lenis from 'lenis';
import { gsap, ScrollTrigger, lockScroll, unlockScroll, scrollToTarget } from '../core/scroll.js';
import { pageHref } from '../core/asset.js';
import { env } from '../core/env.js';
import { projects } from '../data/projects.js';
import { renderProject } from './blocks.js';
import { applyCss } from '../core/css.js';
import { splitLines } from '../core/split.js';

const ROUTE = /^#\/work\/([\w-]+)$/;

export function initProjectView() {
  const root = document.querySelector('.project');
  const scroller = root.querySelector('.project__scroller');
  const content = root.querySelector('.project__content');
  const clone = root.querySelector('.project__media-clone');
  const barIndex = root.querySelector('.project__bar-index');
  const closeBtn = root.querySelector('.project__close');
  const progress = root.querySelector('.project__progress i');
  const behind = [document.querySelector('main'), document.querySelector('.header'), document.querySelector('.footer')];

  let current = null;
  let lenis = null;
  let triggers = [];
  let lives = [];
  let busy = false;
  let pushedState = false;
  let returnFocus = null;

  /* ---------- helpers ---------- */

  const bySlug = (slug) => projects.find((p) => p.slug === slug);
  const nextOf = (p) => projects[(projects.indexOf(p) + 1) % projects.length];

  function applyTheme(p) {
    const t = p.theme;
    root.style.setProperty('--p-bg', t.bg);
    root.style.setProperty('--p-fg', t.fg);
    root.style.setProperty('--p-muted', t.muted);
    root.style.setProperty('--p-line', t.line);
    root.style.setProperty('--p-accent', t.accent);
    root.dataset.title = t.title;
    root.classList.toggle('is-light', !!t.light);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
  }

  function teardown() {
    triggers.forEach((t) => t.kill());
    triggers = [];
    lives.forEach((l) => l.destroy());
    lives = [];
    lenis?.destroy();
    lenis = null;
  }

  async function mountLive(block) {
    const kind = block.dataset.live;
    const mod = kind === 'afterimage'
      ? (await import('./live/afterimage.js')).mountAfterimage
      : (await import('./live/oscillo.js')).mountOscillo;
    if (!block.isConnected) return;
    const live = mod(block);
    lives.push(live);
    triggers.push(ScrollTrigger.create({
      trigger: block, scroller, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (self.isActive ? live.start() : live.stop()),
    }));
    if (ScrollTrigger.isInViewport(block, 0, false)) live.start();
  }

  function render(p) {
    teardown();
    current = p;
    applyTheme(p);
    content.innerHTML = renderProject(p, nextOf(p));
    applyCss(content);
    barIndex.textContent = `${p.num} / ${String(projects.length).padStart(2, '0')} — ${p.title}`;
    scroller.scrollTop = 0;

    if (!env.reducedMotion) {
      lenis = new Lenis({ wrapper: scroller, content, duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
      const raf = (time) => lenis?.raf(time * 1000);
      gsap.ticker.add(raf);
      const destroy = lenis.destroy.bind(lenis);
      lenis.destroy = () => { gsap.ticker.remove(raf); destroy(); };
    }

    // scroll-linked details inside the overlay
    scroller.onscroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      progress.style.transform = `scaleX(${max > 0 ? scroller.scrollTop / max : 0})`;
    };
    scroller.onscroll();

    if (!env.reducedMotion) {
      content.querySelectorAll('[data-parallax] img').forEach((img) => {
        triggers.push(gsap.fromTo(img, { yPercent: -4 }, {
          yPercent: 4, ease: 'none',
          scrollTrigger: { trigger: img.parentElement, scroller, start: 'top bottom', end: 'bottom top', scrub: true },
        }).scrollTrigger);
      });
      const heroImg = content.querySelector('[data-hero-media] img');
      if (heroImg) triggers.push(gsap.to(heroImg, {
        yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: heroImg.closest('.p-hero'), scroller, start: 'top top', end: 'bottom top', scrub: true },
      }).scrollTrigger);
      content.querySelectorAll('.p-body [data-split]').forEach((el) => {
        const { lines } = splitLines(el);
        gsap.set(lines, { yPercent: 105 });
        triggers.push(ScrollTrigger.create({ trigger: el, scroller, start: 'top 88%', once: true,
          onEnter: () => gsap.to(lines, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }) }));
      });
      content.querySelectorAll('[data-reveal]').forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 28 });
        triggers.push(ScrollTrigger.create({ trigger: el, scroller, start: 'top 92%', once: true,
          onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out' }) }));
      });
    }

    content.querySelectorAll('[data-live]').forEach((b) => mountLive(b));
  }

  /** Title arrival — lines rise out of their masks. */
  function heroIn(delay = 0) {
    const title = content.querySelector('[data-hero-title]');
    const fades = content.querySelectorAll('[data-hero-fade]');
    if (env.reducedMotion) return gsap.timeline();
    const { lines } = splitLines(title);
    return gsap.timeline({ delay })
      .fromTo(lines, { yPercent: 105 }, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.08 })
      .fromTo(fades, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.06 }, 0.2);
  }

  function setBehindInert(on) {
    behind.forEach((el) => { if (el) el.inert = on; });
  }

  /* ---------- open / close ---------- */

  async function open(slug, { card = null, instant = false } = {}) {
    const p = bySlug(slug);
    if (!p || busy) return;
    if (current && root.classList.contains('is-open')) { goNext(p); return; }
    busy = true;
    returnFocus = card?.querySelector('a[data-project]') || document.activeElement;
    lockScroll('project');
    render(p);
    root.inert = false;
    root.classList.add('is-open');
    setBehindInert(true);

    const media = card?.querySelector('[data-project-media]');
    const fromImg = media?.querySelector('img');
    const d = env.reducedMotion || instant ? 0 : 1;

    if (media && fromImg && d) {
      // shared-element transition: the card image grows into the fullscreen hero
      const r = media.getBoundingClientRect();
      const img = document.createElement('img');
      img.src = fromImg.currentSrc || fromImg.src;
      img.alt = '';
      img.style.objectPosition = getComputedStyle(fromImg).objectPosition;
      clone.replaceChildren(img);
      card.classList.add('is-opening');
      gsap.set(scroller, { autoAlpha: 0 });
      gsap.set(clone, { visibility: 'visible', top: r.top, left: r.left, width: r.width, height: r.height, borderRadius: 2 });
      await gsap.timeline()
        .to(clone, { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight, borderRadius: 0, duration: 1.15, ease: 'expo.inOut' })
        .set(scroller, { autoAlpha: 1 })
        .to(clone, { autoAlpha: 0, duration: p.hero || p.heroPlain ? 0.6 : 0.01, ease: 'power2.out' })
        .add(heroIn(), '-=0.6')
        .then();
      gsap.set(clone, { clearProps: 'all' });
      clone.innerHTML = '';
      card.classList.remove('is-opening');
    } else {
      gsap.fromTo(scroller, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1 * d, ease: 'expo.inOut', clearProps: 'clipPath' });
      heroIn(0.5 * d);
    }
    // opacity only: a visibility:hidden bar would make the close button unfocusable
    gsap.fromTo(root.querySelector('.project__bar'), { opacity: 0 }, { opacity: 1, duration: 0.6 });
    closeBtn.focus({ preventScroll: true });
    busy = false;
  }

  async function close({ fromHistory = false } = {}) {
    if (!current || busy) return;
    busy = true;
    const d = env.reducedMotion ? 0 : 1;
    lives.forEach((l) => l.stop());
    await gsap.timeline()
      .to(root.querySelector('.project__bar'), { opacity: 0, duration: 0.3 * d })
      .to(scroller, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1 * d, ease: 'expo.inOut' }, 0)
      .then();
    root.classList.remove('is-open');
    root.inert = true;
    gsap.set(scroller, { clearProps: 'clipPath' });
    teardown();
    content.innerHTML = '';
    current = null;
    setBehindInert(false);
    unlockScroll('project');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f3f2ee');
    if (!fromHistory) {
      if (pushedState) history.back();
      else history.replaceState(null, '', location.pathname + '#work');
    }
    pushedState = false;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    busy = false;
  }

  async function goNext(p) {
    if (busy) return;
    busy = true;
    const d = env.reducedMotion ? 0 : 1;
    lives.forEach((l) => l.stop());
    await gsap.to(content, { yPercent: -8, autoAlpha: 0, duration: 0.7 * d, ease: 'power3.in' }).then();
    render(p);
    history.replaceState({ project: p.slug }, '', `#/work/${p.slug}`);
    gsap.set(content, { yPercent: 0, autoAlpha: 1 });
    const hero = content.querySelector('.p-hero');
    gsap.fromTo(hero, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2 * d, ease: 'expo.inOut', clearProps: 'clipPath' });
    const heroImg = hero.querySelector('img');
    if (heroImg) gsap.fromTo(heroImg, { scale: 1.2 }, { scale: 1, duration: 1.8 * d, ease: 'expo.out' });
    heroIn(0.5 * d);
    closeBtn.focus({ preventScroll: true });
    busy = false;
  }

  /* ---------- events ---------- */

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-project]');
    if (link && !root.contains(link)) {
      e.preventDefault();
      const slug = link.dataset.project;
      history.pushState({ project: slug }, '', `#/work/${slug}`);
      pushedState = true;
      open(slug, { card: link.closest('[data-project-card]') || link });
      return;
    }
    const next = e.target.closest('[data-next]');
    if (next && root.contains(next)) {
      e.preventDefault();
      goNext(bySlug(next.dataset.next));
      return;
    }
    const goto = e.target.closest('[data-goto-object]');
    if (goto && root.contains(goto)) {
      e.preventDefault();
      const lab = document.getElementById('object');
      if (lab) close().then(() => setTimeout(() => scrollToTarget(lab), 50));
      else location.href = `${pageHref('projects') || 'projets/'}#object`;
    }
  });

  closeBtn.addEventListener('click', () => close());

  window.addEventListener('popstate', () => {
    const m = location.hash.match(ROUTE);
    if (m && !current) open(m[1], { card: document.querySelector(`a[data-project="${m[1]}"]`)?.closest('[data-project-card]') });
    else if (!m && current) { pushedState = false; close({ fromHistory: true }); }
    else if (m && current && current.slug !== m[1]) goNext(bySlug(m[1]));
  });

  root.addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = [...root.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null || el === closeBtn);
    if (!f.length) return;
    const first = f[0]; const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  window.addEventListener('resize', () => { if (current) ScrollTrigger.refresh(); });

  return {
    /** Opens the project named in the URL, if any (called once the intro is done). */
    openFromURL() {
      const m = location.hash.match(ROUTE);
      if (m && bySlug(m[1])) open(m[1], { instant: false });
    },
  };
}
