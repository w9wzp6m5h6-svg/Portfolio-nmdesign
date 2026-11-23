/**
 * Hero name in WebGL: the DOM title is redrawn into a texture at the exact same
 * position, then displaced by a ping-pong "flowmap" fed by cursor velocity.
 * The result reads like ink pushed by a finger — then settles back.
 */
import * as THREE from 'three';
import { env } from '../core/env.js';

const quadVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const flowFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uPrev;
  uniform vec2 uMouse;
  uniform vec2 uVelocity;
  uniform float uAspect;
  uniform float uFalloff;
  uniform float uDissipation;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(uPrev, vUv) * uDissipation;
    vec2 cursor = vUv - uMouse;
    cursor.x *= uAspect;
    vec3 stamp = vec3(uVelocity, 1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0));
    float falloff = smoothstep(uFalloff, 0.0, length(cursor));
    color.rgb = mix(color.rgb, stamp, vec3(falloff));
    gl_FragColor = vec4(color.rgb, 1.0);
  }
`;

const textFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uText;
  uniform sampler2D uFlow;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uStrength;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec3 flow = texture2D(uFlow, vUv).rgb;
    vec2 disp = flow.xy * uStrength;
    vec2 uv = vUv - disp;
    // a hint of dispersion, only where the flow is strong
    float spread = length(disp) * 0.35;
    float a  = texture2D(uText, uv).a;
    float aR = texture2D(uText, uv + vec2(spread, 0.0)).a;
    float aB = texture2D(uText, uv - vec2(spread, 0.0)).a;
    float glow = smoothstep(0.05, 0.6, flow.z);
    vec3 col = uColor;
    col = mix(col, uAccent, glow * 0.55 * (aR - aB + 0.5) * step(0.001, spread));
    float alpha = max(a, max(aR, aB) * glow);
    // fine film grain so the flat type feels printed, not rendered
    float g = (hash(vUv * 1000.0 + uTime) - 0.5) * 0.06;
    gl_FragColor = vec4((col + g) * alpha, alpha);
  }
`;

export class HeroGL {
  /** @param {HTMLCanvasElement} canvas @param {HTMLElement} hero @param {HTMLElement[]} words */
  constructor(canvas, hero, words) {
    this.canvas = canvas;
    this.hero = hero;
    this.words = words;
    this.running = false;
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.lastMouse = new THREE.Vector2(0.5, 0.5);
    this.velocity = new THREE.Vector2();
    this.lastMove = 0;
    this.idleT = 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(env.dpr);

    const geo = new THREE.PlaneGeometry(2, 2);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // flowmap ping-pong
    const size = env.lite ? 96 : 160;
    const rtOpts = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.flowA = new THREE.WebGLRenderTarget(size, size, rtOpts);
    this.flowB = new THREE.WebGLRenderTarget(size, size, rtOpts);
    this.flowMat = new THREE.ShaderMaterial({
      vertexShader: quadVert, fragmentShader: flowFrag,
      uniforms: {
        uPrev: { value: this.flowA.texture },
        uMouse: { value: this.mouse },
        uVelocity: { value: this.velocity },
        uAspect: { value: 1 },
        uFalloff: { value: 0.22 },
        uDissipation: { value: 0.955 },
      },
    });
    this.flowScene = new THREE.Scene();
    this.flowScene.add(new THREE.Mesh(geo, this.flowMat));

    // text
    this.textCanvas = document.createElement('canvas');
    this.textTex = new THREE.CanvasTexture(this.textCanvas);
    this.textTex.minFilter = THREE.LinearFilter;
    this.textTex.generateMipmaps = false;
    this.textMat = new THREE.ShaderMaterial({
      vertexShader: quadVert, fragmentShader: textFrag, transparent: true,
      uniforms: {
        uText: { value: this.textTex },
        uFlow: { value: this.flowB.texture },
        uColor: { value: new THREE.Color('#edebe5') },
        uAccent: { value: new THREE.Color('#ff4f2b') },
        uStrength: { value: 0.045 },
        uTime: { value: 0 },
      },
    });
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.Mesh(geo, this.textMat));

    this.onPointer = this.onPointer.bind(this);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    this.resize();
  }

  /** Redraws the DOM words into the texture at their exact on-screen position. */
  drawText() {
    const rect = this.hero.getBoundingClientRect();
    const dpr = env.dpr;
    const c = this.textCanvas;
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'alphabetic';

    for (const word of this.words) {
      const cs = getComputedStyle(word);
      const fs = parseFloat(cs.fontSize) * dpr;
      ctx.font = `800 expanded ${fs}px ${cs.fontFamily}`;
      if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
      if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : `${parseFloat(cs.letterSpacing) * dpr}px`;
      const text = word.textContent.toUpperCase();
      const r = word.getBoundingClientRect();
      // baseline: DOM box top + ascent of the em box (line-height is tight, align by measured metrics)
      const m = ctx.measureText(text);
      const targetW = r.width * dpr;
      const scaleX = m.width > 0 ? targetW / m.width : 1; // corrects any width-axis mismatch
      const x = (r.left - rect.left) * dpr;
      const boxTop = (r.top - rect.top) * dpr;
      const asc = m.fontBoundingBoxAscent ?? fs * 0.9;
      const desc = m.fontBoundingBoxDescent ?? fs * 0.25;
      const contentH = asc + desc;
      const y = boxTop + (r.height * dpr - contentH) / 2 + asc;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(Math.abs(scaleX - 1) < 0.15 ? scaleX : 1, 1);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
    this.textTex.needsUpdate = true;
  }

  resize() {
    const rect = this.hero.getBoundingClientRect();
    this.renderer.setPixelRatio(env.dpr);
    this.renderer.setSize(rect.width, rect.height, false);
    this.flowMat.uniforms.uAspect.value = rect.width / rect.height;
    this.drawText();
  }

  onPointer(e) {
    if (!this.running) return;
    const r = this.canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    this.mouse.set(x, y);
    this.lastMove = performance.now();
    this.onMove?.(x, 1 - y);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.renderer.setAnimationLoop((t) => this.tick(t));
  }
  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  tick(t) {
    const time = t / 1000;
    // idle drift: when nobody is moving, a slow ghost cursor brushes the name
    if (t - this.lastMove > 2800) {
      this.idleT += 0.0045;
      const nameBand = 0.18;
      this.mouse.set(0.5 + Math.sin(this.idleT * 1.3) * 0.42, nameBand + Math.sin(this.idleT * 2.1) * 0.1);
    }
    const vx = (this.mouse.x - this.lastMouse.x) * 9;
    const vy = (this.mouse.y - this.lastMouse.y) * 9;
    this.velocity.x += (vx - this.velocity.x) * 0.25;
    this.velocity.y += (vy - this.velocity.y) * 0.25;
    this.lastMouse.copy(this.mouse);

    // flow pass (ping-pong)
    this.flowMat.uniforms.uPrev.value = this.flowA.texture;
    this.renderer.setRenderTarget(this.flowB);
    this.renderer.render(this.flowScene, this.camera);
    this.renderer.setRenderTarget(null);
    [this.flowA, this.flowB] = [this.flowB, this.flowA];
    this.textMat.uniforms.uFlow.value = this.flowA.texture;

    this.textMat.uniforms.uTime.value = time;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.stop();
    window.removeEventListener('pointermove', this.onPointer);
    this.flowA.dispose(); this.flowB.dispose();
    this.textTex.dispose(); this.renderer.dispose();
  }
}
