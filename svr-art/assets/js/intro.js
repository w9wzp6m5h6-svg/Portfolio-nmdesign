/* SVR ART — cinematic intro: "Enter the artist's world"
   A.  dark studio, aluminium, a light sweep on the closed lid
   B.  the lid opens, in credible perspective
   C.  the screen wakes on the original S/R ART logo
   D.  the camera moves in and squares up to the screen
   E/F the screen grows until it is the browser window
   G.  hand-off: the logo becomes the masthead of the homepage (site.js)
   Every frame is a pure function of time, so the sequence can be scrubbed (?t=3.2). */
(function () {
  'use strict';

  var root = document.documentElement;
  var intro = document.querySelector('[data-intro]');
  var site = window.SVRSite;
  if (!intro || !site) return;

  var params = new URLSearchParams(window.location.search);
  var force = params.get('intro');                       // ?intro=1 forces it, ?intro=0 disables it
  var seekT = params.has('t') ? parseFloat(params.get('t')) : null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem('svr-intro-seen') === '1'; } catch (err) { /* storage unavailable */ }

  if (reduce || force === '0' || (seen && force !== '1' && seekT === null)) {
    site.reveal(null);
    return;
  }

  /* ---------- helpers ---------- */
  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIn = function (t) { return t * t * t; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeInOutQuart = function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; };
  var easeOutExpo = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };

  var zoomEl = intro.querySelector('[data-intro-zoom]');
  var screenEl = intro.querySelector('[data-screen]');
  var screenLetters = intro.querySelector('[data-screen-letters]');
  var screenOval = intro.querySelector('[data-screen-oval]');
  var keysEl = intro.querySelector('[data-mac-keys]');
  var skipBtn = intro.querySelector('[data-intro-skip]');
  var inertEls = [document.querySelector('[data-header]'), document.getElementById('main'), document.querySelector('.site-footer')];

  /* ---------- start ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  intro.hidden = false;
  root.classList.add('intro-active');
  inertEls.forEach(function (el) { if (el) el.inert = true; });
  keysEl.innerHTML = keyboardSVG();

  var device = false;
  var geom = {};
  var zoom = { s: 1, ox: 0, oy: 0 };
  var T = { end: 8 };
  var done = false;
  var raf = 0;
  var current = 0;

  function setVar(name, value) { intro.style.setProperty(name, value); }

  /* ---------- geometry (px), recomputed on resize ---------- */
  function layout() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    device = vw < 900 || vw / vh < 1;
    intro.classList.toggle('intro--device', device);
    var P = Math.max(vw, vh) * 1.15;
    setVar('--persp', P.toFixed(0) + 'px');

    if (!device) {
      // A laptop: screen proportions follow the window, so it can become the window.
      var sa = clamp(vw / vh, 1.3, 2.05);
      var lw = Math.min(vw * 0.5, vh * 0.84, 1120);
      var bzs = lw * 0.028, bzt = lw * 0.034, bzb = lw * 0.048;
      var sw = lw - bzs * 2, sh = sw / sa, lh = sh + bzt + bzb;
      var bd = lw * 0.69;
      geom = { vw: vw, vh: vh, P: P, lw: lw, lh: lh, sw: sw, sh: sh, bzt: bzt, bd: bd };
      setVar('--lw', lw + 'px');
      setVar('--lh', lh + 'px');
      setVar('--bd', bd + 'px');
      setVar('--bt', (lw * 0.021) + 'px');
      setVar('--lt', (lw * 0.009) + 'px');
      setVar('--bzs', bzs + 'px');
      setVar('--bzt', bzt + 'px');
      setVar('--sw', sw + 'px');
      setVar('--sh', sh + 'px');
      setVar('--logo-w', '44%');
      // camera stations
      geom.cz0 = P * (1 - 1 / 0.7);
      geom.cz1 = P * (1 - 1 / 0.86);
      geom.czD = P * (1 - sw / (0.6 * vw));
      geom.cy0 = -(lh * 0.5 + bd * 0.24);
      geom.cy1 = -lh * 0.3;
      geom.cyD = -(bzt + sh / 2 - lh / 2);
      T = { end: 7.9, dEnd: 6.6 };
    } else {
      // A single device: aluminium rim, black glass, the logo.
      var a = vw / vh;
      var dsw = Math.min(vw * 0.6, vh * 0.6 * a);
      var dsh = dsw / a;
      var bz = dsw * 0.035;
      var rim = Math.max(2, dsw * 0.014);
      var dw = dsw + bz * 2 + rim * 2;
      var dh = dsh + bz * 2 + rim * 2;
      geom = { vw: vw, vh: vh, P: P, dw: dw, dh: dh };
      setVar('--dw', dw + 'px');
      setVar('--dh', dh + 'px');
      setVar('--dr', (dw * 0.13) + 'px');
      setVar('--rim', rim + 'px');
      setVar('--bzs', bz + 'px');
      setVar('--sw', dsw + 'px');
      setVar('--sh', dsh + 'px');
      setVar('--logo-w', '74%');
      T = { end: 5.3, dEnd: 3.8 };
    }
    computeZoom();
  }

  /* Measure the screen at the end of the approach, then derive the zoom that maps it onto the window. */
  function computeZoom() {
    zoom = { s: 1, ox: 0, oy: 0 };
    render(T.dEnd, true);
    var r = screenEl.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.max(vw / r.width, vh / r.height) * 1.004;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var tx = vw / 2 - s * cx, ty = vh / 2 - s * cy;
    zoom = { s: s, ox: tx / (1 - s), oy: ty / (1 - s) };
    setVar('--zox', zoom.ox.toFixed(2) + 'px');
    setVar('--zoy', zoom.oy.toFixed(2) + 'px');
    render(current, false);
  }

  /* ---------- the timeline ---------- */
  function render(t, noZoom) {
    var v = device ? renderDevice(t) : renderLaptop(t);
    setVar('--bgo', v.bgo.toFixed(4));
    setVar('--po', v.po.toFixed(4));
    setVar('--veil', v.veil.toFixed(4));
    setVar('--cap', v.cap.toFixed(4));
    setVar('--sweep', v.sweep.toFixed(4));
    setVar('--lid', v.lid.toFixed(3) + 'deg');
    setVar('--cz', v.cz.toFixed(2) + 'px');
    setVar('--cy', v.cy.toFixed(2) + 'px');
    setVar('--cg', v.cg.toFixed(3) + 'deg');
    setVar('--screen', v.screen.toFixed(4));
    setVar('--glow', v.glow.toFixed(4));
    setVar('--ov', v.oval.toFixed(4));
    setVar('--letters', v.letters.toFixed(4));
    setVar('--zk', noZoom ? '1' : lerp(1, zoom.s, v.zoom).toFixed(5));
    setVar('--prog', clamp(t / T.end, 0, 1).toFixed(4));
  }

  function renderLaptop(t) {
    var g = geom;
    var d = easeInOut(seg(t, 4.5, 6.6));                         // D: the approach
    var screen = easeOut(seg(t, 3.35, 3.9));
    return {
      bgo: easeOut(seg(t, 0, 1.8)),
      po: easeOut(seg(t, 0.1, 1.6)),
      veil: 1 - easeOut(seg(t, 0.2, 2.4)),
      cap: easeOut(seg(t, 0.6, 1.5)) * (1 - easeIn(seg(t, 3.0, 3.6))),
      sweep: easeInOut(seg(t, 0.8, 2.6)),                        // A: light on the aluminium
      lid: lerp(-90, 12, easeInOut(seg(t, 1.9, 3.7))),           // B: the lid opens
      cz: lerp(lerp(g.cz0, g.cz1, easeOut(seg(t, 0, 4.4))), g.czD, d),
      cy: lerp(lerp(g.cy0, g.cy1, easeInOut(seg(t, 1.5, 3.9))), g.cyD, d),
      cg: lerp(lerp(-28, -21, easeInOut(seg(t, 0.3, 4.2))), -12, d),
      screen: screen,                                            // C: the screen wakes
      glow: screen * (0.9 - 0.4 * d),
      oval: easeOut(seg(t, 3.6, 4.5)),
      letters: easeInOut(seg(t, 3.9, 5.1)),
      zoom: easeInOutQuart(seg(t, 6.15, 7.9))                    // E/F: into the screen
    };
  }

  function renderDevice(t) {
    var g = geom;
    var d = easeInOut(seg(t, 2.6, 3.8));
    var screen = easeOut(seg(t, 1.25, 1.75));
    return {
      bgo: easeOut(seg(t, 0, 1.4)),
      po: easeOut(seg(t, 0.05, 1.1)),
      veil: 1 - easeOut(seg(t, 0.1, 1.8)),
      cap: easeOut(seg(t, 0.4, 1.1)) * (1 - easeIn(seg(t, 2.3, 2.8))),
      sweep: easeInOut(seg(t, 0.5, 2.3)),
      lid: 0,
      cz: lerp(lerp(-g.P * 0.42, 0, easeOutExpo(seg(t, 0.05, 2.1))), g.P * 0.08, d),
      cy: lerp(g.vh * 0.05, 0, easeOut(seg(t, 0.05, 2.1))),
      cg: lerp(24, 0, easeOut(seg(t, 0.05, 2.2))),
      screen: screen,
      glow: 0,
      oval: easeOut(seg(t, 1.45, 2.2)),
      letters: easeInOut(seg(t, 1.65, 2.75)),
      zoom: easeInOutQuart(seg(t, 3.55, 5.3))
    };
  }

  /* ---------- run ---------- */
  var t0 = null;
  function frame(now) {
    if (done) return;
    if (t0 === null) t0 = now;
    current = (now - t0) / 1000;
    if (current >= T.end) {
      current = T.end;
      render(current, false);
      finish();
      return;
    }
    render(current, false);
    raf = requestAnimationFrame(frame);
  }

  /* Hand-off: replace the zoomed screen by a crisp, window-sized copy and let site.js land the logo. */
  var handoff = buildHandoff();

  function buildHandoff() {
    var el = document.createElement('div');
    el.className = 'handoff';
    el.setAttribute('aria-hidden', 'true');
    el.style.visibility = 'hidden';
    var bg = document.createElement('div');
    bg.className = 'handoff__bg';
    var oval = document.createElement('div');
    oval.className = 'handoff__oval';
    var letters = document.createElement('img');
    letters.className = 'handoff__letters';
    letters.alt = '';
    letters.src = screenLetters.currentSrc || screenLetters.src;
    el.appendChild(bg);
    el.appendChild(oval);
    el.appendChild(letters);
    document.body.appendChild(el);
    return { el: el, bg: bg, oval: oval, letters: letters };
  }

  function place(node, r) {
    node.style.left = r.left + 'px';
    node.style.top = r.top + 'px';
    node.style.width = r.width + 'px';
    node.style.height = r.height + 'px';
  }

  function release() {
    root.classList.remove('intro-active');
    inertEls.forEach(function (el) { if (el) el.inert = false; });
    try { sessionStorage.setItem('svr-intro-seen', '1'); } catch (err) { /* storage unavailable */ }
    removeListeners();
  }

  function finish() {
    if (done) return;
    done = true;
    place(handoff.oval, screenOval.getBoundingClientRect());
    place(handoff.letters, screenLetters.getBoundingClientRect());
    var swap = function () {
      handoff.el.style.visibility = 'visible';
      intro.hidden = true;
      release();
      site.reveal(handoff);
    };
    var ready = handoff.letters.decode ? handoff.letters.decode().catch(function () {}) : Promise.resolve();
    Promise.race([ready, new Promise(function (r) { setTimeout(r, 300); })]).then(swap);
  }

  function skip() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    intro.classList.add('is-leaving');
    if (handoff.el.parentNode) handoff.el.parentNode.removeChild(handoff.el);
    release();
    site.reveal(null);
    setTimeout(function () { intro.hidden = true; }, 650);
  }

  /* Leaving early: button, Escape, or any attempt to scroll */
  function onKey(e) {
    if (['Escape', ' ', 'PageDown', 'ArrowDown', 'End'].indexOf(e.key) !== -1) { e.preventDefault(); skip(); }
  }
  function onWheel(e) { if (e.deltaY > 4) skip(); }
  var touchY = null;
  function onTouchStart(e) { touchY = e.touches[0].clientY; }
  function onTouchMove(e) { if (touchY !== null && touchY - e.touches[0].clientY > 24) skip(); }
  function onResize() { if (!done) layout(); }
  var skipLink = document.querySelector('.skip-link');
  function onSkipLink() { skip(); }

  function removeListeners() {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('resize', onResize);
    if (skipLink) skipLink.removeEventListener('click', onSkipLink);
  }

  skipBtn.addEventListener('click', skip);
  window.addEventListener('keydown', onKey);
  window.addEventListener('wheel', onWheel, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('resize', onResize);
  if (skipLink) skipLink.addEventListener('click', onSkipLink);

  layout();

  if (seekT !== null) {                // scrub mode for review: freeze on a given second
    window.__svrIntroSeek = function (t) {
      if (done) return;
      current = t;
      render(t, false);
      if (t >= T.end) finish();
    };
    window.__svrIntroSeek(seekT);
    return;
  }

  render(0, false);
  var logoReady = screenLetters.decode ? screenLetters.decode().catch(function () {}) : Promise.resolve();
  Promise.race([logoReady, new Promise(function (r) { setTimeout(r, 1200); })]).then(function () {
    if (!done) raf = requestAnimationFrame(frame);
  });

  /* ---------- keyboard, drawn once ---------- */
  function keyboardSVG() {
    var rows = [
      [1, 13.5],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
      [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1.75, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75],
      [2.25, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.25],
      [1, 1, 1, 1.25, 5, 1.25, 1, 'arrows']
    ];
    var W = 1000;
    var u = W / 14.5;
    var gap = u * 0.13;
    var y = 0;
    var out = [];
    var key = function (x, yy, w, h, fill) {
      out.push('<rect x="' + (x + gap / 2).toFixed(1) + '" y="' + (yy + gap / 2).toFixed(1) + '" width="' + (w - gap).toFixed(1) +
        '" height="' + (h - gap).toFixed(1) + '" rx="' + (u * 0.1).toFixed(1) + '" fill="' + fill + '"/>');
    };
    rows.forEach(function (row, ri) {
      var h = ri === 0 ? u * 0.56 : u * 0.93;
      var x = 0;
      row.forEach(function (w, ki) {
        if (w === 'arrows') {
          var aw = u;
          key(x, y + h / 2, aw, h / 2, '#17171a');
          key(x + aw, y, aw, h / 2, '#17171a');
          key(x + aw, y + h / 2, aw, h / 2, '#17171a');
          key(x + aw * 2, y + h / 2, aw, h / 2, '#17171a');
          x += aw * 3;
          return;
        }
        key(x, y, w * u, h, ri === 0 && ki === 1 ? '#0c0c0d' : '#17171a');
        x += w * u;
      });
      y += h;
    });
    return '<svg viewBox="0 0 ' + W + ' ' + y.toFixed(0) + '" preserveAspectRatio="none" aria-hidden="true">' + out.join('') + '</svg>';
  }
})();
