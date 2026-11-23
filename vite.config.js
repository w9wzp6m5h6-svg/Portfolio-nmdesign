import { defineConfig } from 'vite';

export default defineConfig({
  // relative base: the build runs from a domain root, a sub-folder or the local demo server
  base: './',
  build: {
    target: 'es2020',
    // three.js (~140 kB gzip) is its own lazily-loaded chunk: it is only fetched
    // after first paint, for the hero name, the 3D object and the live pieces.
    chunkSizeWarningLimit: 600,
    assetsInlineLimit: 0,
  },
  server: { host: true },
});
