/* SVR ART — the clip in the hero.
   Picks the cut for the screen (16:9 or 9:16), plays it muted, keeps a REC timecode
   and the current shot in sync, lets the visitor cut to the next shot, pauses when
   off screen. Reduced motion or Save-Data: the poster waits, the visitor decides. */
(function () {
  'use strict';

  var box = document.querySelector('[data-clip]');
  if (!box) return;
  var video = box.querySelector('[data-clip-video]');
  var tc = box.querySelector('[data-clip-tc]');
  var nEl = box.querySelector('[data-clip-n]');
  var totalEl = box.querySelector('[data-clip-total]');
  var labelEl = box.querySelector('[data-clip-label]');
  var cutBtn = box.querySelector('[data-clip-cut]');
  var toggle = box.querySelector('[data-clip-toggle]');
  var toggleLabel = box.querySelector('[data-clip-toggle-label]');
  var cursor = box.querySelector('[data-clip-cursor]');
  var shotsData = JSON.parse(document.querySelector('[data-clip-shots]').textContent);

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var tallQuery = window.matchMedia('(max-width: 899px), (max-aspect-ratio: 1/1)');
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var canWebm = video.canPlayType('video/webm; codecs="vp9"') !== '';
  var FPS = 24;

  var cutName = null;
  var shots = [];
  var userPaused = reduce.matches || saveData;   // they press play themselves
  var visible = true;
  var lastShot = -1;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function useCut(name) {
    if (name === cutName) return;
    cutName = name;
    shots = shotsData[name].shots;
    totalEl.textContent = pad(shots.length);
    var t = video.currentTime || 0;
    video.poster = 'assets/video/svr-clip-' + name + '.webp';
    video.src = 'assets/video/svr-clip-' + name + (canWebm ? '.webm' : '.mp4');
    video.load();
    if (t) video.currentTime = t % shotsData[name].duration;
    sync();
    if (shouldPlay()) play();
  }

  function shouldPlay() { return !userPaused && visible && !document.hidden; }

  function play() {
    var p = video.play();
    if (p && p.catch) p.catch(function (err) {
      // a new load can interrupt play() (AbortError): not a refusal. Only a refusal shows "Play".
      if (err && err.name === 'NotAllowedError') { userPaused = true; setPaused(true); }
    });
  }

  function setPaused(paused) {
    toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
    toggleLabel.textContent = paused ? 'Play' : 'Pause';
    box.classList.toggle('clip-off', paused);
  }

  function shotAt(t) {
    var i = 0;
    while (i + 1 < shots.length && t >= shots[i + 1][0] - 0.01) i++;
    return i;
  }

  function sync() {
    var t = video.currentTime || 0;
    var f = Math.floor(t * FPS);
    tc.textContent = '00:00:' + pad(Math.floor(f / FPS)) + ':' + pad(f % FPS);
    var i = shotAt(t);
    if (i !== lastShot) {
      lastShot = i;
      nEl.textContent = pad(i + 1);
      labelEl.textContent = shots[i][1];
    }
  }

  var raf = 0;
  function loop() {
    sync();
    if (!video.paused) raf = requestAnimationFrame(loop);
  }
  video.addEventListener('play', function () { setPaused(false); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); });
  video.addEventListener('pause', function () { if (userPaused) setPaused(true); sync(); });
  video.addEventListener('seeked', sync);

  /* Cut to the next shot — with a flash */
  cutBtn.addEventListener('click', function () {
    var i = shotAt(video.currentTime || 0);
    var next = shots[(i + 1) % shots.length][0];
    video.currentTime = next + 0.001;
    if (!reduce.matches) {
      box.classList.remove('is-cut');
      void box.offsetWidth;
      box.classList.add('is-cut');
      setTimeout(function () { box.classList.remove('is-cut'); }, 320);
    }
    sync();
  });

  toggle.addEventListener('click', function () {
    userPaused = !video.paused ? true : false;
    if (userPaused) { video.pause(); setPaused(true); }
    else { setPaused(false); play(); }
  });

  /* The "CUT →" label follows the mouse over the clip */
  cutBtn.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    box.classList.add('is-hover');
    cursor.style.setProperty('--cx', (e.clientX + 14) + 'px');
    cursor.style.setProperty('--cy', (e.clientY + 14) + 'px');
  });
  cutBtn.addEventListener('pointerleave', function () { box.classList.remove('is-hover'); });

  /* Only play what can be seen */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      root.classList.toggle('clip-hidden', !visible);
      if (shouldPlay()) play(); else if (!video.paused) video.pause();
    }, { threshold: 0.05 }).observe(box);
  }
  document.addEventListener('visibilitychange', function () {
    if (shouldPlay()) play(); else if (!video.paused) video.pause();
  });

  tallQuery.addEventListener('change', function () { useCut(tallQuery.matches ? 'tall' : 'wide'); });

  setPaused(userPaused);
  useCut(tallQuery.matches ? 'tall' : 'wide');

  window.SVRClip = {
    start: function () { if (shouldPlay()) play(); }
  };
})();
