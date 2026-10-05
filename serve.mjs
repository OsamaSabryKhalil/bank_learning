#!/usr/bin/env node
// Zero-dependency static server: 127.0.0.1, path-traversal-safe, CSP header, --port.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json', '.woff2':'font/woff2', '.svg':'image/svg+xml', '.png':'image/png', '.wasm':'application/wasm', '.ico':'image/x-icon' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
const root = normalize(join(process.cwd(), 'dist'));
let port = Number(process.argv.includes('--port') ? process.argv[process.argv.indexOf('--port')+1] : 4173);
const server = createServer(async (req, res) => {
  try {
    let p = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!p.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
    const s = await stat(p).catch(() => null);
    if (s?.isDirectory()) p = join(p, 'index.html');
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream', 'content-security-policy': CSP, 'x-content-type-options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
server.on('error', () => { port++; server.listen(port, '127.0.0.1'); });
server.listen(port, '127.0.0.1', () => console.log(`serving dist at http://127.0.0.1:${port}`));
