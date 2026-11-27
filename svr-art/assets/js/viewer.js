/* SVR ART — viewer: one work at a time, alone in the room.
   Native <dialog> (focus trap, inert page, Esc), the work grows out of its place
   on the page, previous / next by buttons, arrow keys or swipe. */
(function () {
  'use strict';

  var dialog = document.querySelector('[data-viewer]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var img = dialog.querySelector('[data-viewer-img]');
  var stage = dialog.querySelector('[data-viewer-stage]');
  var info = dialog.querySelector('[data-viewer-info]');
  var fields = {
    index: dialog.querySelector('[data-viewer-index]'),
    total: dialog.querySelector('[data-viewer-total]'),
    series: dialog.querySelector('[data-viewer-series]'),
    title: dialog.querySelector('[data-viewer-title]'),
    medium: dialog.querySelector('[data-viewer-medium]'),
    note: dialog.querySelector('[data-viewer-note]')
  };
  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

  var pieces = Array.prototype.slice.call(document.querySelectorAll('[data-piece]'))
    .sort(function (a, b) { return +a.getAttribute('data-piece') - +b.getAttribute('data-piece'); });
  var total = pieces.length;
  var current = 0;
  var busy = false;
  var closing = false;
  var opener = null;

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  function work(i) {
    var p = pieces[i];
    var thumb = p.querySelector('img');
    return {
      src: p.getAttribute('data-src'),
      w: +p.getAttribute('data-w'),
      h: +p.getAttribute('data-h'),
      title: p.getAttribute('data-title'),
      series: p.getAttribute('data-series'),
      medium: p.getAttribute('data-medium'),
      note: p.getAttribute('data-note'),
      alt: thumb ? thumb.alt : '',
      thumb: thumb
    };
  }

  function fill(i) {
    var w = work(i);
    img.width = w.w;
    img.height = w.h;
    img.src = w.src;
    img.alt = w.alt;
    fields.index.textContent = pad(i + 1);
    fields.total.textContent = pad(total);
    fields.series.textContent = w.series || '';
    fields.title.textContent = w.title || '';
    fields.title.innerHTML = fields.title.innerHTML.replace('-', '<span class="hy">-</span>');
    fields.medium.textContent = w.medium || '';
    fields.note.textContent = w.note || '';
    // keep the neighbours warm
    [-1, 1].forEach(function (d) { var n = new Image(); n.src = work((i + d + total) % total).src; });
  }

  function visible(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }

  /* The work grows out of its place on the page (FLIP) */
  function flip(fromRect, reverse) {
    var to = img.getBoundingClientRect();
    if (!fromRect || !to.width) return null;
    var s = fromRect.width / to.width;
    var start = 'translate(' + (fromRect.left - to.left) + 'px,' + (fromRect.top - to.top) + 'px) scale(' + s + ')';
    img.style.transformOrigin = '0 0';
    var frames = reverse ? [{ transform: 'none' }, { transform: start }] : [{ transform: start }, { transform: 'none' }];
    return img.animate(frames, { duration: reverse ? 650 : 900, easing: reverse ? 'cubic-bezier(0.77, 0, 0.18, 1)' : EASE, fill: 'both' });
  }

  function open(i, sourceEl, trigger) {
    if (dialog.open) return;
    current = i;
    opener = trigger || null;
    fill(i);
    dialog.showModal();
    root.classList.add('viewer-open');
    var from = sourceEl && visible(sourceEl) ? sourceEl.getBoundingClientRect() : null;
    requestAnimationFrame(function () {
      dialog.classList.add('is-open');
      if (reduce.matches) return;
      var a = from ? flip(from, false) : img.animate([{ opacity: 0, transform: 'scale(0.98)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: EASE });
      if (a) a.onfinish = function () { a.cancel(); };
      info.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 250, easing: EASE, fill: 'backwards' });
    });
  }

  function close() {
    if (!dialog.open || closing) return;
    closing = true;
    var target = work(current).thumb;
    var back = !reduce.matches && target && visible(target) ? flip(target.getBoundingClientRect(), true) : null;
    dialog.classList.remove('is-open');
    setTimeout(function () {
      if (back) back.cancel();
      dialog.close();
      root.classList.remove('viewer-open');
      closing = false;
      var focusTo = pieces[current].querySelector('.piece__open') || opener;
      if (focusTo) focusTo.focus({ preventScroll: true });
    }, reduce.matches ? 0 : 560);
  }

  function go(dir) {
    if (busy || closing) return;
    busy = true;
    var next = (current + dir + total) % total;
    var preload = new Image();
    preload.src = work(next).src;
    var ready = preload.decode ? preload.decode().catch(function () {}) : Promise.resolve();

    if (reduce.matches) {
      ready.then(function () { current = next; fill(next); busy = false; });
      return;
    }
    var out = img.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 28) + 'px)' }], { duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
    info.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    Promise.all([out.finished, ready]).then(function () {
      current = next;
      fill(next);
      out.cancel();
      img.animate([{ opacity: 0, transform: 'translateX(' + (dir * 28) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 620, easing: EASE });
      info.getAnimations().forEach(function (a) { a.cancel(); });
      info.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 620, delay: 80, easing: EASE, fill: 'backwards' });
      busy = false;
    });
  }

  /* Opening: every work on the page, and the "View the work" buttons */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.piece__open, [data-open]');
    if (!btn) return;
    var piece = btn.closest('[data-piece]');
    var i = piece ? +piece.getAttribute('data-piece') : +btn.getAttribute('data-open');
    var src = (piece || pieces[i]).querySelector('img');
    open(i, src, btn);
  });

  dialog.querySelector('[data-viewer-close]').addEventListener('click', close);
  dialog.querySelector('[data-viewer-prev]').addEventListener('click', function () { go(-1); });
  dialog.querySelector('[data-viewer-next]').addEventListener('click', function () { go(1); });
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  dialog.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  stage.addEventListener('click', function (e) { if (e.target === stage) close(); });

  /* Swipe on touch screens */
  var startX = null;
  var startY = null;
  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    startX = e.clientX;
    startY = e.clientY;
  });
  stage.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', function () { startX = null; });
})();
