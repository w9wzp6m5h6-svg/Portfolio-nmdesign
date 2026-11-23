/**
 * Device & preference detection — computed once, read everywhere.
 */
const mq = (q) => window.matchMedia(q);

const reducedMotionQuery = mq('(prefers-reduced-motion: reduce)');
const finePointerQuery = mq('(hover: hover) and (pointer: fine)');

function detectWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const cores = navigator.hardwareConcurrency || 4;
const memory = navigator.deviceMemory || 4;
const smallScreen = mq('(max-width: 900px)').matches;
const saveData = navigator.connection?.saveData === true;

export const env = {
  get reducedMotion() { return reducedMotionQuery.matches; },
  get finePointer() { return finePointerQuery.matches; },
  webgl: detectWebGL(),
  /** "lite" = lower resolution, lighter assets, fewer effects */
  lite: smallScreen || cores <= 4 || memory <= 4 || saveData,
  smallScreen,
  /** device pixel ratio cap for WebGL canvases */
  get dpr() { return Math.min(window.devicePixelRatio || 1, this.lite ? 1.5 : 2); },
};

export function onReducedMotionChange(fn) {
  reducedMotionQuery.addEventListener('change', fn);
}
