#!/usr/bin/env node
/**
 * Local demo server for the production build — no dependencies.
 *   node demo/serve.mjs [folder=../dist relative to this file] [port=4173]
 * Opens the default browser automatically. Stop with Ctrl+C.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.argv[2] || join(here, '..', 'dist'));
let port = Number(process.argv[3] || process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = normalize(join(root, decodeURIComponent(url.pathname)));
    if (!path.startsWith(root)) { res.writeHead(403).end(); return; }
    let info = await stat(path).catch(() => null);
    if (info?.isDirectory()) { path = join(path, 'index.html'); info = await stat(path).catch(() => null); }
    if (!info) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
    const body = await readFile(path);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': path.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end(String(err));
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && port < 4200) { port += 1; server.listen(port); return; }
  console.error(err.message); process.exit(1);
});
server.on('listening', () => {
  const url = `http://localhost:${port}/`;
  console.log(`\n  Noah Milsztajn — Portfolio\n  ${url}\n  (Ctrl+C to stop)\n`);
  if (!process.env.NO_OPEN) {
    const cmd = process.platform === 'darwin' ? `open "${url}"` : process.platform === 'win32' ? `start "" "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});
server.listen(port);
