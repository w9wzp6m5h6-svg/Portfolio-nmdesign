/**
 * Packs the .glb models of a build into .json files ({ "glb": "<base64>" })
 * and removes the .glb copies. Used for hosts that do not serve .glb files.
 *   node tools/pack-models-json.mjs <buildDir>
 */
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
const dir = `${process.argv[2] || 'build-artifact'}/models`;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.glb'))) {
  const out = `${dir}/${f.replace(/\.glb$/, '.json')}`;
  writeFileSync(out, JSON.stringify({ glb: readFileSync(`${dir}/${f}`).toString('base64') }));
  rmSync(`${dir}/${f}`);
  console.log('packed', out);
}
