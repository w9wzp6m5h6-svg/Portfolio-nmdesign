/**
 * Minimal KHR_materials_variants support for three.js GLTFLoader results.
 * Returns the list of variant names and a function that resolves the
 * material for every mesh primitive for a given variant.
 */
export async function readVariants(gltf) {
  const { parser } = gltf;
  const ext = parser.json.extensions?.KHR_materials_variants;
  if (!ext) return { names: [], materialsFor: async () => new Map() };

  const names = ext.variants.map((v) => v.name);
  const targets = [];

  gltf.scene.traverse((obj) => {
    if (!obj.isMesh) return;
    const assoc = parser.associations.get(obj);
    if (!assoc || assoc.meshes === undefined) return;
    const prim = parser.json.meshes[assoc.meshes].primitives[assoc.primitives ?? 0];
    const mappings = prim?.extensions?.KHR_materials_variants?.mappings;
    if (mappings) targets.push({ mesh: obj, mappings, original: obj.material });
  });

  /** @returns {Promise<Map<THREE.Mesh, THREE.Material>>} */
  async function materialsFor(name) {
    const index = names.indexOf(name);
    const out = new Map();
    await Promise.all(
      targets.map(async ({ mesh, mappings, original }) => {
        const m = mappings.find((mp) => mp.variants.includes(index));
        out.set(mesh, m ? await parser.getDependency('material', m.material) : original);
      })
    );
    return out;
  }

  return { names, materialsFor };
}
