/**
 * Banc de rendu de la canette ÉLAN (outil de production, jamais publié).
 * ?variant=sanguine&w=1400&h=1750&yaw=0.3&pitch=0.06&dist=7.6
 * Expose window.__done quand l'image est prête (capturée par tools/render/elan.mjs).
 */
import '@fontsource-variable/space-grotesk/wght.css';
import '@fontsource-variable/inter/opsz.css';
import { CanStage } from '../../src/concepts/elan/can-stage.js';

const q = new URLSearchParams(location.search);
const c = document.getElementById('c');
const w = +q.get('w') || 1400; const h = +q.get('h') || 1750;
c.style.width = `${w}px`; c.style.height = `${h}px`;
const stage = new CanStage(c, { variant: q.get('variant') || 'sanguine', still: true });
await stage.init();
stage.renderStill({ yaw: +(q.get('yaw') ?? 0.35), pitch: +(q.get('pitch') ?? 0.06), dist: +(q.get('dist') ?? 7.6), aim: +(q.get('aim') ?? 0) });
window.__done = true;
