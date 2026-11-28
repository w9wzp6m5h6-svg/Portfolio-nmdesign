/**
 * Sneaker stage — real-time product viewer.
 *  - custom orbit controls (inertia, pitch limits, pinch / button / key zoom)
 *  - colourway changes through a scan-line sweep shader (no reload, no pop)
 *  - X-Ray view: fresnel shell + wireframe of the actual mesh
 *  - render-on-demand: the GPU sleeps when nothing moves
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { readVariants } from './variants.js';
import { env } from '../core/env.js';

const HOME = { theta: 0.62, phi: 1.2, radius: 2.15, target: new THREE.Vector3(0, 0.2, 0) };
const LIMITS = { phiMin: 0.42, phiMax: 1.5, rMin: 0.85, rMax: 3.1 };

function softboxEnvironment(renderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x0b0b0c);
  const panel = (w, h, pos, intensity) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(6, 2, [0, 5, 1], 2.2);
  panel(1, 5, [-4, 1.5, -1], 1.4);
  panel(1, 5, [4, 1.5, -2], 1.0);
  panel(3, 1.5, [0, 1, 5], 0.6);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.02).texture;
  pm.dispose();
  return tex;
}

function contactShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 64, 4, 128, 64, 124);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.scale(1, 0.5);
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  return t;
}

/** Wraps a MeshStandardMaterial with a left→right colour sweep between two base maps. */
function makeSweepMaterial(base, accent) {
  const mat = base.clone();
  const uniforms = {
    uMapB: { value: base.map },
    uProgress: { value: 0 },
    uMinX: { value: -1 },
    uMaxX: { value: 1 },
    uEdge: { value: new THREE.Color(accent) },
  };
  mat.userData.sweep = uniforms;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vSweepX;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSweepX = position.x;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uMapB; uniform float uProgress; uniform float uMinX; uniform float uMaxX; uniform vec3 uEdge;
        varying float vSweepX;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float sweepSpan = uMaxX - uMinX;
        float sweepFront = mix(uMinX - sweepSpan * 0.04, uMaxX + sweepSpan * 0.04, uProgress);
        float sweepT = smoothstep(sweepFront + sweepSpan * 0.004, sweepFront - sweepSpan * 0.004, vSweepX);
        vec4 sweepB = texture2D(uMapB, vMapUv);
        diffuseColor.rgb = diffuse * mix(sampledDiffuseColor.rgb, sweepB.rgb, sweepT);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float sweepLine = exp(-abs(vSweepX - sweepFront) / (sweepSpan * 0.006));
        totalEmissiveRadiance += uEdge * sweepLine * 1.6 * step(0.001, uProgress) * step(uProgress, 0.999);`);
  };
  mat.customProgramCacheKey = () => 'sweep';
  return mat;
}

function makeXrayMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color('#b9cdf0') } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity; uniform vec3 uColor;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);
        gl_FragColor = vec4(uColor * (0.02 + f * 0.62), 1.0) * uOpacity;
      }`,
  });
}

export class SneakerStage {
  constructor(canvas, { accent = '#ff4f2b', onFrame } = {}) {
    this.canvas = canvas;
    this.onFrame = onFrame;
    this.running = false;
    this.dirty = 4;              // frames left to render
    this.interacted = false;
    this.mode = 'studio';

    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !env.lite || env.dpr < 2, powerPreference: 'high-performance' });
    r.setPixelRatio(env.dpr);
    r.toneMapping = THREE.AgXToneMapping;
    r.toneMappingExposure = 1.05;
    r.setClearColor(0x000000, 0);
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.scene.environment = softboxEnvironment(r);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1.5, 6, 2.5);
    const rim = new THREE.DirectionalLight(0xffffff, 1.2);
    rim.position.set(-3, 2, -4);
    this.scene.add(key, rim);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.35, 0.62),
      new THREE.MeshBasicMaterial({ map: contactShadowTexture(), transparent: true, depthWrite: false, opacity: 0.6 })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.002;
    this.scene.add(this.shadow);

    this.accent = accent;
    this.sph = { ...HOME };
    this.goal = { ...HOME };
    this.target = HOME.target.clone();
    this.targetGoal = HOME.target.clone();
    this.vel = { t: 0, p: 0 };
    this.anim = { sweep: null, xray: 0, xrayGoal: 0 };
    this.clock = new THREE.Clock();

    this.bindControls();
  }

  /**
   * Loads any GLB. Resolves with the colourway names the stage can sweep between
   * (empty when the model has no KHR_materials_variants — the UI then hides them).
   * @param {{ rotation?: number[] }} opts — orientation fix so the toe points to +x
   */
  async load(url, onProgress, { rotation } = {}) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const progress = (e) => e.total && onProgress?.(e.loaded / e.total);
    let gltf;
    if (url.endsWith('.json')) {
      // packed model ({ "glb": "<base64>" }) for hosts that do not serve .glb files
      const text = await new THREE.FileLoader().loadAsync(url, progress);
      const bin = Uint8Array.from(atob(JSON.parse(text).glb), (ch) => ch.charCodeAt(0));
      gltf = await loader.parseAsync(bin.buffer, '');
    } else {
      gltf = await loader.loadAsync(url, progress);
    }
    this.variantsApi = await readVariants(gltf);

    // fit: length 1, resting on the floor, centred
    const root = gltf.scene;
    if (rotation) root.rotation.set(...rotation);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    root.scale.multiplyScalar(1 / Math.max(size.x, size.y, size.z));
    box.setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    root.position.set(root.position.x - c.x, root.position.y - box.min.y, root.position.z - c.z);

    this.meshes = [];
    root.traverse((o) => { if (o.isMesh) this.meshes.push(o); });

    // colourway sweep: available for single-mesh models with material variants
    this.variantMaps = {};
    this.currentVariant = null;
    const single = this.meshes.length === 1 ? this.meshes[0] : null;
    let names = [];
    if (single && this.variantsApi.names.length && single.material.map) {
      single.geometry.computeBoundingBox();
      const gb = single.geometry.boundingBox;
      for (const name of this.variantsApi.names) {
        const m = (await this.variantsApi.materialsFor(name)).get(single);
        if (m?.map) this.variantMaps[name] = m.map;
      }
      this.sweepMat = makeSweepMaterial(single.material, this.accent);
      this.sweepMat.userData.sweep.uMinX.value = gb.min.x;
      this.sweepMat.userData.sweep.uMaxX.value = gb.max.x;
      single.material = this.sweepMat;
      names = Object.keys(this.variantMaps);
    }

    // studio materials (for the X-Ray crossfade) + X-Ray shell and wireframe per mesh
    this.studioMats = [...new Set(this.meshes.flatMap((m) => (Array.isArray(m.material) ? m.material : [m.material])))];
    this.xrayMat = makeXrayMaterial();
    this.wireMat = new THREE.MeshBasicMaterial({ color: 0xdfe8ff, wireframe: true, transparent: true, opacity: 0, depthWrite: false });
    this.xrayParts = [];
    for (const mesh of this.meshes) {
      const shell = new THREE.Mesh(mesh.geometry, this.xrayMat);
      const wire = new THREE.Mesh(mesh.geometry, this.wireMat);
      shell.visible = wire.visible = false;
      mesh.add(shell, wire);
      this.xrayParts.push(shell, wire);
    }

    this.scene.add(root);
    this.root = root;
    this.renderer.compile(this.scene, this.camera);
    this.resize();
    this.invalidate();
    return names;
  }

  setVariant(name, { instant = false } = {}) {
    const map = this.variantMaps?.[name];
    if (!map || name === this.currentVariant) return;
    const u = this.sweepMat.userData.sweep;
    const first = this.currentVariant === null;
    this.currentVariant = name;
    if (first || instant || env.reducedMotion) {
      this.sweepMat.map = map; u.uMapB.value = map; u.uProgress.value = 0;
      this.sweepMat.needsUpdate = first;
      this.invalidate();
      return;
    }
    // finish any running sweep first
    if (this.anim.sweep) { this.sweepMat.map = u.uMapB.value; }
    u.uMapB.value = map;
    u.uProgress.value = 0;
    this.anim.sweep = { start: performance.now(), duration: 1250 }; // wall-clock: same speed on slow GPUs
  }

  setMode(mode) {
    this.mode = mode;
    this.anim.xrayGoal = mode === 'xray' ? 1 : 0;
    this.interacted = true;
    this.invalidate();
  }

  focus(spot) {
    const p = new THREE.Vector3(...spot.pos);
    const n = new THREE.Vector3(...spot.normal).normalize();
    this.targetGoal.copy(p).multiplyScalar(0.7).add(new THREE.Vector3(0, 0.06, 0));
    this.goal.theta = Math.atan2(n.x, n.z);
    this.goal.phi = THREE.MathUtils.clamp(Math.acos(THREE.MathUtils.clamp(n.y * 0.8, -1, 1)), LIMITS.phiMin, LIMITS.phiMax);
    this.goal.radius = 1.45;
    this.unwrapTheta();
    this.vel.t = this.vel.p = 0;
    this.interacted = true;
    this.invalidate();
  }

  reset() {
    this.targetGoal.copy(HOME.target);
    this.goal.theta = HOME.theta; this.goal.phi = HOME.phi; this.goal.radius = HOME.radius;
    this.unwrapTheta();
    this.vel.t = this.vel.p = 0;
    this.invalidate();
  }

  zoom(dir) {
    this.goal.radius = THREE.MathUtils.clamp(this.goal.radius * (dir > 0 ? 0.8 : 1.25), LIMITS.rMin, LIMITS.rMax);
    this.interacted = true;
    this.invalidate();
  }

  /** keeps the goal angle on the closest turn so focus never spins the long way round */
  unwrapTheta() {
    const d = this.goal.theta - this.sph.theta;
    this.goal.theta -= Math.round(d / (Math.PI * 2)) * Math.PI * 2;
  }

  bindControls() {
    const el = this.canvas;
    const pointers = new Map();
    let pinchStart = 0;
    let radiusStart = 0;

    el.addEventListener('pointerdown', (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
      this.interacted = true;
      this.onInteract?.();
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        radiusStart = this.goal.radius;
      }
    });
    el.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX; prev.y = e.clientY;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart > 0) this.goal.radius = THREE.MathUtils.clamp(radiusStart * (pinchStart / d), LIMITS.rMin, LIMITS.rMax);
      } else {
        const k = 5.5 / el.clientWidth;
        this.vel.t = -dx * k;
        this.vel.p = e.pointerType === 'touch' ? 0 : -dy * k * 0.6;
        this.goal.theta += this.vel.t;
        this.goal.phi = THREE.MathUtils.clamp(this.goal.phi + this.vel.p, LIMITS.phiMin, LIMITS.phiMax);
      }
      this.invalidate();
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      if (!pointers.size) el.classList.remove('is-dragging');
      pinchStart = 0;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);

    // keyboard: the canvas is focusable
    el.addEventListener('keydown', (e) => {
      const step = 0.2;
      const handled = {
        ArrowLeft: () => { this.goal.theta -= step; },
        ArrowRight: () => { this.goal.theta += step; },
        ArrowUp: () => { this.goal.phi = THREE.MathUtils.clamp(this.goal.phi - step / 2, LIMITS.phiMin, LIMITS.phiMax); },
        ArrowDown: () => { this.goal.phi = THREE.MathUtils.clamp(this.goal.phi + step / 2, LIMITS.phiMin, LIMITS.phiMax); },
        '+': () => this.zoom(1), '=': () => this.zoom(1), '-': () => this.zoom(-1),
      }[e.key];
      if (!handled) return;
      e.preventDefault();
      this.interacted = true;
      handled();
      this.invalidate();
    });
  }

  invalidate(frames = 2) { this.dirty = Math.max(this.dirty, frames); }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setPixelRatio(env.dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // narrow screens: pull the camera back so the whole shoe stays in frame
    this.camera.fov = w / h < 0.9 ? 40 : 30;
    // frame around the UI: subject shifts right on wide layouts (UI on the left),
    // and down on narrow ones (title floats over the top of the stage)
    const shiftX = w > 900 ? -0.08 * w : 0;
    const shiftY = w <= 900 ? -0.1 * h : 0;
    this.camera.setViewOffset(w, h, shiftX, shiftY, w, h);
    this.camera.updateProjectionMatrix();
    this.invalidate();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta();
    this.renderer.setAnimationLoop(() => this.tick());
  }
  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const ease = 1 - Math.pow(0.0009, dt); // frame-rate independent smoothing

    // invitation: a slow sway until the visitor takes control
    if (!this.interacted && !env.reducedMotion) {
      this.goal.theta = HOME.theta + Math.sin(t * 0.45) * 0.38;
      this.invalidate();
    }

    // inertia after release
    if (!this.canvas.classList.contains('is-dragging') && (Math.abs(this.vel.t) > 1e-4 || Math.abs(this.vel.p) > 1e-4)) {
      this.goal.theta += this.vel.t;
      this.goal.phi = THREE.MathUtils.clamp(this.goal.phi + this.vel.p, LIMITS.phiMin, LIMITS.phiMax);
      const decay = Math.pow(0.02, dt);
      this.vel.t *= decay; this.vel.p *= decay;
      this.invalidate();
    }

    const s = this.sph; const g = this.goal;
    s.theta += (g.theta - s.theta) * ease;
    s.phi += (g.phi - s.phi) * ease;
    s.radius += (g.radius - s.radius) * ease;
    this.target.lerp(this.targetGoal, ease);
    const moving = Math.abs(g.theta - s.theta) + Math.abs(g.phi - s.phi) + Math.abs(g.radius - s.radius) + this.target.distanceTo(this.targetGoal) > 1e-4;
    if (moving) this.invalidate();

    // colourway sweep
    if (this.anim.sweep) {
      const sw = this.anim.sweep;
      const u = this.sweepMat.userData.sweep;
      const p = Math.min((performance.now() - sw.start) / sw.duration, 1);
      u.uProgress.value = p < 0.5 ? 4 * p ** 3 : 1 - Math.pow(-2 * p + 2, 3) / 2;
      if (p >= 1) {
        this.sweepMat.map = u.uMapB.value;
        u.uProgress.value = 0;
        this.anim.sweep = null;
      }
      this.invalidate();
    }

    // x-ray crossfade
    const xr = this.anim;
    if (Math.abs(xr.xrayGoal - xr.xray) > 0.001) {
      xr.xray += (xr.xrayGoal - xr.xray) * (1 - Math.pow(0.002, dt));
      if (Math.abs(xr.xrayGoal - xr.xray) < 0.002) xr.xray = xr.xrayGoal;
      this.applyXray(xr.xray);
      this.invalidate();
    }

    if (this.dirty <= 0) return;
    this.dirty--;

    const sinPhi = Math.sin(s.phi);
    this.camera.position.set(
      this.target.x + s.radius * sinPhi * Math.sin(s.theta),
      this.target.y + s.radius * Math.cos(s.phi),
      this.target.z + s.radius * sinPhi * Math.cos(s.theta)
    );
    this.camera.lookAt(this.target);
    this.renderer.render(this.scene, this.camera);
    this.onFrame?.(this);
  }

  applyXray(x) {
    if (!this.meshes) return;
    const studio = 1 - x;
    for (const m of this.studioMats) {
      m.transparent = studio < 1;
      m.opacity = studio;
      m.depthWrite = studio > 0.5;
      m.visible = studio > 0.001;
    }
    for (const part of this.xrayParts) part.visible = x > 0.001;
    this.xrayMat.uniforms.uOpacity.value = x;
    this.wireMat.opacity = x * 0.09;
    this.shadow.material.opacity = 0.9 * (1 - x * 0.7);
  }

  /** Screen position (CSS px) + facing test for an anchor in model space. */
  project(pos, normal) {
    const p = new THREE.Vector3(...pos);
    const n = new THREE.Vector3(...normal).normalize();
    const toCam = this.camera.position.clone().sub(p).normalize();
    const facing = n.dot(toCam);
    p.project(this.camera);
    return {
      x: (p.x * 0.5 + 0.5) * this.canvas.clientWidth,
      y: (-p.y * 0.5 + 0.5) * this.canvas.clientHeight,
      visible: facing > 0.08 && p.z < 1,
    };
  }

  dispose() {
    this.stop();
    this.renderer.dispose();
  }
}
