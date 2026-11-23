/**
 * Prepares a sneaker model for the 3D stage.
 *   node tools/prepare-sneaker.mjs path/to/model.glb [outDir=public/models]
 * Writes sneaker-hd.glb (2048 px textures) and sneaker-lite.glb (1024 px),
 * WebP textures + meshopt geometry, keeping material variants if present.
 * Then update `model` (rotation, credit) and `hotspots` in src/data/sneaker.js.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const [input, outDir = 'public/models'] = process.argv.slice(2);
if (!input || !existsSync(input)) {
  console.error('Usage: node tools/prepare-sneaker.mjs path/to/model.glb [outDir]');
  process.exit(1);
}
const cli = resolve('node_modules/@gltf-transform/cli/bin/cli.js');
for (const [name, size] of [['sneaker-hd.glb', 2048], ['sneaker-lite.glb', 1024]]) {
  const out = `${outDir}/${name}`;
  execFileSync(process.execPath, [cli, 'optimize', input, out,
    '--texture-compress', 'webp', '--texture-size', String(size), '--compress', 'meshopt',
    '--simplify', 'false', '--join', 'false', '--instance', 'false', '--flatten', 'false'], { stdio: 'inherit' });
  console.log(`${out}  ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB`);
}
