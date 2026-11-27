/* SVR ART — site behaviour (plain script, no dependency)
   Hero reveal, scroll scenes, the bar (progress + current chapter), menu, index preview. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  var header = document.querySelector('[data-header]');
  var progress = document.querySelector('[data-progress]');
  var hero = document.querySelector('[data-hero]');
  var score = document.querySelector('[data-score]');
  var wall = document.querySelector('[data-wall]');
  var wallImg = document.querySelector('[data-wall-img]');
  var decks = Array.prototype.slice.call(document.querySelectorAll('.deck'));
  var drifts = Array.prototype.slice.call(document.querySelectorAll('[data-drift]'));

  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* The name, letter by letter (for the slam) */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-hidden', 'true');
    el.textContent = '';
    text.split('').forEach(function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.style.setProperty('--i', i);
      s.textContent = c;
      el.appendChild(s);
    });
  });
  var h1 = document.getElementById('hero-name');
  if (h1) h1.setAttribute('aria-label', 'SVR ART — painter, France');

  /* ------------------------------------------------------------------
     1. Hero reveal — called by intro.js (inside the screen), or directly
     ------------------------------------------------------------------ */
  var revealed = false;
  function reveal(opts) {
    opts = opts || {};
    if (opts.logoPending) root.classList.add('logo-pending');
    if (revealed) return;
    revealed = true;
    root.style.setProperty('--d0', (opts.delay || 0) + 's');
    requestAnimationFrame(function () { root.classList.add('is-revealed'); });
  }
  function landLogo() { root.classList.remove('logo-pending'); }
  window.SVRSite = { reveal: reveal, landLogo: landLogo };

  /* ------------------------------------------------------------------
     2. Reveals on scroll: text rises, titles get wiped in, works unmask
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('[data-reveal], [data-wipe]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var img = el.matches('.deck, .wall__frame') ? el.querySelector('img') : null;
        var shown = false;
        var show = function () { if (!shown) { shown = true; el.classList.add('is-in'); } };
        if (img && !img.complete) {
          img.loading = 'eager';        // the mask hides the image from the lazy loader: ask for it
          img.addEventListener('load', show, { once: true });
          img.addEventListener('error', show, { once: true });
          setTimeout(show, 2500);
        } else show();
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });

    var ahead = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var img = entry.target.querySelector('img');
        if (img) img.loading = 'eager';
        ahead.unobserve(entry.target);
      });
    }, { rootMargin: '120% 0px 120% 0px' });
    document.querySelectorAll('.deck, .wall__frame').forEach(function (el) { ahead.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------
     3. Current chapter in the bar
     ------------------------------------------------------------------ */
  var navLinks = document.querySelectorAll('[data-nav]');
  function setCurrent(id) {
    navLinks.forEach(function (a) {
      if (a.getAttribute('data-nav') === id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    var sectionIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setCurrent(entry.target.getAttribute('data-section'));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('[data-section]').forEach(function (s) { sectionIo.observe(s); });
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) setCurrent(null);
    }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
  }

  /* ------------------------------------------------------------------
     4. One rAF loop for everything tied to scroll
     ------------------------------------------------------------------ */
  var lastY = window.scrollY;
  var ticking = false;

  function within(r, vh) { return r.bottom > -vh * 0.2 && r.top < vh * 1.2; }

  function update() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight || 1;
    var max = Math.max(1, document.documentElement.scrollHeight - vh);

    header.classList.toggle('is-solid', y > 24);
    if (!root.classList.contains('menu-open')) {
      var past = y > vh * 0.8;
      if (past && y > lastY + 3) header.classList.add('is-hidden');
      else if (y < lastY - 3 || !past) header.classList.remove('is-hidden');
    }
    lastY = y;
    progress.style.setProperty('--prog', clamp(y / max, 0, 1).toFixed(4));

    if (reduceMotion.matches) return;

    hero.style.setProperty('--hp', clamp(y / vh, 0, 1).toFixed(4));

    // Work 01: from the face to the whole painting
    var sr = score.getBoundingClientRect();
    if (within(sr, vh)) {
      var span = sr.height - vh;
      var q = span > 0 ? clamp(-sr.top / span, 0, 1) : 0;
      score.style.setProperty('--q', q.toFixed(4));
      score.style.setProperty('--qe', easeInOut(clamp(q / 0.62, 0, 1)).toFixed(4));
    }

    // The rack: each board slides as it crosses the screen
    decks.forEach(function (d) {
      var r = d.getBoundingClientRect();
      if (!within(r, vh)) return;
      d.style.setProperty('--p', clamp((vh - r.top) / (vh + r.height), 0, 1).toFixed(4));
    });

    // XXL titles drift sideways with the scroll
    drifts.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!within(r, vh)) return;
      var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
      var dir = +(el.getAttribute('data-drift') || 1);
      el.style.setProperty('--dx', ((0.5 - p) * 8 * dir).toFixed(3));
    });

    // Exhibition wall: slow parallax inside its frame
    var wr = wall.getBoundingClientRect();
    if (within(wr, vh)) {
      var wp = clamp((vh - wr.top) / (vh + wr.height), 0, 1);
      wallImg.style.setProperty('--wp', ((wp - 0.5) * -10).toFixed(2) + '%');
    }
  }
  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  update();

  /* ------------------------------------------------------------------
     5. Index: a print of the work follows the cursor (mouse only)
     ------------------------------------------------------------------ */
  var index = document.querySelector('.index');
  var preview = document.querySelector('[data-index-preview]');
  if (index && preview) {
    index.addEventListener('pointermove', function (e) {
      if (!finePointer.matches) return;
      var row = e.target.closest('.index__row');
      if (!row) { index.classList.remove('is-previewing'); return; }
      var src = row.getAttribute('data-preview');
      if (preview.getAttribute('src') !== src) preview.setAttribute('src', src);
      preview.style.setProperty('--px', (e.clientX + 24) + 'px');
      preview.style.setProperty('--py', (e.clientY - 40) + 'px');
      index.classList.add('is-previewing');
    });
    index.addEventListener('pointerleave', function () { index.classList.remove('is-previewing'); });
  }

  /* ------------------------------------------------------------------
     6. Menu (phones, portrait tablets)
     ------------------------------------------------------------------ */
  var toggle = document.querySelector('[data-menu-toggle]');
  var label = document.querySelector('[data-menu-label]');
  var menu = document.querySelector('[data-menu]');
  var inertTargets = [document.getElementById('main'), document.querySelector('.foot')];
  var closeTimer = null;

  function openMenu() {
    clearTimeout(closeTimer);
    menu.hidden = false;
    void menu.offsetWidth;
    menu.classList.add('is-open');
    root.classList.add('menu-open');
    header.classList.remove('is-hidden');
    toggle.setAttribute('aria-expanded', 'true');
    label.textContent = 'Close';
    inertTargets.forEach(function (el) { if (el) el.inert = true; });
    var first = menu.querySelector('a[href]');
    if (first) first.focus({ preventScroll: true });
  }
  function closeMenu(returnFocus) {
    if (menu.hidden) return;
    menu.classList.remove('is-open');
    root.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    label.textContent = 'Menu';
    inertTargets.forEach(function (el) { if (el) el.inert = false; });
    closeTimer = setTimeout(function () { menu.hidden = true; }, reduceMotion.matches ? 0 : 650);
    if (returnFocus) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', function () {
    if (toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
    else openMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key === 'Tab') {
      var items = [document.querySelector('[data-hdr-logo]'), toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a[href]')));
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) closeMenu(false); });

  /* ------------------------------------------------------------------
     7. In-page links: smooth (instant with reduced motion)
     ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    var target = id === '#top' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (root.classList.contains('menu-open')) closeMenu(false);
    var top = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id === '#top' ? window.location.pathname + window.location.search : id);
    if (id !== '#top') {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  /* ------------------------------------------------------------------
     8. Footer
     ------------------------------------------------------------------ */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
  var replay = document.querySelector('[data-replay]');
  if (replay) replay.addEventListener('click', function () {
    try { localStorage.removeItem('svr-intro-seen'); } catch (err) { /* storage unavailable */ }
    window.location.href = window.location.pathname + '?intro=1';
  });
})();
