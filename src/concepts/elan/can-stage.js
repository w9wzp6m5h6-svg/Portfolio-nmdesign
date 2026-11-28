/**
 * ÉLAN — la canette en 3D temps réel (Three.js).
 *  - géométrie procédurale (corps, fond embouti, col, sertissage, couvercle, languette) :
 *    aucun modèle à télécharger, la canette pèse quelques kilo-octets de code ;
 *  - aluminium : environnement studio à bandes verticales (longs reflets), étiquette
 *    imprimée vernie (clearcoat), métal brossé sur le dessus ;
 *  - contrôles : rotation libre à la souris ou au doigt avec inertie, inclinaison,
 *    zoom (boutons, pincement, Ctrl + molette, double clic), vues prédéfinies, clavier ;
 *  - changement de saveur : l'étiquette se remplit de bas en haut (shader), la canette
 *    fait un demi-tour et un léger saut ;
 *  - entrée : la canette monte dans la scène, tourne, se pose, puis flotte doucement ;
 *  - arrêt complet hors écran ; tout est libéré à la fermeture (dispose).
 */
import * as THREE from 'three';
import { env } from '../../core/env.js';
import { VARIANTS, variantById } from './data.js';
import { drawLabel, loadLabelFonts } from './label.js';

const R = 0.5;
const Y0 = 0.16;
const Y1 = 2.18;
const MID = 1.24;
const LABEL_ASPECT = (Y1 - Y0) / (2 * Math.PI * R);
const DIST = { min: 4.3, home: 7.6, max: 10 };
const PITCH = 1.25;
const VIEWS = {
  front: { yaw: 0, pitch: 0 },
  back: { yaw: Math.PI, pitch: 0 },
  top: { yaw: 0.4, pitch: 0.95 },
  side: { yaw: Math.PI / 2, pitch: 0.12 },
};

function studioEnvironment(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x4a4c52);
  const panel = (w, h, pos, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 1, 0);
    scene.add(m);
  };
  panel(1.2, 10, [-4.4, 1.5, 2.6], 5.5);  // grande bande à gauche : le reflet principal
  panel(0.7, 10, [4.6, 1.5, 1.2], 3.4);   // bande fine à droite
  panel(8, 4, [0, 7, 0.5], 2.6);          // plafond
  panel(7, 4, [0, 1.2, 7], 1.15);         // débouché face caméra
  panel(2.4, 9, [-1.8, 1.5, -6], 2.0);    // contre-jour
  panel(9, 2, [0, -3, 2], 0.6);           // sol clair
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, 0.035).texture;
  pm.dispose();
  scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return tex;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 6, 128, 128, 126);
  grad.addColorStop(0, 'rgba(0,0,0,0.75)');
  grad.addColorStop(0.35, 'rgba(0,0,0,0.38)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/** Matériau d'étiquette : remplissage de bas en haut entre deux impressions. */
function labelMaterial() {
  const mat = new THREE.MeshPhysicalMaterial({ metalness: 0.16, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.1 });
  const u = { uMapB: { value: null }, uProgress: { value: 0 }, uEdge: { value: new THREE.Color('#ffffff') } };
  mat.userData.u = u;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uMapB; uniform float uProgress; uniform vec3 uEdge;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float wave = sin(vMapUv.x * 6.2831853 * 3.0 + uProgress * 9.0) * 0.018 + sin(vMapUv.x * 6.2831853 * 7.0) * 0.006;
        float front = uProgress * 1.16 - 0.08;
        float fill = smoothstep(front + 0.006, front - 0.006, vMapUv.y + wave);
        vec4 inkB = texture2D(uMapB, vMapUv);
        diffuseColor.rgb = mix(diffuseColor.rgb, inkB.rgb, fill * step(0.0001, uProgress));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float edgeLine = exp(-abs(vMapUv.y + wave - front) * 160.0) * step(0.0001, uProgress) * step(uProgress, 0.9999);
        totalEmissiveRadiance += uEdge * edgeLine * 0.9;`);
  };
  mat.customProgramCacheKey = () => 'elan-label';
  return mat;
}

function lathe(points, seg, mat) {
  const geo = new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  return new THREE.Mesh(geo, mat);
}

function buildCan(seg, label) {
  const can = new THREE.Group();
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xdfe2e7, metalness: 1, roughness: 0.24, side: THREE.DoubleSide });
  const aluSoft = new THREE.MeshPhysicalMaterial({ color: 0xc9cdd4, metalness: 1, roughness: 0.42, side: THREE.DoubleSide });

  const bodyGeo = new THREE.CylinderGeometry(R, R, Y1 - Y0, seg, 1, true, Math.PI, Math.PI * 2);
  bodyGeo.translate(0, (Y0 + Y1) / 2, 0);
  can.add(new THREE.Mesh(bodyGeo, label));

  // fond embouti : dôme rentrant, pied, épaulement
  can.add(lathe([[0, 0.112], [0.12, 0.104], [0.24, 0.078], [0.33, 0.036], [0.368, 0.01], [0.39, 0], [0.414, 0.005], [0.448, 0.032], [0.478, 0.082], [0.495, 0.13], [R, Y0]], seg, alu));
  // col, sertissage, paroi intérieure, couvercle
  can.add(lathe([
    [R, Y1], [0.498, 2.215], [0.486, 2.262], [0.462, 2.312], [0.436, 2.36], [0.421, 2.39], [0.419, 2.405],
    [0.428, 2.414], [0.437, 2.428], [0.439, 2.448], [0.432, 2.463], [0.42, 2.467], [0.409, 2.458],
    [0.405, 2.44], [0.402, 2.418], [0.392, 2.405], [0.37, 2.41], [0.3, 2.416], [0.15, 2.419], [0.0, 2.42],
  ], seg, alu));

  // languette : anneau plat, rivet, ligne d'ouverture
  const tab = new THREE.Shape();
  tab.absarc(0.2, 0, 0.07, -Math.PI / 2, Math.PI / 2, false);
  tab.lineTo(-0.02, 0.07);
  tab.absarc(-0.02, 0, 0.07, Math.PI / 2, Math.PI * 1.5, false);
  tab.lineTo(0.2, -0.07);
  const hole = new THREE.Path();
  hole.absarc(0.19, 0, 0.034, -Math.PI / 2, Math.PI / 2, false);
  hole.lineTo(0.1, 0.034);
  hole.absarc(0.1, 0, 0.034, Math.PI / 2, Math.PI * 1.5, false);
  hole.lineTo(0.19, -0.034);
  tab.holes.push(hole);
  const tabGeo = new THREE.ExtrudeGeometry(tab, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 18 });
  tabGeo.rotateX(-Math.PI / 2);
  const tabMesh = new THREE.Mesh(tabGeo, alu);
  tabMesh.position.set(-0.01, 2.426, 0);
  tabMesh.rotation.y = Math.PI * 0.5;
  can.add(tabMesh);
  const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.016, 24), aluSoft);
  rivet.position.set(0, 2.43, 0);
  can.add(rivet);
  const score = new THREE.Shape();
  score.moveTo(0, 0.16);
  score.bezierCurveTo(0.16, 0.16, 0.2, 0.02, 0.15, -0.06);
  score.bezierCurveTo(0.1, -0.13, -0.1, -0.13, -0.15, -0.06);
  score.bezierCurveTo(-0.2, 0.02, -0.16, 0.16, 0, 0.16);
  const scoreGeo = new THREE.ShapeGeometry(score, 24);
  scoreGeo.rotateX(-Math.PI / 2);
  const scoreMesh = new THREE.Mesh(scoreGeo, aluSoft);
  scoreMesh.position.set(0, 2.4215, 0.2);
  scoreMesh.scale.set(0.92, 1, 0.92);
  can.add(scoreMesh);

  can.position.y = -MID; // pivot au centre de la canette
  return { can, materials: [alu, aluSoft] };
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class CanStage {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ variant?: string, onVariant?: Function, onReady?: Function, still?: boolean }} opts
   */
  constructor(canvas, { variant = VARIANTS[0].id, onReady, still = false } = {}) {
    this.canvas = canvas;
    this.onReady = onReady;
    this.still = still;
    this.running = false;
    this.ready = false;
    this.textures = new Map();
    this.variant = variant;

    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !env.lite || env.dpr < 2, powerPreference: 'high-performance', preserveDrawingBuffer: still });
    r.setPixelRatio(env.dpr);
    r.toneMapping = THREE.NeutralToneMapping; // garde des couleurs franches (orange, cobalt)
    r.toneMappingExposure = 1.12;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setClearColor(0x000000, 0);
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.envTex = studioEnvironment(r);
    this.scene.environment = this.envTex;
    this.scene.environmentIntensity = 1.05;
    this.camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-3, 5, 4);
    const fill = new THREE.DirectionalLight(0xffffff, 0.7);
    fill.position.set(4, 1, 3);
    this.scene.add(key, fill, new THREE.HemisphereLight(0xffffff, 0xd8d2cc, 0.55));

    this.label = labelMaterial();
    const seg = env.lite ? 72 : 120;
    const { can, materials } = buildCan(seg, this.label);
    this.metal = materials;
    this.pivot = new THREE.Group();
    this.pivot.add(can);
    this.pivot.position.y = MID + 0.18;
    this.scene.add(this.pivot);

    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0 }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = -0.02;
    this.scene.add(this.shadow);

    this.s = { yaw: -0.5, pitch: 0.06, dist: DIST.home, lift: 0 };
    this.g = { yaw: -0.5, pitch: 0.06, dist: DIST.home };
    this.vel = { yaw: 0, pitch: 0 };
    this.anim = { enter: still || env.reducedMotion ? 1 : 0, swap: null, hop: 0 };
    this.interacted = false;
    this.clock = new THREE.Clock();
    this.t = 0;
    this.bind();
  }

  async init() {
    await loadLabelFonts();
    const tex = this.textureFor(this.variant);
    this.label.map = tex;
    this.label.userData.u.uMapB.value = tex;
    this.label.needsUpdate = true;
    this.resize();
    this.renderer.compile(this.scene, this.camera);
    this.ready = true;
    this.renderer.render(this.scene, this.camera);
    this.onReady?.(this);
    return this;
  }

  textureFor(id) {
    if (this.textures.has(id)) return this.textures.get(id);
    const tex = new THREE.CanvasTexture(drawLabel(variantById(id), env.lite ? 1024 : 2048, LABEL_ASPECT));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    this.textures.set(id, tex);
    return tex;
  }

  /** Change de saveur : remplissage de l'étiquette + demi-tour. */
  setVariant(id, { instant = false } = {}) {
    if (!this.ready || id === this.variant) return;
    this.variant = id;
    const tex = this.textureFor(id);
    const u = this.label.userData.u;
    if (instant || env.reducedMotion) {
      this.label.map = tex; u.uMapB.value = tex; u.uProgress.value = 0;
      this.anim.swap = null;
      return;
    }
    if (this.anim.swap) this.label.map = u.uMapB.value; // termine le remplissage en cours
    u.uMapB.value = tex;
    u.uEdge.value.set(variantById(id).accent);
    u.uProgress.value = 0;
    this.anim.swap = { start: performance.now(), duration: 1300 };
    this.g.yaw = Math.round(this.g.yaw / (Math.PI * 2)) * Math.PI * 2 + Math.PI * 2; // un tour complet, retour de face
    this.g.pitch = 0.06;
    this.vel.yaw = this.vel.pitch = 0;
  }

  view(name) {
    const v = VIEWS[name];
    if (!v) return;
    const turn = Math.round((this.g.yaw - v.yaw) / (Math.PI * 2)) * Math.PI * 2;
    this.g.yaw = v.yaw + turn;
    this.g.pitch = v.pitch;
    this.vel.yaw = this.vel.pitch = 0;
    this.interacted = true;
  }

  zoom(dir) {
    this.g.dist = THREE.MathUtils.clamp(this.g.dist * (dir > 0 ? 0.8 : 1.25), DIST.min, DIST.max);
    this.interacted = true;
  }

  reset() {
    this.view('front');
    this.g.dist = DIST.home;
  }

  bind() {
    const el = this.canvas;
    const pointers = new Map();
    let pinch = 0; let distStart = 0;
    this.listeners = [];
    const on = (t, type, fn, o) => { t.addEventListener(type, fn, o); this.listeners.push([t, type, fn, o]); };

    on(el, 'pointerdown', (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('is-dragging');
      this.interacted = true;
      this.vel.yaw = this.vel.pitch = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
        distStart = this.g.dist;
      }
    });
    on(el, 'pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x; const dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch > 0) this.g.dist = THREE.MathUtils.clamp(distStart * (pinch / d), DIST.min, DIST.max);
        return;
      }
      const k = 6.2 / Math.max(el.clientWidth, 320);
      this.vel.yaw = dx * k;
      this.vel.pitch = e.pointerType === 'touch' ? 0 : dy * k * 0.7;
      this.g.yaw += this.vel.yaw;
      this.g.pitch = THREE.MathUtils.clamp(this.g.pitch + this.vel.pitch, -PITCH, PITCH);
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      if (!pointers.size) el.classList.remove('is-dragging');
      pinch = 0;
    };
    on(el, 'pointerup', end);
    on(el, 'pointercancel', end);
    on(el, 'lostpointercapture', end);
    // Ctrl + molette (et pincement des pavés tactiles) : zoom ; la molette seule fait défiler la page
    on(el, 'wheel', (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      this.g.dist = THREE.MathUtils.clamp(this.g.dist * Math.exp(e.deltaY * 0.01), DIST.min, DIST.max);
      this.interacted = true;
    }, { passive: false });
    on(el, 'dblclick', () => { this.g.dist = this.g.dist > DIST.home * 0.8 ? DIST.min + 0.6 : DIST.home; this.interacted = true; });
    on(el, 'keydown', (e) => {
      const step = 0.26;
      const act = {
        ArrowLeft: () => { this.g.yaw -= step; },
        ArrowRight: () => { this.g.yaw += step; },
        ArrowUp: () => { this.g.pitch = THREE.MathUtils.clamp(this.g.pitch + step / 2, -PITCH, PITCH); },
        ArrowDown: () => { this.g.pitch = THREE.MathUtils.clamp(this.g.pitch - step / 2, -PITCH, PITCH); },
        '+': () => this.zoom(1), '=': () => this.zoom(1), '-': () => this.zoom(-1), 0: () => this.reset(),
      }[e.key];
      if (!act) return;
      e.preventDefault();
      this.interacted = true;
      act();
    });
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(el);
  }

  resize() {
    const w = this.canvas.clientWidth; const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setPixelRatio(env.dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // écrans étroits : on recule pour garder toute la canette
    this.fit = w / h < 0.75 ? 1.25 : 1;
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this.running || !this.ready) return;
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
    this.t += dt;
    const calm = env.reducedMotion || this.frozen;
    const a = this.anim;

    // entrée : monte, tourne, se pose
    if (a.enter < 1) a.enter = Math.min(1, a.enter + dt / 1.7);
    const e = easeOut(a.enter);

    // invitation tant que personne n'a touché la canette
    if (!this.interacted && !calm && a.enter >= 1 && !a.swap) this.g.yaw += dt * 0.32;

    // inertie
    if (!this.canvas.classList.contains('is-dragging') && (Math.abs(this.vel.yaw) > 1e-4 || Math.abs(this.vel.pitch) > 1e-4)) {
      this.g.yaw += this.vel.yaw;
      this.g.pitch = THREE.MathUtils.clamp(this.g.pitch + this.vel.pitch, -PITCH, PITCH);
      const decay = Math.pow(0.035, dt);
      this.vel.yaw *= decay; this.vel.pitch *= decay;
    }

    const k = 1 - Math.pow(0.0015, dt);
    const s = this.s; const g = this.g;
    s.yaw += (g.yaw - s.yaw) * k;
    s.pitch += (g.pitch - s.pitch) * k;
    s.dist += (g.dist - s.dist) * k;

    // changement de saveur
    let hop = 0;
    if (a.swap) {
      const p = Math.min((performance.now() - a.swap.start) / a.swap.duration, 1);
      this.label.userData.u.uProgress.value = easeInOut(p);
      hop = Math.sin(Math.PI * Math.min(p * 1.4, 1)) * 0.16;
      if (p >= 1) {
        this.label.map = this.label.userData.u.uMapB.value;
        this.label.userData.u.uProgress.value = 0;
        a.swap = null;
      }
    }

    const float = calm ? 0 : Math.sin(this.t * 1.25) * 0.045;
    const sway = calm ? 0 : Math.sin(this.t * 0.8) * 0.025;
    const rise = (1 - e) * -3.2;
    this.pivot.position.y = MID + 0.18 + float + hop + rise;
    this.pivot.rotation.set(s.pitch + (1 - e) * 0.6, s.yaw + (1 - e) * -3.4, sway + (1 - e) * 0.25, 'XYZ');
    const scale = 0.88 + e * 0.12;
    this.pivot.scale.setScalar(scale);

    // ombre de contact : plus nette quand la canette est basse et droite
    const height = Math.max(0, float + hop + 0.18 + Math.abs(s.pitch) * 0.35);
    this.shadow.material.opacity = e * THREE.MathUtils.clamp(0.62 - height * 0.9, 0.18, 0.62);
    this.shadow.scale.setScalar(0.82 + height * 0.9 + Math.abs(s.pitch) * 0.3);

    const d = s.dist * (this.fit || 1);
    const aim = this.aim || 0;
    this.camera.position.set(0, MID + 0.35 + d * 0.06 + aim, d);
    this.camera.lookAt(0, MID + 0.08 + aim, 0);
    this.renderer.render(this.scene, this.camera);
  }

  /** Image fixe (outils de rendu) : saveur, angle, sans animation. */
  renderStill({ yaw = 0, pitch = 0.06, dist = DIST.home, aim = 0 } = {}) {
    this.aim = aim;
    this.s.yaw = this.g.yaw = yaw; this.s.pitch = this.g.pitch = pitch; this.s.dist = this.g.dist = dist;
    this.anim.enter = 1;
    this.interacted = true;
    this.frozen = true; // ni flottement ni balancement
    this.tick();
  }

  dispose() {
    this.stop();
    this.ro?.disconnect();
    this.listeners?.forEach(([t, type, fn, o]) => t.removeEventListener(type, fn, o));
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      const m = o.material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
    });
    this.shadow.material.map?.dispose();
    this.textures.forEach((t) => t.dispose());
    this.textures.clear();
    this.envTex.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss?.();
  }
}

export { VARIANTS, VIEWS };
