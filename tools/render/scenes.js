/**
 * Art-directed scenes for the project key visuals.
 * Each scene builds a studio (environment reflections + key/rim lights),
 * places one or more models and frames the camera like a product shoot.
 */

/* ---------- shared helpers ---------- */

/** Builds a softbox environment: emissive panels around an object, baked into a PMREM. */
function softboxEnv({ THREE, renderer }, { ambient = 0x0b0b0c, panels = [] } = {}) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(ambient);
  for (const p of panels) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color ?? 0xffffff).multiplyScalar(p.intensity ?? 1), side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), mat);
    m.position.set(...p.pos);
    m.lookAt(0, p.lookY ?? 0, 0);
    env.add(m);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  return pm.fromScene(env, 0.02).texture;
}

/** Screen-space vertical/radial gradient backdrop drawn into a canvas texture. */
function gradientBg({ THREE, W, H }, { inner, outer, cx = 0.5, cy = 0.45, r = 0.85, grain = 0.0 }) {
  const c = document.createElement('canvas');
  c.width = Math.min(W, 1600); c.height = Math.round(c.width * H / W);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(c.width * cx, c.height * cy, 0, c.width * cx, c.height * cy, Math.max(c.width, c.height) * r);
  grad.addColorStop(0, inner); grad.addColorStop(1, outer);
  g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
  if (grain) {
    const d = g.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 255 * grain;
      d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n;
    }
    g.putImageData(d, 0, 0);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function look(camera, pos, target, fov) {
  if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.position.set(...pos);
  camera.lookAt(...target);
}

function rimLight(THREE, intensity, pos, color = 0xffffff) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.set(...pos);
  return l;
}

async function applyVariant(g, name) {
  const map = await g.variants.materialsFor(name);
  for (const [mesh, mat] of map) mesh.material = mat;
}

/* ---------- sneaker ---------- */

async function shoeBase(ctx, { variant = 'street', bg = ['#2a2b2e', '#08080a'] } = {}) {
  const { THREE, scene, load, fit, shadowFloor, keyLight } = ctx;
  scene.environment = softboxEnv(ctx, {
    panels: [
      { w: 6, h: 2, pos: [0, 5, 1], intensity: 2.2 },
      { w: 1, h: 5, pos: [-4, 1.5, -1], intensity: 1.4 },
      { w: 1, h: 5, pos: [4, 1.5, -2], intensity: 1.0 },
      { w: 3, h: 1.5, pos: [0, 1, 5], intensity: 0.5 },
    ],
  });
  scene.background = gradientBg(ctx, { inner: bg[0], outer: bg[1], grain: 0.025 });
  const g = await load('MaterialsVariantsShoe');
  await applyVariant(g, variant);
  fit(g.scene, 1);
  scene.add(g.scene);
  const floor = shadowFloor(0.55);
  scene.add(floor);
  const key = keyLight(2.2, [1.5, 6, 2.5]);
  key.shadow.radius = 14;
  scene.add(key, rimLight(THREE, 1.4, [-3, 2, -4]));
  return { g, floor, key };
}

/* ---------- car ---------- */

async function carBase(ctx, { variant = 'Torched Graphite', bg = ['#202124', '#060607'], envBoost = 1 } = {}) {
  const { THREE, scene, load, fit, shadowFloor, keyLight } = ctx;
  scene.environment = softboxEnv(ctx, {
    panels: [
      { w: 12, h: 1.6, pos: [0, 6, 0], intensity: 6 * envBoost },
      { w: 12, h: 0.7, pos: [0, 3, 6], intensity: 5 * envBoost },
      { w: 12, h: 0.7, pos: [0, 3, -6], intensity: 4 * envBoost },
      { w: 0.8, h: 4, pos: [-7, 1.2, 0], intensity: 3 * envBoost },
      { w: 0.8, h: 4, pos: [7, 1.2, 0], intensity: 3 * envBoost },
    ],
  });
  scene.background = gradientBg(ctx, { inner: bg[0], outer: bg[1], cy: 0.55, grain: 0.02 });
  const g = await load('CarConcept');
  await applyVariant(g, variant);
  // keep third-party marks out of frame: plate, wheel emblem, printed tyre sidewalls
  const rubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
  g.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (/License|Emblem/i.test(o.name)) o.visible = false;
    if (/Tireside/i.test(o.material?.name)) o.material = rubber;
  });
  fit(g.scene, 4.4);
  scene.add(g.scene);
  const floor = shadowFloor(0.7);
  scene.add(floor);
  const key = keyLight(1.6, [0.5, 8, 1]);
  key.shadow.radius = 20;
  const c = key.shadow.camera; c.left = -4; c.right = 4; c.top = 4; c.bottom = -4; c.updateProjectionMatrix();
  scene.add(key);
  return { g, key };
}

/* ---------- eyewear ---------- */

async function glassesBase(ctx, { bg = ['#efe9df', '#d8cfc1'] } = {}) {
  const { THREE, scene, load, fit, shadowFloor, keyLight } = ctx;
  scene.environment = softboxEnv(ctx, {
    ambient: 0x2a2622,
    panels: [
      { w: 5, h: 3, pos: [2, 5, 3], intensity: 2.4, color: 0xfff4e6 },
      { w: 2, h: 4, pos: [-4, 2, -1], intensity: 1.2, color: 0xffe2c4 },
      { w: 6, h: 1, pos: [0, 0.4, 5], intensity: 0.8 },
    ],
  });
  scene.background = gradientBg(ctx, { inner: bg[0], outer: bg[1], cy: 0.4, grain: 0.02 });
  const g = await load('SunglassesKhronos');
  // temples carry printed third-party marks → replace with plain polished acetate
  const acetate = new THREE.MeshPhysicalMaterial({ color: 0x0d0c0b, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  g.scene.traverse((o) => { if (o.isMesh && /Temple|Earhook/i.test(o.name)) o.material = acetate; });
  fit(g.scene, 1);
  scene.add(g.scene);
  const floor = shadowFloor(0.42);
  scene.add(floor);
  // low warm "sun": long, crisp shadow — a summer campaign look
  const sun = keyLight(3.2, [-4, 3.2, 2.2], 0xfff1dc, 4096, 2);
  scene.add(sun);
  return { g, floor, sun };
}

/* ---------- interior ---------- */

async function room(ctx, { wall = 0xd9d3ca, floor = 0xbdb4a7 } = {}) {
  const { THREE, scene } = ctx;
  scene.environment = softboxEnv(ctx, {
    ambient: 0x3b3833,
    panels: [
      { w: 4, h: 3, pos: [-5, 3, 2], intensity: 2.0, color: 0xfff0dc },
      { w: 8, h: 4, pos: [0, 6, 0], intensity: 0.6 },
    ],
  });
  scene.background = new THREE.Color(wall);
  const mat = (c, r = 0.92) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), mat(floor, 0.8));
  fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), mat(wall));
  back.position.set(0, 6, -2.2); back.receiveShadow = true;
  // side wall with a tall window opening → shaped sunlight on floor + back wall
  const side = new THREE.Group();
  // segment helper: centre z, width along z, centre y, height
  const sw = (z, w, y, h) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, w), mat(wall));
    m.position.set(0, y, z); m.castShadow = true; m.receiveShadow = true; side.add(m);
  };
  // window opening: z ∈ [-1.6, 0.4], y ∈ [0.35, 3.4]
  sw(-6.8, 10.4, 6, 12);
  sw(6.2, 11.6, 6, 12);
  sw(-0.6, 2, 0.175, 0.35);
  sw(-0.6, 2, 7.7, 8.6);
  // mullion
  sw(-0.6, 0.06, 1.9, 3.1);
  side.position.set(-3.2, 0, 0);
  // skirting line on back wall for scale
  const skirting = new THREE.Mesh(new THREE.BoxGeometry(30, 0.08, 0.02), mat(0xcfc8bd));
  skirting.position.set(0, 0.04, -2.19);
  scene.add(fl, back, side, skirting);
  const sun = new THREE.DirectionalLight(0xffe3c0, 5.5);
  sun.position.set(-10, 5.2, 4.2);
  sun.target.position.set(0, 1.2, -1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.radius = 5; sun.shadow.blurSamples = 16; sun.shadow.bias = -0.0003;
  const c = sun.shadow.camera; c.left = -6; c.right = 6; c.top = 6; c.bottom = -6; c.near = 0.1; c.far = 40;
  const fill = new THREE.HemisphereLight(0xf4efe8, 0xa59a8b, 1.1);
  scene.add(sun, sun.target, fill);
  return { sun };
}

async function placeChair(ctx, variant, pos, rotY, size = 1) {
  const g = await ctx.load('SheenChair');
  if (variant) await applyVariant(g, variant);
  ctx.fit(g.scene, size);
  g.scene.position.x += pos[0]; g.scene.position.z += pos[2];
  g.scene.rotation.y = rotY;
  ctx.scene.add(g.scene);
  return g;
}
async function place(ctx, file, size, pos, rotY = 0) {
  const g = await ctx.load(file);
  ctx.fit(g.scene, size);
  g.scene.position.x += pos[0]; g.scene.position.z += pos[2];
  g.scene.rotation.y = rotY;
  ctx.scene.add(g.scene);
  return g;
}

/* ---------- scene list ---------- */

export const scenes = {
  /* 01 — Sneaker */
  async shoe_cover(ctx) {
    const { g } = await shoeBase(ctx, { variant: 'street' });
    g.scene.position.y += 0.16; // levitating product shot
    g.scene.rotation.set(0.08, -0.55, -0.12);
    look(ctx.camera, [0.05, 0.42, 1.95], [0.02, 0.27, 0], 28);
  },
  async shoe_profile(ctx) {
    const { g } = await shoeBase(ctx, { variant: 'street', bg: ['#1c1d20', '#050506'] });
    g.scene.rotation.y = 0;
    look(ctx.camera, [0, 0.2, 2.1], [0, 0.17, 0], 24);
  },
  async shoe_detail(ctx) {
    const { g } = await shoeBase(ctx, { variant: 'street' });
    g.scene.rotation.y = -0.9;
    look(ctx.camera, [0.18, 0.62, 0.62], [0.0, 0.3, -0.02], 26);
  },
  async shoe_beach(ctx) {
    const { g } = await shoeBase(ctx, { variant: 'beach', bg: ['#3a3434', '#0d0b0b'] });
    g.scene.rotation.y = 2.5;
    look(ctx.camera, [0.3, 0.9, 1.5], [0, 0.18, 0], 28);
  },
  async shoe_midnight(ctx) {
    const { g } = await shoeBase(ctx, { variant: 'midnight', bg: ['#16232c', '#05080a'] });
    g.scene.position.y += 0.1;
    g.scene.rotation.set(-0.1, 0.4, 0.18);
    look(ctx.camera, [0, 0.36, 1.85], [0, 0.26, 0], 28);
  },

  /* 03 — Automotive */
  async car_cover(ctx) {
    const { g } = await carBase(ctx, { variant: 'Torched Graphite' });
    g.scene.rotation.y = -0.75;
    look(ctx.camera, [0.4, 0.7, 7.6], [0.1, 0.55, 0], 28);
  },
  async car_side(ctx) {
    const { g } = await carBase(ctx, { variant: 'Carmine Candy', bg: ['#2a1414', '#070404'] });
    g.scene.rotation.y = Math.PI / 2;
    look(ctx.camera, [0, 0.65, 8.2], [0, 0.6, 0], 26);
  },
  async car_front(ctx) {
    const { g } = await carBase(ctx, { variant: 'Carmine Candy', bg: ['#2a1414', '#070404'] });
    g.scene.rotation.y = 0;
    look(ctx.camera, [1.0, 0.75, 6.0], [0, 0.5, 0], 24);
  },
  async car_wheel(ctx) {
    const { g } = await carBase(ctx, { variant: 'Pearly Swirly', bg: ['#2b2c30', '#09090a'] });
    g.scene.rotation.y = Math.PI / 2;
    look(ctx.camera, [-1.0, 0.55, 3.4], [-1.35, 0.4, 0], 30);
  },
  async car_top(ctx) {
    const { g } = await carBase(ctx, { variant: 'Torched Graphite', bg: ['#1a1b1d', '#050506'] });
    g.scene.rotation.y = 0.9;
    look(ctx.camera, [5.5, 3.6, 4.6], [0, 0.4, 0], 26);
  },

  /* 02 — Eyewear */
  async glasses_cover(ctx) {
    const { g } = await glassesBase(ctx);
    g.scene.rotation.set(0, -0.35, 0);
    look(ctx.camera, [0.55, 0.42, 1.55], [0.02, 0.17, 0], 30);
  },
  async glasses_front(ctx) {
    const { g } = await glassesBase(ctx, { bg: ['#e9e1d3', '#cbbfae'] });
    look(ctx.camera, [0, 0.2, 1.7], [0, 0.17, 0], 30);
  },
  async glasses_detail(ctx) {
    const { g } = await glassesBase(ctx, { bg: ['#e4dbcc', '#c3b6a3'] });
    g.scene.rotation.y = -1.0;
    look(ctx.camera, [0.1, 0.42, 0.8], [0.2, 0.2, -0.05], 28);
  },
  async glasses_top(ctx) {
    const { g } = await glassesBase(ctx, { bg: ['#ded4c4', '#bfb19c'] });
    g.scene.rotation.set(0, 0.5, 0);
    look(ctx.camera, [-0.35, 0.95, 1.25], [0.0, 0.08, 0], 26);
  },

  /* 05 — Interior */
  async interior_cover(ctx) {
    await room(ctx);
    await placeChair(ctx, 'Peacock Velvet', [0.55, 0, -1.2], -0.35, 1.05);
    await place(ctx, 'SpecularSilkPouf', 0.66, [-0.55, 0, -0.55], 0.3);
    await place(ctx, 'IridescenceLamp', 0.6, [1.55, 0, -1.75], 0);
    look(ctx.camera, [-0.1, 0.62, 2.55], [0.45, 0.72, -1.4], 36);
  },
  async interior_chair(ctx) {
    await room(ctx, { wall: 0xd6cdc0 });
    await placeChair(ctx, 'Mango Velvet', [0.2, 0, -1.25], 0.55, 1.05);
    look(ctx.camera, [0.9, 0.7, 1.6], [0.1, 0.55, -1.25], 32);
  },
  async interior_pouf(ctx) {
    await room(ctx, { wall: 0xcfc7bb });
    await place(ctx, 'SpecularSilkPouf', 0.8, [-0.3, 0, -1.0], 0.2);
    await place(ctx, 'IridescenceLamp', 0.6, [0.5, 0, -1.75], 0);
    look(ctx.camera, [0.0, 1.35, 1.6], [0.0, 0.25, -1.1], 32);
  },
};

/* debug: hotspot anchors (kept for re-tuning src/data/sneaker.js) */
const HOTSPOT_DEBUG = [
  [-0.46, 0.3, 0.0], [0.1, 0.31, 0.0], [0.34, 0.16, 0.08], [-0.02, 0.18, 0.16], [0.0, 0.05, 0.17], [-0.09, 0.47, 0.0],
];
async function hotspotDebug(ctx, camPos) {
  const { THREE } = ctx;
  const { g } = await shoeBase(ctx, { variant: 'street' });
  const cols = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
  HOTSPOT_DEBUG.forEach((p, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.018), new THREE.MeshBasicMaterial({ color: cols[i], depthTest: false }));
    m.position.set(...p); m.renderOrder = 10; ctx.scene.add(m);
  });
  look(ctx.camera, camPos, [0, 0.22, 0], 30);
}
scenes.debug_hs_side = (ctx) => hotspotDebug(ctx, [0, 0.3, 2.2]);
scenes.debug_hs_top = (ctx) => hotspotDebug(ctx, [0.01, 2.2, 0.3]);
scenes.debug_hs_34 = (ctx) => hotspotDebug(ctx, [1.3, 0.8, 1.5]);
