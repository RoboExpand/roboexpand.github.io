// Dependency-free local preview with HTTP Range support for video seeking.
import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 8000);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.mp4':'video/mp4', '.pdf':'application/pdf' };
const server = http.createServer((req, res) => {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  let name;
  try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end(); return; }
  const path = resolve(root, `.${name === '/' ? '/index.html' : name}`);
  if (!path.startsWith(resolve(root) + sep) || name.split('/').some(segment => segment.startsWith('.'))) { res.writeHead(403).end(); return; }
  let stat;
  try { stat = statSync(path); if (!stat.isFile()) throw new Error(); }
  catch { res.writeHead(404).end('Not found'); return; }
  const headers = { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-cache' };
  const range = req.headers.range;
  let start = 0, end = stat.size - 1, status = 200;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) { res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}).end(); return; }
    start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
    if (start > end || start >= stat.size) { res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}).end(); return; }
    status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = end - start + 1;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') res.end();
  else { const stream = createReadStream(path, {start,end}); stream.on('error', () => res.destroy()); stream.pipe(res); res.on('close', () => stream.destroy()); }
});
server.listen(port, '127.0.0.1', () => console.log(`RoboExpand preview: http://127.0.0.1:${port}`));
