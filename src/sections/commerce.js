/**
 * Partie commerciale : demande de projet (dialog natif), mentions légales,
 * contacts du pied de page, apparition des étapes de la méthode.
 *
 * Envoi de la demande :
 *  - si VITE_FORM_ENDPOINT est défini au build (Formspree, Web3Forms…), la
 *    demande est envoyée en JSON et la confirmation n'apparaît QUE si le
 *    service répond positivement ;
 *  - sinon, un e-mail pré-rempli s'ouvre dans la messagerie du visiteur, et le
 *    site le dit clairement (rien n'est envoyé tant qu'il n'a pas cliqué
 *    « Envoyer » dans sa messagerie). La demande peut aussi être copiée.
 */
import { site, mailto } from '../data/site.js';
import { lockScroll, unlockScroll } from '../core/scroll.js';

const ENDPOINT = import.meta.env?.VITE_FORM_ENDPOINT || '';
const ACCESS_KEY = import.meta.env?.VITE_FORM_ACCESS_KEY || ''; // clé publique Web3Forms, si utilisée

const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const serviceName = () => { try { return new URL(ENDPOINT).hostname.replace(/^www\./, ''); } catch { return 'un service d’envoi'; } };

/* Feuilles ---------------------------------------------------------------- */
const openSheets = new Set();
function makeSheet(dialog) {
  let returnFocus = null;
  const open = () => {
    if (dialog.open) return;
    returnFocus = document.activeElement;
    dialog.showModal();
    dialog.querySelector('.sheet__panel').scrollTop = 0;
    openSheets.add(dialog);
    lockScroll(`sheet-${dialog.id}`);
  };
  const close = () => { if (dialog.open) dialog.close(); };
  dialog.addEventListener('close', () => {
    openSheets.delete(dialog);
    unlockScroll(`sheet-${dialog.id}`);
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  // clic sur le fond (hors panneau) = fermer
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
  return { open, close, dialog };
}

/* Copie avec repli ---------------------------------------------------------- */
async function copyText(text, fallbackEl) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (fallbackEl) {
      const range = document.createRange();
      range.selectNodeContents(fallbackEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return false;
  }
}

/* Demande de projet -------------------------------------------------------- */
const LABELS = {
  name: 'Nom', email: 'E-mail', activity: 'Activité', type: 'Type de projet', budget: 'Budget',
  goal: 'Objectif', description: 'Description', link: 'Site actuel ou Instagram', inspirations: 'Inspirations',
};

function initBrief(openLegal) {
  const sheet = makeSheet(document.getElementById('brief'));
  const { dialog } = sheet;
  const form = dialog.querySelector('form');
  const error = dialog.querySelector('.brief__error');
  const done = dialog.querySelector('.brief__done');
  const submitBtn = form.querySelector('[type="submit"]');

  dialog.querySelector('[data-brief-how]').textContent = ENDPOINT
    ? 'Votre demande m’est transmise directement ; je vous réponds par e-mail.'
    : 'Votre messagerie s’ouvrira avec la demande pré-remplie : il vous restera à l’envoyer.';

  const reset = () => { form.hidden = false; done.hidden = true; error.hidden = true; };

  const open = (type) => {
    reset();
    if (typeof type === 'string' && type) {
      const sel = form.elements.type;
      if ([...sel.options].some((o) => o.value === type || o.text === type)) sel.value = type;
    }
    sheet.open();
  };

  const data = () => {
    const d = {};
    Object.keys(LABELS).forEach((k) => { d[k] = (form.elements[k]?.value || '').trim(); });
    return d;
  };
  const asText = (d) => Object.entries(LABELS)
    .filter(([k]) => d[k])
    .map(([k, label]) => (k === 'description' ? `\n${label} :\n${d[k]}\n` : `${label} : ${d[k]}`))
    .join('\n');

  const validate = () => {
    const bad = [];
    ['name', 'email', 'activity', 'description'].forEach((k) => {
      const el = form.elements[k];
      const v = el.value.trim();
      const ok = k === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : v.length > 0;
      el.setAttribute('aria-invalid', String(!ok));
      if (!ok) bad.push(el);
    });
    if (bad.length) {
      const names = bad.map((el) => form.querySelector(`label[for="${el.id}"]`).textContent.replace(' *', '').toLowerCase());
      error.textContent = `Merci de compléter : ${names.join(', ')}${bad.includes(form.elements.email) ? ' (adresse e-mail valide)' : ''}.`;
      error.hidden = false;
      bad[0].focus();
      return false;
    }
    error.hidden = true;
    return true;
  };
  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
  });

  const showDone = (title, html, actions = []) => {
    form.hidden = true;
    done.hidden = false;
    done.querySelector('[data-done-title]').textContent = title;
    done.querySelector('[data-done-text]').innerHTML = html;
    const box = done.querySelector('[data-done-actions]');
    box.innerHTML = '';
    actions.forEach((a) => box.append(a));
    dialog.querySelector('.sheet__panel').scrollTop = 0;
    done.focus();
  };
  const button = (label, cls, onClick) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  };

  const viaMail = (d) => {
    const body = `Bonjour Noah,\n\n${asText(d)}\n\n—\nEnvoyé depuis le formulaire du portfolio`;
    const href = mailto(site.emailSubject, body);
    // ouverture de la messagerie (déclenchée par le clic sur « Envoyer »)
    const a = document.createElement('a');
    a.href = href;
    a.rel = 'noopener';
    document.body.append(a);
    a.click();
    a.remove();
    done.querySelector('pre')?.remove();
    const pre = document.createElement('pre');
    pre.className = 'visually-hidden';
    pre.textContent = body;
    done.append(pre);
    const copy = button('Copier la demande', 'chip', async (e) => {
      const ok = await copyText(`À : ${site.email}\nObjet : ${site.emailSubject}\n\n${body}`, pre);
      e.target.textContent = ok ? 'Demande copiée' : 'Texte sélectionné';
    });
    showDone(
      'Votre messagerie va s’ouvrir.',
      `La demande est pré-remplie : il ne reste qu’à l’envoyer depuis votre messagerie. Rien ne s’est ouvert ? Copiez-la et envoyez-la à <a href="${esc(mailto())}">${esc(site.email)}</a>.`,
      [
        copy,
        button('Rouvrir la messagerie', 'chip', () => { window.location.href = href; }),
        button('Modifier', 'chip', reset),
      ],
    );
  };

  const viaEndpoint = async (d) => {
    submitBtn.disabled = true;
    const label = submitBtn.firstChild.textContent;
    submitBtn.firstChild.textContent = 'Envoi…';
    try {
      const payload = { ...d, _subject: site.emailSubject, subject: site.emailSubject };
      if (ACCESS_KEY) payload.access_key = ACCESS_KEY;
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false || json.ok === false) throw new Error(json.message || `HTTP ${res.status}`);
      form.reset();
      showDone('Demande envoyée. Merci !', `Je reviens vers vous à l’adresse <strong>${esc(d.email)}</strong>.`, [button('Fermer', 'chip', sheet.close)]);
    } catch {
      error.innerHTML = `L’envoi n’a pas abouti. Vos réponses sont conservées : réessayez, ou <button type="button" class="footer__link" data-fallback>envoyez-les par e-mail</button>.`;
      error.hidden = false;
      error.querySelector('[data-fallback]').addEventListener('click', () => viaMail(d));
    } finally {
      submitBtn.disabled = false;
      submitBtn.firstChild.textContent = label;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.elements.company.value) return; // robot (champ piège rempli)
    if (!validate()) return;
    const d = data();
    if (ENDPOINT) viaEndpoint(d);
    else viaMail(d);
  });

  dialog.querySelectorAll('[data-open-legal]').forEach((b) => b.addEventListener('click', () => openLegal(b.dataset.openLegal)));
  return { open };
}

/* Mentions légales --------------------------------------------------------- */
function initLegal() {
  const sheet = makeSheet(document.getElementById('legal'));
  const { dialog } = sheet;
  const L = site.legal || {};
  const rows = (pairs) => pairs.filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('');

  dialog.querySelector('[data-legal-editor]').innerHTML = rows([
    ['Responsable', esc(site.name)],
    ['Activité', 'Web design et création numérique'],
    ['Statut', esc(L.status || '')],
    ['SIRET', esc(L.siret || '')],
    ['Adresse', esc(L.address || '')],
    ['TVA', esc(L.vatNote || '')],
    ['Contact', `<a href="${esc(mailto())}">${esc(site.email)}</a>`],
  ]);
  const host = L.host || {};
  const hostEl = dialog.querySelector('[data-legal-host]');
  hostEl.innerHTML = rows([
    ['Hébergeur', esc(host.name || '')],
    ['Adresse', esc(host.address || '')],
    ['Site', host.url ? `<a href="${esc(host.url)}" target="_blank" rel="noopener noreferrer">${esc(host.url)}</a>` : ''],
  ]);
  if (!hostEl.innerHTML) { hostEl.previousElementSibling.hidden = true; hostEl.hidden = true; }

  dialog.querySelector('[data-legal-form]').textContent = ENDPOINT
    ? `Le formulaire « Démarrer un projet » transmet vos réponses (nom, e-mail, informations sur le projet) via ${serviceName()}, qui me les fait suivre par e-mail.`
    : 'Le formulaire « Démarrer un projet » n’envoie rien par lui-même : il prépare un e-mail dans votre messagerie, que vous choisissez ou non d’envoyer.';
  const mail = dialog.querySelector('[data-legal-email]');
  mail.href = mailto('Données personnelles');
  mail.textContent = site.email;

  const title = dialog.querySelector('#legal-title');
  return {
    open(which = 'legal') {
      sheet.open();
      title.textContent = which === 'privacy' ? 'Confidentialité' : 'Mentions légales';
      if (which === 'privacy') {
        const panel = dialog.querySelector('.sheet__panel');
        const target = dialog.querySelector('#legal-privacy');
        panel.scrollTop = target.offsetTop - 90;
      }
    },
  };
}

/* Pied de page -------------------------------------------------------------- */
function renderFooterContact() {
  const ul = document.querySelector('[data-footer-contact]');
  if (!ul) return;
  const items = [];
  if (site.email) items.push(`<li><a href="${esc(mailto())}">${esc(site.email)}</a></li>`);
  site.socials.forEach((s) => items.push(`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ${esc(s.handle || '')} ↗<span class="visually-hidden"> (nouvel onglet)</span></a></li>`));
  ul.innerHTML = items.join('');
}

/* Méthode : les étapes s'allument à l'entrée -------------------------------- */
function initSteps() {
  const steps = document.querySelectorAll('.step');
  if (!('IntersectionObserver' in window)) { steps.forEach((s) => s.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -25% 0px' });
  steps.forEach((s) => io.observe(s));
}

export function initCommerce() {
  renderFooterContact();
  initSteps();
  const legal = initLegal();
  const brief = initBrief((w) => legal.open(w));

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open-brief]');
    if (b) { e.preventDefault(); brief.open(b.dataset.openBrief); return; }
    const l = e.target.closest('[data-open-legal]');
    if (l && !l.closest('#brief')) legal.open(l.dataset.openLegal);
  });

  // lien direct partageable : …/#demarrer ouvre la demande de projet
  const fromHash = () => { if (location.hash === '#demarrer') brief.open(); };
  window.addEventListener('hashchange', fromHash);
  return { openFromURL: fromHash, isOpen: () => openSheets.size > 0 };
}
