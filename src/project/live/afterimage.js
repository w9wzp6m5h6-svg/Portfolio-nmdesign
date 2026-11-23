/**
 * Afterimage — generative light studies.
 * Domain-warped fbm, coloured by a cosine palette, composited through a
 * feedback buffer: every frame keeps a fading memory of the previous one,
 * so movement (and your cursor) leaves an afterimage.
 */
import * as THREE from 'three';
import { env } from '../../core/env.js';

/** Each study: a 3-stop light ramp (shadow → body → highlight) + an alternate body tint. */
export const STUDIES = [
  { id: 'ember', name: 'A — Braise', ramp: ['#040303', '#7a1f08', '#ffc98a'], alt: '#ff5a1f', feedback: 0.82, bands: 0, speed: 1 },
  { id: 'tide', name: 'B — Marée', ramp: ['#02040b', '#0d2a72', '#a9dcff'], alt: '#2b4bff', feedback: 0.86, bands: 0, speed: 0.8 },
  { id: 'ghost', name: 'C — Fantôme', ramp: ['#000000', '#3a3a40', '#ecebf2'], alt: '#ecebf2', feedback: 0.78, bands: 1, speed: 0.6 },
];

const vert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const fieldFrag = /* glsl */ `
  precision highp float;
  uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uPush;
  uniform sampler2D uPrev; uniform float uFeedback; uniform float uBands;
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uAlt;
  varying vec2 vUv;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
    return v;
  }

  void main(){
    float aspect = uRes.x / uRes.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.2;
    vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0) * 2.2;
    vec2 dm = p - m;
    float d = length(dm);
    p += dm * exp(-d * d * 3.5) * 0.9 * uPush;   // the cursor pushes the field (smooth, no singularity)

    float t = uTime * 0.06;
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + 3.6 * q + vec2(1.7, 9.2) + t * 1.4), fbm(p + 3.6 * q + vec2(8.3, 2.8) - t));
    float f = fbm(p + 3.8 * r);

    float v = smoothstep(0.2, 1.0, f * f * 1.7 + length(r) * 0.18);
    vec3 body = mix(uC1, uAlt, smoothstep(0.55, 1.1, length(q)) * 0.6);
    vec3 col = mix(mix(uC0, body, smoothstep(0.0, 0.6, v)), uC2, smoothstep(0.62, 1.0, v));
    float light = v;
    if (uBands > 0.5) {
      float b = abs(fract(f * 9.0) - 0.5);
      col = vec3(smoothstep(0.06, 0.0, b)) * (0.35 + light);
    }
    col += uC2 * exp(-d * d * 18.0) * 0.12 * uPush;  // faint glow under the finger

    // feedback: drift the previous frame slightly toward the centre
    vec2 fuv = (vUv - 0.5) * 0.9985 + 0.5 + vec2(0.0, 0.0004);
    vec3 prev = texture2D(uPrev, fuv).rgb;
    col = mix(col, max(col, prev * uFeedback), 0.55);
    col = mix(col, prev, 0.3 * uFeedback);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const outFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex; uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec3 c = texture2D(uTex, vUv).rgb;
    float v = smoothstep(1.25, 0.35, length(vUv - 0.5) * 1.6);
    c *= mix(0.55, 1.0, v);
    c += (hash(vUv * 900.0 + uTime) - 0.5) * 0.035;
    gl_FragColor = vec4(c, 1.0);
  }
`;

export class Afterimage {
  constructor(canvas, { scale = env.lite ? 0.5 : 0.75 } = {}) {
    this.canvas = canvas;
    this.scale = scale;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(1);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.PlaneGeometry(2, 2);
    const opts = { type: THREE.HalfFloatType, depthBuffer: false };
    this.a = new THREE.WebGLRenderTarget(2, 2, opts);
    this.b = new THREE.WebGLRenderTarget(2, 2, opts);
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.mouseGoal = new THREE.Vector2(0.5, 0.5);
    this.push = 0; this.pushGoal = 0;
    this.field = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: fieldFrag,
      uniforms: {
        uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: this.mouse }, uPush: { value: 0 },
        uPrev: { value: null }, uFeedback: { value: 0.85 }, uBands: { value: 0 },
        uC0: { value: new THREE.Color() }, uC1: { value: new THREE.Color() }, uC2: { value: new THREE.Color() }, uAlt: { value: new THREE.Color() },
      },
    });
    this.out = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: outFrag, uniforms: { uTex: { value: null }, uTime: { value: 0 } } });
    this.fieldScene = new THREE.Scene(); this.fieldScene.add(new THREE.Mesh(geo, this.field));
    this.outScene = new THREE.Scene(); this.outScene.add(new THREE.Mesh(geo, this.out));
    this.time = 0;
    this.speed = 1;
    this.setStudy(0);

    this.onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseGoal.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      this.pushGoal = 1;
    };
    this.onLeave = () => { this.pushGoal = 0; };
    canvas.addEventListener('pointermove', this.onMove, { passive: true });
    canvas.addEventListener('pointerdown', this.onMove, { passive: true });
    canvas.addEventListener('pointerleave', this.onLeave);
    canvas.addEventListener('pointercancel', this.onLeave);
    this.resize();
  }

  setStudy(i) {
    const s = STUDIES[i];
    const u = this.field.uniforms;
    [u.uC0, u.uC1, u.uC2].forEach((un, k) => un.value.set(s.ramp[k]));
    u.uAlt.value.set(s.alt);
    u.uFeedback.value = s.feedback;
    u.uBands.value = s.bands;
    this.speed = s.speed;
  }

  resize() {
    const w = Math.max(2, this.canvas.clientWidth);
    const h = Math.max(2, this.canvas.clientHeight);
    this.renderer.setSize(w, h, false);
    const iw = Math.round(w * this.scale); const ih = Math.round(h * this.scale);
    this.a.setSize(iw, ih); this.b.setSize(iw, ih);
    this.field.uniforms.uRes.value.set(iw, ih);
  }

  /** Renders one frame at absolute time `t` seconds (used by stills capture too). */
  frame(dt) {
    this.time += dt * this.speed;
    this.mouse.lerp(this.mouseGoal, 0.08);
    this.push += (this.pushGoal - this.push) * 0.05;
    // autonomous drift when nobody touches it
    if (this.pushGoal === 0) {
      this.mouseGoal.set(0.5 + Math.sin(this.time * 0.21) * 0.3, 0.5 + Math.cos(this.time * 0.17) * 0.22);
    }
    const u = this.field.uniforms;
    u.uTime.value = this.time;
    u.uPush.value = Math.max(this.push, 0.35);
    u.uPrev.value = this.a.texture;
    this.renderer.setRenderTarget(this.b);
    this.renderer.render(this.fieldScene, this.camera);
    this.renderer.setRenderTarget(null);
    [this.a, this.b] = [this.b, this.a];
    this.out.uniforms.uTex.value = this.a.texture;
    this.out.uniforms.uTime.value = this.time;
    this.renderer.render(this.outScene, this.camera);
  }

  start() {
    if (this.running) return;
    this.running = true;
    let last = performance.now();
    this.renderer.setAnimationLoop((now) => { this.frame(Math.min((now - last) / 1000, 0.05)); last = now; });
  }
  stop() { this.running = false; this.renderer.setAnimationLoop(null); }
  destroy() {
    this.stop();
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerdown', this.onMove);
    this.canvas.removeEventListener('pointerleave', this.onLeave);
    this.canvas.removeEventListener('pointercancel', this.onLeave);
    this.a.dispose(); this.b.dispose(); this.field.dispose(); this.out.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

/** Mounts the piece + its study switcher into a case-study live block. */
export function mountAfterimage(block) {
  const canvas = block.querySelector('canvas');
  const controls = block.querySelector('[data-live-controls]');
  const piece = new Afterimage(canvas);
  controls.innerHTML = STUDIES.map((s, i) => `<button type="button" class="chip" data-study="${i}" aria-pressed="${i === 0}">${s.name}</button>`).join('');
  controls.addEventListener('click', (e) => {
    const b = e.target.closest('[data-study]');
    if (!b) return;
    controls.querySelectorAll('[data-study]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    piece.setStudy(+b.dataset.study);
  });
  const ro = new ResizeObserver(() => piece.resize());
  ro.observe(canvas);
  return {
    start: () => piece.start(),
    stop: () => piece.stop(),
    destroy: () => { ro.disconnect(); piece.destroy(); },
  };
}
