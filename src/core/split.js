/**
 * Lightweight text splitting for masked line / word reveals.
 * Keeps inline markup (em, br) and exposes the original text to assistive tech.
 */

/** Wraps every word of `el` in span.w (keeps <em>/<span> wrappers). Returns the word spans. */
export function splitWords(el) {
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const s = document.createElement('span');
          s.className = 'w';
          s.textContent = part;
          frag.append(s);
          words.push(s);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  return words;
}

/**
 * Splits `el` into visual lines: each line becomes
 * <span class="split-line"><span class="split-line__inner">…</span></span>.
 * Re-run on resize (call `revert` first).
 */
export function splitLines(el) {
  const original = el.innerHTML;
  if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const words = splitWords(el);
  const lines = [];
  let current = [];
  let top = null;
  words.forEach((w) => {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) < 4) { current.push(w); top ??= t; }
    else { lines.push(current); current = [w]; top = t; }
  });
  if (current.length) lines.push(current);

  // rebuild: each line keeps its words' wrapper elements (em etc.)
  const html = lines.map((line) => {
    const parts = line.map((w) => {
      let out = w.outerHTML;
      let p = w.parentElement;
      while (p && p !== el) { out = `<${p.tagName.toLowerCase()}${p.className ? ` class="${p.className}"` : ''}>${out}</${p.tagName.toLowerCase()}>`; p = p.parentElement; }
      return out;
    });
    return `<span class="split-line" aria-hidden="true"><span class="split-line__inner">${parts.join(' ')}</span></span>`;
  });
  el.innerHTML = html.join('');
  return {
    lines: [...el.querySelectorAll('.split-line__inner')],
    revert: () => { el.innerHTML = original; },
  };
}
