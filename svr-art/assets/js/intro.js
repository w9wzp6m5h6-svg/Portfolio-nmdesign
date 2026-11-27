/* SVR ART — intro: the Mac is the portal.
   1. Darkness, then a light; the closed laptop appears in a studio.
   2. The lid opens, with weight.
   3. The screen wakes on the original S/R ART logo.
   4. The camera squares up; the website appears *inside* the screen while the logo
      travels to its place in the navigation; the screen grows until it is the window.
   Phones and portrait tablets: a single aluminium device. Returning visitors (7 days):
   a short signature entrance. Reduced motion: no intro. Skip at any moment.
   Every frame is a pure function of time — ?intro=1&t=4.2 freezes a frame for review. */
(function () {
  'use strict';

  var root = document.documentElement;
  var intro = document.querySelector('[data-intro]');
  var site = window.SVRSite;
  if (!intro || !site) return;

  var clamp = function (v, a, b) { return Math.min(Math.max(v, a), b); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIn = function (t) { return t * t * t; };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeInOutQuart = function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; };
  var easeOutExpo = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };

  /* ---------- who gets which entrance ---------- */
  var params = new URLSearchParams(window.location.search);
  var force = params.get('intro');                       // '1' full · 'short' · '0' none
  var seekT = params.has('t') ? parseFloat(params.get('t')) : null;
  var timeScale = params.has('ts') ? clamp(parseFloat(params.get('ts')) || 1, 0.02, 4) : 1;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var seenAt = 0;
  try { seenAt = +localStorage.getItem('svr-intro-seen') || 0; } catch (err) { /* storage unavailable */ }
  var recent = Date.now() - seenAt < 7 * 24 * 3600 * 1000;

  if (reduce || force === '0') {
    site.reveal({});
    return;
  }
  var mode = force === 'short' || ((recent || saveData) && force !== '1' && seekT === null) ? 'short' : 'full';
  if (force && seekT === null && window.history.replaceState) {
    window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }

  /* ---------- elements ---------- */
  var shell = intro.querySelector('[data-intro-shell]');
  var screenEl = intro.querySelector('[data-screen]');
  var screenLetters = intro.querySelector('[data-screen-letters]');
  var screen2d = intro.querySelector('[data-screen2d]');
  var logo2d = intro.querySelector('[data-logo2d]');
  var keysEl = intro.querySelector('[data-mac-keys]');
  var skipBtn = intro.querySelector('[data-intro-skip]');
  var hdrLogo = document.querySelector('[data-hdr-logo]');
  var heroImg = document.querySelector('.hero__main img');
  var inertEls = [document.querySelector('[data-header]'), document.getElementById('main'), document.querySelector('.site-footer')];

  /* ---------- start ---------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  intro.hidden = false;
  root.classList.add('intro-active');
  inertEls.forEach(function (el) { if (el) el.inert = true; });
  if (mode === 'short') intro.classList.add('intro--short');
  else keysEl.innerHTML = keyboardSVG();

  var kind = 'short';            // 'laptop' | 'device' | 'short'
  var geom = {};
  var T = {};
  var zoom = { s: 1, ox: 0, oy: 0 };
  var r0 = null;                 // the screen's rectangle once it faces the camera
  var logoA = null;              // logo, centred on the screen
  var logoB = null;              // logo, at its place in the navigation (inside the screen)
  var current = 0;
  var done = false;
  var raf = 0;
  var revealedOnce = false;
  var landed = false;

  function setVar(name, value) { intro.style.setProperty(name, value); }

  /* ---------- geometry (px), recomputed on resize ---------- */
  function layout() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var P = Math.max(vw, vh) * 1.15;
    var small = vw < 900 || vw / vh < 1;
    kind = mode === 'short' ? 'short' : (small ? 'device' : 'laptop');
    intro.classList.toggle('intro--device', kind === 'device');
    setVar('--persp', P.toFixed(0) + 'px');
    geom = { vw: vw, vh: vh, P: P };

    if (kind === 'laptop') {
      // The screen takes the proportions of the window, so it can become the window.
      var sa = clamp(vw / vh, 1.3, 2.05);
      var lw = Math.min(vw * 0.5, vh * 0.84, 1120);
      var bzs = lw * 0.028, bzt = lw * 0.034, bzb = lw * 0.048;
      var sw = lw - bzs * 2, sh = sw / sa, lh = sh + bzt + bzb, bd = lw * 0.69;
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
      geom.logoPct = 0.44;
      geom.cz0 = P * (1 - 1 / 0.7);
      geom.cz1 = P * (1 - 1 / 0.86);
      geom.czD = P * (1 - sw / (0.6 * vw));
      geom.cy0 = -(lh * 0.5 + bd * 0.24);
      geom.cy1 = -lh * 0.3;
      geom.cyD = -(bzt + sh / 2 - lh / 2);
      T = { e: 5.8, end: 7.9 };
    } else if (kind === 'device') {
      var a = vw / vh;
      var dsw = Math.min(vw * 0.6, vh * 0.6 * a);
      var dsh = dsw / a;
      var bz = dsw * 0.035;
      var rim = Math.max(2, dsw * 0.014);
      setVar('--dw', (dsw + bz * 2 + rim * 2) + 'px');
      setVar('--dh', (dsh + bz * 2 + rim * 2) + 'px');
      setVar('--dr', ((dsw + bz * 2 + rim * 2) * 0.13) + 'px');
      setVar('--rim', rim + 'px');
      setVar('--bzs', bz + 'px');
      setVar('--sw', dsw + 'px');
      setVar('--sh', dsh + 'px');
      setVar('--logo-w', '70%');
      geom.logoPct = 0.7;
      T = { e: 3.4, end: 5.3 };
    } else {
      geom.logoPct = small ? 0.58 : 0.3;
      T = { e: 0, end: 1.75 };
    }

    // 1. where the screen sits once it faces the camera, and the zoom that maps it onto the window
    if (kind === 'short') {
      r0 = { left: 0, top: 0, width: vw, height: vh };
      zoom = { s: 1, ox: 0, oy: 0 };
    } else {
      render3D(T.e);
      var r = screenEl.getBoundingClientRect();
      r0 = { left: r.left, top: r.top, width: r.width, height: r.height };
      var s = Math.max(vw / r0.width, vh / r0.height);
      var cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
      var tx = vw / 2 - s * cx, ty = vh / 2 - s * cy;
      zoom = { s: s, ox: tx / (1 - s), oy: ty / (1 - s) };
      setVar('--zox', zoom.ox.toFixed(2) + 'px');
      setVar('--zoy', zoom.oy.toFixed(2) + 'px');
    }

    // 2. the flattened screen, and the logo's two positions inside it
    screen2d.style.left = r0.left + 'px';
    screen2d.style.top = r0.top + 'px';
    screen2d.style.width = r0.width + 'px';
    screen2d.style.height = r0.height + 'px';

    var wasIn = root.classList.contains('in-screen');
    root.classList.remove('in-screen');
    var h = hdrLogo.getBoundingClientRect();
    if (wasIn) root.classList.add('in-screen');

    var aw = geom.logoPct * r0.width;
    var ah = aw * 768 / 1627;
    logoA = { x: (r0.width - aw) / 2, y: (r0.height - ah) / 2, w: aw };
    var pg = pageFit(r0);
    logoB = { x: pg.x - r0.left + h.left * pg.s, y: pg.y - r0.top + h.top * pg.s, w: h.width * pg.s };
    logo2d.style.left = logoA.x + 'px';
    logo2d.style.top = logoA.y + 'px';
    logo2d.style.width = aw + 'px';

    render(current);
  }

  /* The page, scaled to fit a rectangle (centred if the proportions differ) */
  function pageFit(r) {
    var s = Math.min(r.width / geom.vw, r.height / geom.vh);
    return { s: s, x: r.left + (r.width - geom.vw * s) / 2, y: r.top + (r.height - geom.vh * s) / 2 };
  }
  function rectAt(k) {
    return {
      left: zoom.ox + k * (r0.left - zoom.ox),
      top: zoom.oy + k * (r0.top - zoom.oy),
      width: r0.width * k,
      height: r0.height * k
    };
  }

  /* ---------- the timeline ---------- */
  function scene(t) {
    var g = geom;
    if (kind === 'laptop') {
      var d = easeInOut(seg(t, 4.2, 5.8));                               // 4. approach
      var screen = easeOut(seg(t, 2.95, 3.5));
      var settle = seg(t, 3.05, 3.8);
      return {
        bgo: easeOut(seg(t, 0.15, 1.9)),
        po: easeOut(seg(t, 0.35, 1.75)),
        floor: easeOut(seg(t, 0.6, 2.2)) * (1 - d * 0.7),
        veil: (1 - 0.5 * easeOut(seg(t, 0.2, 2.2))) * (1 - d),
        cap: easeOut(seg(t, 0.8, 1.6)) * (1 - easeIn(seg(t, 2.7, 3.2))),
        sweep: easeInOut(seg(t, 0.7, 2.2)),                               // 1. light on aluminium
        lid: lerp(-90, 12, easeInOut(seg(t, 1.5, 3.25))) + 2 * Math.sin(Math.PI * settle) * (1 - settle),  // 2. weight
        cz: lerp(lerp(g.cz0, g.cz1, easeOut(seg(t, 0, 4.2))), g.czD, d),
        cy: lerp(lerp(g.cy0, g.cy1, easeInOut(seg(t, 1.3, 3.6))), g.cyD, d),
        cg: lerp(lerp(-28, -21, easeInOut(seg(t, 0.3, 4.0))), -12, d),
        screen: screen,                                                   // 3. the screen wakes
        glow: screen * (0.9 - 0.45 * d),
        ov: easeOut(seg(t, 3.15, 3.95)),
        letters: easeOut(seg(t, 3.4, 4.3)),
        sheen: easeInOut(seg(t, 4.0, 5.1)),
        zoom: easeInOutQuart(seg(t, 6.45, 7.9)),
        glide: easeInOut(seg(t, 5.95, 7.05)),
        bgfade: easeInOut(seg(t, 6.05, 6.9))
      };
    }
    if (kind === 'device') {
      var dd = easeInOut(seg(t, 2.4, 3.4));
      var sc = easeOut(seg(t, 1.1, 1.55));
      return {
        bgo: easeOut(seg(t, 0.1, 1.4)),
        po: easeOut(seg(t, 0.15, 1.2)),
        floor: 0,
        veil: (1 - 0.5 * easeOut(seg(t, 0.1, 1.6))) * (1 - dd),
        cap: easeOut(seg(t, 0.4, 1.0)) * (1 - easeIn(seg(t, 2.0, 2.4))),
        sweep: easeInOut(seg(t, 0.4, 1.9)),
        lid: 0,
        cz: lerp(lerp(-g.P * 0.4, 0, easeOutExpo(seg(t, 0.1, 2.0))), g.P * 0.08, dd),
        cy: lerp(g.vh * 0.05, 0, easeOut(seg(t, 0.1, 2.0))),
        cg: lerp(22, 0, easeOut(seg(t, 0.1, 2.1))),
        screen: sc,
        glow: 0,
        ov: easeOut(seg(t, 1.3, 1.95)),
        letters: easeOut(seg(t, 1.5, 2.2)),
        sheen: easeInOut(seg(t, 2.0, 2.9)),
        zoom: easeInOutQuart(seg(t, 4.0, 5.3)),
        glide: easeInOut(seg(t, 3.55, 4.65)),
        bgfade: easeInOut(seg(t, 3.65, 4.5))
      };
    }
    return {                                                              // short entrance
      logo: easeOut(seg(t, 0.1, 0.6)),
      glide: easeInOut(seg(t, 0.7, 1.6)),
      bgfade: easeOut(seg(t, 0.85, 1.6)),
      zoom: 0
    };
  }

  function render3D(t) {
    var v = scene(t);
    setVar('--bgo', v.bgo.toFixed(4));
    setVar('--po', v.po.toFixed(4));
    setVar('--floor', v.floor.toFixed(4));
    setVar('--veil', v.veil.toFixed(4));
    setVar('--cap', v.cap.toFixed(4));
    setVar('--sweep', v.sweep.toFixed(4));
    setVar('--lid', v.lid.toFixed(3) + 'deg');
    setVar('--cz', v.cz.toFixed(2) + 'px');
    setVar('--cy', v.cy.toFixed(2) + 'px');
    setVar('--cg', v.cg.toFixed(3) + 'deg');
    setVar('--screen', v.screen.toFixed(4));
    setVar('--glow', v.glow.toFixed(4));
    setVar('--ov', v.ov.toFixed(4));
    setVar('--letters', v.letters.toFixed(4));
    setVar('--sheen', v.sheen.toFixed(4));
    setVar('--zk', '1');
    return v;
  }

  function render(t) {
    var v = kind === 'short' ? scene(t) : render3D(t);
    var inScreen = kind === 'short' || t >= T.e;
    setVar('--prog', clamp(t / T.end, 0, 1).toFixed(4));

    // 4. the flattened screen: the logo travels to the navigation, the page shows through
    setVar('--s2d', inScreen ? '1' : '0');
    setVar('--s2dbg', (1 - v.bgfade).toFixed(4));
    var g = v.glide;
    var w = lerp(logoA.w, logoB.w, g);
    logo2d.style.transform = 'translate(' + (lerp(logoA.x, logoB.x, g) - logoA.x).toFixed(2) + 'px,' +
      (lerp(logoA.y, logoB.y, g) - logoA.y).toFixed(2) + 'px) scale(' + (w / logoA.w).toFixed(5) + ')';
    if (kind === 'short') logo2d.style.opacity = v.logo.toFixed(4);

    if (kind !== 'short') {
      if (inScreen) {
        var k = lerp(1, zoom.s, v.zoom);
        setVar('--zk', k.toFixed(5));
        var r = rectAt(k);
        var x0 = r.left.toFixed(2), y0 = r.top.toFixed(2);
        var x1 = (r.left + r.width).toFixed(2), y1 = (r.top + r.height).toFixed(2);
        shell.style.clipPath = 'polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ' +
          x0 + 'px ' + y0 + 'px, ' + x1 + 'px ' + y0 + 'px, ' + x1 + 'px ' + y1 + 'px, ' + x0 + 'px ' + y1 + 'px, ' + x0 + 'px ' + y0 + 'px)';
        var pg = pageFit(r);
        root.style.setProperty('--pgx', pg.x.toFixed(2) + 'px');
        root.style.setProperty('--pgy', pg.y.toFixed(2) + 'px');
        root.style.setProperty('--pgs', pg.s.toFixed(5));
        root.classList.add('in-screen');
      } else {
        shell.style.clipPath = '';
        root.classList.remove('in-screen');
      }
    }

    if (inScreen && !revealedOnce) {
      revealedOnce = true;
      site.reveal({ logoPending: true, delay: kind === 'short' ? 0.6 : 0.42 });
    }
    if (g >= 1 && !landed) {
      landed = true;
      site.landLogo();
      logo2d.style.visibility = 'hidden';
    }
  }

  /* ---------- run ---------- */
  var t0 = null;
  function frame(now) {
    if (done) return;
    if (t0 === null) t0 = now;
    current = (now - t0) / 1000 * timeScale;
    if (current >= T.end) {
      current = T.end;
      render(current);
      finish();
      return;
    }
    render(current);
    raf = requestAnimationFrame(frame);
  }

  function clearPage() {
    root.classList.remove('in-screen');
    ['--pgx', '--pgy', '--pgs'].forEach(function (p) { root.style.removeProperty(p); });
  }

  function release() {
    root.classList.remove('intro-active');
    inertEls.forEach(function (el) { if (el) el.inert = false; });
    try { localStorage.setItem('svr-intro-seen', String(Date.now())); } catch (err) { /* storage unavailable */ }
    removeListeners();
  }

  function finish() {
    if (done) return;
    done = true;
    clearPage();
    site.reveal({});
    site.landLogo();
    intro.hidden = true;
    release();
  }

  /* Leave now: cover the page again, put it back in place, fade out. */
  function skip() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    shell.style.clipPath = '';
    if (kind !== 'short') setVar('--s2d', '0');
    clearPage();
    site.reveal({ delay: 0.1 });
    site.landLogo();
    intro.classList.add('is-leaving');
    release();
    setTimeout(function () { intro.hidden = true; }, 600);
  }

  function onKey(e) {
    if (['Escape', ' ', 'Enter', 'PageDown', 'ArrowDown', 'End'].indexOf(e.key) !== -1) {
      if (e.key === 'Enter' && document.activeElement === skipBtn) return;
      e.preventDefault();
      skip();
    }
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

  if (seekT !== null) {                  // review: freeze on a given second
    window.__svrIntroSeek = function (t) {
      if (done) return;
      current = t;
      render(t);
      if (t >= T.end) finish();
    };
    window.__svrIntroSeek(seekT);
    return;
  }

  /* Start once the logo (and, for the short entrance, the first work) can be painted */
  var decode = function (el) { return el && el.decode ? el.decode().catch(function () {}) : Promise.resolve(); };
  var needed = [decode(screenLetters)];
  if (mode === 'short') needed.push(decode(heroImg));
  Promise.race([Promise.all(needed), new Promise(function (r) { setTimeout(r, 1500); })]).then(function () {
    if (!done) raf = requestAnimationFrame(frame);
  });

  /* ---------- the keyboard, drawn once ---------- */
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
          key(x, y + h / 2, u, h / 2, '#17171a');
          key(x + u, y, u, h / 2, '#17171a');
          key(x + u, y + h / 2, u, h / 2, '#17171a');
          key(x + u * 2, y + h / 2, u, h / 2, '#17171a');
          x += u * 3;
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
