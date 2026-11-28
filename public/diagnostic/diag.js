/* Diagnostic d'affichage (Instagram et autres navigateurs intégrés). Sans dépendance, syntaxe ES5. */
(function () {
  var out = document.getElementById('report');
  var lines = [];
  var t0 = Date.now();
  function add(k, v) { lines.push(k + ' : ' + v); out.textContent = lines.join('\n'); }
  function yes(b) { return b ? 'oui' : 'NON'; }
  var ua = navigator.userAgent;
  var ios = ua.match(/OS (\d+)_(\d+)/);
  add('Date', new Date().toISOString());
  add('Navigateur', /Instagram/.test(ua) ? 'Instagram (navigateur intégré)' : /FBAN|FBAV/.test(ua) ? 'Facebook (navigateur intégré)' : /CriOS/.test(ua) ? 'Chrome iOS' : /Safari/.test(ua) && /Version\//.test(ua) ? 'Safari' : 'autre');
  add('Système', ios ? 'iOS ' + ios[1] + '.' + ios[2] : (/Android/.test(ua) ? 'Android' : 'autre'));
  add('User-Agent', ua);
  add('Adresse', location.href);
  add('Arrivé depuis', document.referrer || '(aucun référent)');
  add('Fenêtre ouverte par une autre page', yes(!!window.opener));
  var css = function (p, v) { try { return window.CSS && CSS.supports(p, v); } catch (e) { return false; } };
  add('Modules JavaScript', yes('noModule' in document.createElement('script')));
  add('IntersectionObserver / ResizeObserver', yes('IntersectionObserver' in window) + ' / ' + yes('ResizeObserver' in window));
  add('CSS color-mix / :has / svh', yes(css('color', 'color-mix(in srgb, red 50%, blue)')) + ' / ' + yes(css('selector(:has(a))', '') || (function () { try { document.querySelector(':has(a)'); return true; } catch (e) { return false; } })()) + ' / ' + yes(css('height', '100svh')));
  var gl = false; try { gl = !!document.createElement('canvas').getContext('webgl2'); } catch (e) {}
  add('WebGL 2 (3D)', yes(gl));
  var ls = 'NON'; try { localStorage.setItem('nm-diag', '1'); localStorage.removeItem('nm-diag'); ls = 'oui'; } catch (e) { ls = 'NON (' + e.name + ')'; }
  add('Stockage local', ls);
  add('Écran', screen.width + '×' + screen.height + ' @' + (window.devicePixelRatio || 1) + 'x, fenêtre ' + innerWidth + '×' + innerHeight);

  // Accueil dans un cadre : erreurs, ressources en échec, titre affiché, durée
  var frame = document.getElementById('frame');
  var errors = [];
  var watchTimer = setInterval(function () {
    try {
      var w = frame.contentWindow;
      if (w && w.location.href !== 'about:blank' && !w.__nmWatched) {
        w.__nmWatched = true;
        w.addEventListener('error', function (e) { errors.push((e.message || 'ressource en échec : ' + ((e.target && (e.target.src || e.target.href)) || '?'))); }, true);
        w.addEventListener('unhandledrejection', function (e) { errors.push('promesse rejetée : ' + (e.reason && e.reason.message || e.reason)); });
      }
    } catch (e) { errors.push('accès au cadre impossible : ' + e.name); clearInterval(watchTimer); }
  }, 10);
  frame.addEventListener('load', function () {
    if (frame.src.indexOf('about:blank') !== -1) return;
    setTimeout(function () {
      clearInterval(watchTimer);
      var d; try { d = frame.contentDocument; } catch (e) { d = null; }
      add('Accueil chargé en', (Date.now() - t0) + ' ms');
      if (!d) { add('Accueil', 'document inaccessible'); return; }
      var h = d.querySelector('h1');
      var r = h && h.getBoundingClientRect();
      add('Titre de l’accueil', h ? (h.textContent.replace(/\s+/g, ' ').trim() + ' — ' + Math.round(r.width) + '×' + Math.round(r.height) + ' px') : 'ABSENT');
      add('Projets affichés', String(d.querySelectorAll('[data-project-card]').length));
      var failed = [];
      try { (frame.contentWindow.performance.getEntriesByType('resource') || []).forEach(function (x) { if (x.responseStatus && x.responseStatus >= 400) failed.push(x.responseStatus + ' ' + x.name); }); } catch (e) {}
      add('Ressources en erreur', failed.length ? failed.join(' | ') : 'aucune');
      add('Erreurs JavaScript', errors.length ? errors.slice(0, 8).join(' | ') : 'aucune');
    }, 3500);
  });
  frame.src = '../';

  document.getElementById('copy').addEventListener('click', function () {
    var text = out.textContent;
    var done = function (ok) { document.getElementById('copied').textContent = ok ? 'Rapport copié.' : 'Sélectionnez le texte du rapport pour le copier.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else { var range = document.createRange(); range.selectNodeContents(out); var s = getSelection(); s.removeAllRanges(); s.addRange(range); done(false); }
  });
})();
