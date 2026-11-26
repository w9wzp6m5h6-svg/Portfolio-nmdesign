#!/usr/bin/env node
/**
 * Local demo server for the production build — no dependencies.
 *   node demo/serve.mjs [folder=../dist relative to this file] [port=4173]
 * Opens the default browser automatically. Stop with Ctrl+C.
 *
 * Security (see SECURITE.md):
 *  - listens on this computer only (127.0.0.1), never on the local network;
 *  - serves files inside the folder only: no "../", no symlink escape,
 *    no hidden files except /.well-known/;
 *  - GET and HEAD only; generic error messages (no internal paths);
 *  - applies the production headers generated in _headers (CSP, nosniff…),
 *    minus the HTTPS-only ones, so the demo behaves like the hosted site.
 */
import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { readFileSync, realpathSync } from 'node:fs';
import { extname, join, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const HOST = '127.0.0.1';
const here = dirname(fileURLToPath(import.meta.url));
const root = realpathSync(resolve(process.argv[2] || join(here, '..', 'dist')));
let port = Number(process.argv[3] || process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.ico': 'image/x-icon',
};

/** Production headers from _headers (Netlify format), without what only makes sense over HTTPS. */
function loadHeaderRules() {
  let text;
  try { text = readFileSync(join(root, '_headers'), 'utf8'); } catch { return []; }
  const rules = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { current = { pattern: line.trim(), headers: [] }; rules.push(current); continue; }
    const i = line.indexOf(':');
    if (!current || i < 0) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (/^strict-transport-security$/i.test(key)) continue;
    if (/^content-security-policy$/i.test(key)) {
      value = value.split(';').map((d) => d.trim()).filter((d) => d && d !== 'upgrade-insecure-requests').join('; ');
    }
    current.headers.push([key, value]);
  }
  return rules;
}
const RULES = loadHeaderRules();
const headersFor = (pathname) => RULES
  .filter((r) => (r.pattern.endsWith('*') ? pathname.startsWith(r.pattern.slice(0, -1)) : pathname === r.pattern))
  .flatMap((r) => r.headers);

const inside = (p) => p === root || p.startsWith(root + sep);
const fail = (res, code, text) => res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }).end(text);

const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); fail(res, 405, 'Method not allowed'); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { fail(res, 400, 'Bad request'); return; }
    if (pathname.includes('\0')) { fail(res, 400, 'Bad request'); return; }
    // hidden files and folders (and any "..") are never served, except /.well-known/
    const segments = pathname.split(/[\\/]/).filter(Boolean);
    if (segments.some((s, i) => s.startsWith('.') && !(i === 0 && s === '.well-known')) || pathname === '/_headers') {
      fail(res, 404, 'Not found'); return;
    }
    let path = resolve(root, `.${pathname}`);
    if (!inside(path)) { fail(res, 403, 'Forbidden'); return; }
    let info = await stat(path).catch(() => null);
    if (info?.isDirectory()) { path = join(path, 'index.html'); info = await stat(path).catch(() => null); }
    if (!info?.isFile()) { fail(res, 404, 'Not found'); return; }
    if (!inside(await realpath(path))) { fail(res, 403, 'Forbidden'); return; } // symlink pointing outside
    const body = await readFile(path);
    res.writeHead(200, {
      ...Object.fromEntries(headersFor(pathname)),
      'Content-Type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) fail(res, 500, 'Internal error');
    else res.end();
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && port < 4200) { port += 1; server.listen(port, HOST); return; }
  console.error(err.message); process.exit(1);
});
server.on('listening', () => {
  const url = `http://${HOST}:${port}/`;
  console.log(`\n  NM Design — Portfolio\n  ${url}\n  (Ctrl+C to stop)\n`);
  if (!process.env.NO_OPEN) {
    const cmd = process.platform === 'darwin' ? `open "${url}"` : process.platform === 'win32' ? `start "" "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});
server.listen(port, HOST);
