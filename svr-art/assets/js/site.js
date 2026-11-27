/* SVR ART — site behaviour (plain script, no dependency)
   Hero reveal, scroll scenes, header, active section, menu, in-page links. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  var header = document.querySelector('[data-header]');
  var hero = document.querySelector('[data-hero]');
  var score = document.querySelector('[data-score]');
  var wall = document.querySelector('[data-wall]');
  var wallImg = document.querySelector('[data-wall-img]');

  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ------------------------------------------------------------------
     1. Hero reveal — called by intro.js (inside the screen, or after the
        short entrance), or directly when there is no intro.
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
     2. Scroll reveals (one observer for the whole page)
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        // a work is unveiled only once its image can be painted
        var img = el.matches('.piece, .wall__frame') ? el.querySelector('img') : null;
        var shown = false;
        var show = function () { if (!shown) { shown = true; el.classList.add('is-in'); } };
        if (img && !img.complete) {
          // the mask hides the image from the browser's lazy loader: ask for it explicitly
          img.loading = 'eager';
          img.addEventListener('load', show, { once: true });
          img.addEventListener('error', show, { once: true });
          setTimeout(show, 2500);
        } else show();
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    // start fetching masked works a screen ahead, so they are ready when unveiled
    var ahead = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var img = entry.target.querySelector('img');
        if (img) img.loading = 'eager';
        ahead.unobserve(entry.target);
      });
    }, { rootMargin: '120% 0px 120% 0px' });
    document.querySelectorAll('.piece[data-reveal], .wall__frame[data-reveal]').forEach(function (el) { ahead.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------
     3. Active section in the navigation
     ------------------------------------------------------------------ */
  var navLinks = document.querySelectorAll('[data-nav]');
  var sections = document.querySelectorAll('[data-section]');
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
    sections.forEach(function (s) { sectionIo.observe(s); });
    var heroIo = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) setCurrent(null);
    }, { rootMargin: '-45% 0px -50% 0px' });
    heroIo.observe(hero);
  }

  /* ------------------------------------------------------------------
     4. One rAF loop for everything tied to scroll or pointer
     ------------------------------------------------------------------ */
  var lastY = window.scrollY;
  var pointer = { tx: 0, ty: 0, x: 0, y: 0 };
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight || 1;

    // Header: clear on the cover, solid afterwards; hides going down, returns going up.
    var pastHero = y > vh * 0.8;
    header.classList.toggle('is-solid', y > 24);
    if (!root.classList.contains('menu-open')) {
      if (pastHero && y > lastY + 3) header.classList.add('is-hidden');
      else if (y < lastY - 3 || !pastHero) header.classList.remove('is-hidden');
    }
    lastY = y;

    if (reduceMotion.matches) return;

    // Cover: the two works drift apart as the page moves on.
    hero.style.setProperty('--hp', clamp(y / vh, 0, 1).toFixed(4));
    pointer.x += (pointer.tx - pointer.x) * 0.07;
    pointer.y += (pointer.ty - pointer.y) * 0.07;
    hero.style.setProperty('--mx', pointer.x.toFixed(4));
    hero.style.setProperty('--my', pointer.y.toFixed(4));

    // Work 01: from the face to the whole painting.
    var sr = score.getBoundingClientRect();
    var span = sr.height - vh;
    var q = span > 0 ? clamp(-sr.top / span, 0, 1) : 0;
    score.style.setProperty('--q', q.toFixed(4));
    score.style.setProperty('--qe', easeInOut(clamp(q / 0.62, 0, 1)).toFixed(4));

    // Exhibition wall: slow parallax inside its frame.
    var wr = wall.getBoundingClientRect();
    if (wr.bottom > 0 && wr.top < vh) {
      var wp = clamp((vh - wr.top) / (vh + wr.height), 0, 1);
      wallImg.style.setProperty('--wp', ((wp - 0.5) * -10).toFixed(2) + '%');
    }

    if (Math.abs(pointer.tx - pointer.x) > 0.001 || Math.abs(pointer.ty - pointer.y) > 0.001) requestTick();
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });
  hero.addEventListener('pointermove', function (e) {
    if (!finePointer.matches || reduceMotion.matches) return;
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    requestTick();
  });
  hero.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; requestTick(); });
  update();

  /* ------------------------------------------------------------------
     5. Menu (phones, tablet portrait)
     ------------------------------------------------------------------ */
  var toggle = document.querySelector('[data-menu-toggle]');
  var label = document.querySelector('[data-menu-label]');
  var menu = document.querySelector('[data-menu]');
  var inertTargets = [document.getElementById('main'), document.querySelector('.site-footer')];
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
    closeTimer = setTimeout(function () { menu.hidden = true; }, reduceMotion.matches ? 0 : 900);
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
     6. In-page links: smooth (instant with reduced motion), menu closes first
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
     7. Footer
     ------------------------------------------------------------------ */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
  var replay = document.querySelector('[data-replay]');
  if (replay) replay.addEventListener('click', function () {
    try { localStorage.removeItem('svr-intro-seen'); } catch (err) { /* storage unavailable */ }
    window.location.href = window.location.pathname + '?intro=1';
  });
})();
