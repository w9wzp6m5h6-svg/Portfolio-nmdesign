/**
 * Offline render rig. Opened by tools/render/render.mjs in headless Chromium:
 *   /tools/render/index.html?scene=<name>&w=<px>&h=<px>
 * Each scene in scenes.js composes lights, models and camera; the rig renders
 * one frame and flags window.__done so the page can be screenshotted.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { readVariants } from '../../src/three/variants.js';
import { scenes } from './scenes.js';

const params = new URLSearchParams(location.search);
const W = +params.get('w') || 1600;
const H = +params.get('h') || 1000;
const name = params.get('scene');

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = +(params.get("exp") || 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 0.01, 200);
const pmrem = new THREE.PMREMGenerator(renderer);
const studioEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = studioEnv;

const loader = new GLTFLoader();
async function load(file) {
  const gltf = await loader.loadAsync(`./models/${file}.glb`);
  gltf.scene.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
  gltf.variants = await readVariants(gltf);
  return gltf;
}

/** Scale an object so its largest dimension equals `size`, resting on y=0, centred on x/z. */
function fit(obj, size = 1) {
  const box = new THREE.Box3().setFromObject(obj);
  const dim = box.getSize(new THREE.Vector3());
  const s = size / Math.max(dim.x, dim.y, dim.z);
  obj.scale.multiplyScalar(s);
  box.setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y;
  return obj;
}

function shadowFloor(opacity = 0.35, size = 40) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true;
  return m;
}

function keyLight(intensity = 2.5, pos = [3, 6, 4], color = 0xffffff, mapSize = 2048, radius = 6) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.set(...pos);
  l.castShadow = true;
  l.shadow.mapSize.set(mapSize, mapSize);
  l.shadow.radius = radius;
  l.shadow.blurSamples = 16;
  l.shadow.bias = -0.0004;
  const c = l.shadow.camera; c.left = -3; c.right = 3; c.top = 3; c.bottom = -3; c.near = 0.1; c.far = 30;
  return l;
}

const ctx = { THREE, renderer, scene, camera, load, fit, shadowFloor, keyLight, studioEnv, pmrem, W, H };

try {
  if (!scenes[name]) throw new Error(`Unknown scene ${name}`);
  await scenes[name](ctx);
  renderer.compile(scene, camera);
  renderer.render(scene, camera);
  // second pass lets VSM shadows settle
  renderer.render(scene, camera);
  window.__done = true;
} catch (e) {
  console.error(e);
  window.__error = String(e && e.stack || e);
}
