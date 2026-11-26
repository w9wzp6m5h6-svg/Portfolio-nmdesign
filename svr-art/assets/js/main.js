/* SVR — ART · first visual
   Plain script, no dependency: intro, scroll reveals, header, hero depth, menu. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ------------------------------------------------------------------
     1. Intro — wait for the painting (and fonts) before lighting the wall
     ------------------------------------------------------------------ */
  var heroImg = document.querySelector('[data-hero-img]');

  function whenImageReady(img) {
    if (!img) return Promise.resolve();
    if (img.decode) return img.decode().catch(function () {});
    if (img.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }

  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var timeout = new Promise(function (resolve) { setTimeout(resolve, 2600); });

  Promise.race([Promise.all([whenImageReady(heroImg), fontsReady]), timeout]).then(function () {
    requestAnimationFrame(function () {
      root.classList.add('is-ready');
      // Hand the light back to the scroll once its fade-in is over.
      setTimeout(function () { root.classList.add('is-settled'); }, 2200);
    });
  });

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
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------------
     3. Header + hero depth (one rAF loop, only while something moves)
     ------------------------------------------------------------------ */
  var header = document.querySelector('[data-header]');
  var hero = document.querySelector('[data-hero]');

  var lastY = window.scrollY;
  var target = { x: 0, y: 0 };
  var current = { x: 0, y: 0 };
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight || 1;

    // Header: transparent on the hero, solid after; hides on the way down, returns on the way up.
    var pastHero = y > vh * 0.85;
    header.classList.toggle('is-solid', pastHero);
    if (!root.classList.contains('menu-open')) {
      header.classList.toggle('is-hidden', pastHero && y > lastY + 2);
      if (y < lastY - 2 || !pastHero) header.classList.remove('is-hidden');
    }
    lastY = y;

    if (reduceMotion.matches) return;

    // Hero: the painting recedes slightly as the page moves on.
    var p = Math.min(Math.max(y / vh, 0), 1);
    hero.style.setProperty('--p', p.toFixed(4));

    // Pointer depth, eased.
    current.x += (target.x - current.x) * 0.08;
    current.y += (target.y - current.y) * 0.08;
    hero.style.setProperty('--mx', current.x.toFixed(4));
    hero.style.setProperty('--my', current.y.toFixed(4));

    if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
      requestTick();
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

  hero.addEventListener('pointermove', function (e) {
    if (!finePointer.matches || reduceMotion.matches) return;
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
    requestTick();
  });
  hero.addEventListener('pointerleave', function () {
    target.x = 0;
    target.y = 0;
    requestTick();
  });

  update();

  /* ------------------------------------------------------------------
     4. Menu (phones, tablet portrait)
     ------------------------------------------------------------------ */
  var toggle = document.querySelector('[data-menu-toggle]');
  var label = document.querySelector('[data-menu-label]');
  var menu = document.querySelector('[data-menu]');
  var inertTargets = [document.getElementById('main'), document.querySelector('.site-footer'), document.querySelector('.nav')];
  var closeTimer = null;

  function focusables() {
    return [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a[href]')));
  }

  function openMenu() {
    clearTimeout(closeTimer);
    menu.hidden = false;
    void menu.offsetWidth; // commit the closed state so the wipe transitions
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
    if (e.key === 'Escape') {
      closeMenu(true);
      return;
    }
    if (e.key === 'Tab') {
      var items = focusables();
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Leaving the small layout with the menu open: close it.
  var wideNav = window.matchMedia('(min-width: 760px) and (min-aspect-ratio: 1/1)');
  var onWide = function () { if (wideNav.matches) closeMenu(false); };
  if (wideNav.addEventListener) wideNav.addEventListener('change', onWide);

  /* ------------------------------------------------------------------
     5. Footer year
     ------------------------------------------------------------------ */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
