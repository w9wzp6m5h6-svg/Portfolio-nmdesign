/**
 * Resolves a public asset path against the build base, so the production
 * build works from a domain root, a sub-folder or a local demo server alike.
 *   asset('models/sneaker-hd.glb') → './models/sneaker-hd.glb' (base './')
 */
const BASE = import.meta.env?.BASE_URL ?? './';
export const asset = (path) => BASE + String(path).replace(/^\/+/, '');
