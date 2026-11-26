/* SVR ART — site behaviour (plain script, no dependency)
   Hero reveal + hand-off from the intro, scroll-driven scenes, header, menu. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var wideQuery = window.matchMedia('(min-width: 900px) and (min-aspect-ratio: 1/1)');

  var header = document.querySelector('[data-header]');
  var hero = document.querySelector('[data-hero]');
  var mast = document.querySelector('[data-hero-mast]');
  var mastImg = mast.querySelector('img');
  var score = document.querySelector('[data-score]');
  var boards = document.querySelector('[data-boards]');
  var track = document.querySelector('[data-boards-track]');
  var wallImg = document.querySelector('[data-wall-img]');
  var wall = document.querySelector('[data-wall]');

  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ------------------------------------------------------------------
     1. Hero reveal. Called by intro.js, or directly when there is no intro.
        With a hand-off, the logo letters fly from the screen to the masthead.
     ------------------------------------------------------------------ */
  var revealed = false;

  function reveal(handoff) {
    if (revealed) return;
    revealed = true;

    if (!handoff || reduceMotion.matches) {
      root.style.setProperty('--d0', handoff ? '0.2s' : '0.15s');
      if (handoff) fadeOutHandoff(handoff, 0);
      requestAnimationFrame(function () { root.classList.add('is-revealed'); });
      return;
    }

    root.classList.add('is-flight');
    root.style.setProperty('--d0', '0.55s');
    requestAnimationFrame(function () { root.classList.add('is-revealed'); });

    var letters = handoff.letters;
    var from = letters.getBoundingClientRect();
    var to = mastImg.getBoundingClientRect();

    // Lay the letters out at their final size, then play the inverse transform.
    letters.style.left = to.left + 'px';
    letters.style.top = to.top + 'px';
    letters.style.width = to.width + 'px';
    letters.style.height = to.height + 'px';
    var start = 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + (from.width / to.width) + ')';

    var flight = letters.animate(
      [{ transform: start }, { transform: 'none' }],
      { duration: 1500, delay: 260, easing: 'cubic-bezier(0.77, 0, 0.18, 1)', fill: 'both' }
    );
    handoff.oval.animate(
      [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.06)' }],
      { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
    );
    fadeOutHandoff(handoff, 380);

    flight.onfinish = function () {
      root.classList.add('mast-landed');
      requestAnimationFrame(function () {
        if (handoff.el.parentNode) handoff.el.parentNode.removeChild(handoff.el);
      });
    };
  }

  function fadeOutHandoff(handoff, delay) {
    var anim = handoff.bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: delay, easing: 'ease', fill: 'forwards' });
    if (delay === 0) {
      handoff.oval.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
      handoff.letters.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
      anim.onfinish = function () { if (handoff.el.parentNode) handoff.el.parentNode.removeChild(handoff.el); };
    }
  }

  window.SVRSite = { reveal: reveal };

  /* ------------------------------------------------------------------
     2. Scroll reveals
     ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------
     3. Paint-Boards: pin + horizontal track on wide screens
     ------------------------------------------------------------------ */
  var trackDistance = 0;

  function layoutBoards() {
    var pin = wideQuery.matches && !reduceMotion.matches;
    boards.classList.toggle('is-pinned', pin);
    if (!pin) {
      boards.style.height = '';
      trackDistance = 0;
      return;
    }
    trackDistance = Math.max(0, track.scrollWidth - window.innerWidth);
    boards.style.height = (window.innerHeight + trackDistance) + 'px';
  }

  /* ------------------------------------------------------------------
     4. One rAF loop for everything tied to scroll / pointer
     ------------------------------------------------------------------ */
  var lastY = window.scrollY;
  var pointer = { tx: 0, ty: 0, x: 0, y: 0 };
  var ticking = false;

  function sectionProgress(el) {
    var r = el.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }

  function update() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight || 1;

    // Header
    var pastHero = y > vh * 0.75;
    header.classList.toggle('is-solid', pastHero);
    header.classList.toggle('show-logo', y > vh * 0.5);
    if (!root.classList.contains('menu-open')) {
      if (pastHero && y > lastY + 2) header.classList.add('is-hidden');
      else if (y < lastY - 2 || !pastHero) header.classList.remove('is-hidden');
    }
    lastY = y;

    if (reduceMotion.matches) return;

    // Hero: the boards slide apart, the masthead rises
    var hp = clamp(y / vh, 0, 1);
    hero.style.setProperty('--hp', hp.toFixed(4));

    pointer.x += (pointer.tx - pointer.x) * 0.075;
    pointer.y += (pointer.ty - pointer.y) * 0.075;
    hero.style.setProperty('--mx', pointer.x.toFixed(4));
    hero.style.setProperty('--my', pointer.y.toFixed(4));

    // Sheet music: close-up → whole painting
    var q = sectionProgress(score);
    score.style.setProperty('--q', q.toFixed(4));
    score.style.setProperty('--qe', easeInOut(clamp(q / 0.7, 0, 1)).toFixed(4));

    // Paint-Boards: vertical scroll → horizontal travel
    if (trackDistance) {
      var b = sectionProgress(boards);
      track.style.setProperty('--bx', (b * trackDistance).toFixed(1));
    }

    // Exhibition wall: slow parallax inside its frame
    var wr = wall.getBoundingClientRect();
    if (wr.bottom > 0 && wr.top < vh) {
      var wp = clamp((vh - wr.top) / (vh + wr.height), 0, 1);
      wallImg.style.setProperty('--wp', ((wp - 0.5) * -12).toFixed(2) + '%');
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
  window.addEventListener('resize', function () { layoutBoards(); requestTick(); }, { passive: true });

  hero.addEventListener('pointermove', function (e) {
    if (!finePointer.matches || reduceMotion.matches) return;
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    requestTick();
  });
  hero.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; requestTick(); });

  /* Board tilt + light on hover */
  document.querySelectorAll('[data-board]').forEach(function (board) {
    var obj = board.querySelector('[data-tilt]');
    board.addEventListener('pointermove', function (e) {
      if (!finePointer.matches || reduceMotion.matches) return;
      var r = obj.getBoundingClientRect();
      var px = clamp((e.clientX - r.left) / r.width, 0, 1);
      var py = clamp((e.clientY - r.top) / r.height, 0, 1);
      board.classList.add('is-hover');
      obj.style.setProperty('--ry', ((px - 0.5) * 9).toFixed(2) + 'deg');
      obj.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
      obj.style.setProperty('--sx', (px * 100).toFixed(1) + '%');
      obj.style.setProperty('--sy', (py * 100).toFixed(1) + '%');
    });
    board.addEventListener('pointerleave', function () {
      board.classList.remove('is-hover');
      obj.style.setProperty('--rx', '0deg');
      obj.style.setProperty('--ry', '0deg');
    });
  });

  layoutBoards();
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutBoards(); requestTick(); });
  window.addEventListener('load', function () { layoutBoards(); requestTick(); });

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
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]')) closeMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (toggle.getAttribute('aria-expanded') !== 'true') return;
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key === 'Tab') {
      var items = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a[href]')));
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var onWide = function () { if (window.matchMedia('(min-width: 900px)').matches) closeMenu(false); };
  window.matchMedia('(min-width: 900px)').addEventListener('change', onWide);

  /* In-page links: smooth, except for reduced motion */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    var target = id.length > 1 ? document.querySelector(id) : null;
    if (!target) return;
    e.preventDefault();
    var top = id === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* Footer */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
  var replay = document.querySelector('[data-replay]');
  if (replay) replay.addEventListener('click', function () {
    try { sessionStorage.removeItem('svr-intro-seen'); } catch (err) { /* storage unavailable */ }
    window.scrollTo(0, 0);
    window.location.reload();
  });
})();
