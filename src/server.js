import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discordCommand as runDiscordCommand, verifyDiscord as verifyDiscordRequest } from './discord.js';
import { JsonStore } from './store.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const products = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json')));
const store = new JsonStore().load();
const port = Number(process.env.PORT ?? 3000);

const json = (res, status, body) => { const data = JSON.stringify(body); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(data), 'cache-control': 'no-store' }); res.end(data); };
const clean = (value, max = 100) => String(value ?? '').trim().slice(0, max);
const productView = (product) => ({ ...product, current: Object.values(store.data.current).filter((o) => o.productId === product.id), history: store.data.observations.filter((o) => o.productId === product.id).slice(-50).reverse() });

const localRepository = {
  current: async (productId) => productView(products.find((product) => product.id === productId)).current,
  watch: async (userId, productId) => { store.watch(userId, productId); store.save(); },
  unwatch: async (userId, productId) => { store.unwatch(userId, productId); store.save(); }
};
const verifyDiscord = (req, body) => verifyDiscordRequest({ headers: req.headers, body, publicKey: process.env.DISCORD_PUBLIC_KEY });
const discordCommand = (payload) => runDiscordCommand(payload, localRepository);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { status: 'ok', sources: store.data.sourceHealth });
  if (req.method === 'GET' && url.pathname === '/api/products') {
    const q = clean(url.searchParams.get('q')).toLowerCase();
    return json(res, 200, products.filter((p) => !q || `${p.name} ${p.set}`.toLowerCase().includes(q)).map(productView));
  }
  const match = url.pathname.match(/^\/api\/products\/([a-z0-9-]+)$/);
  if (req.method === 'GET' && match) { const p = products.find((x) => x.id === match[1]); return p ? json(res, 200, productView(p)) : json(res, 404, { error: 'not_found' }); }
  if (req.method === 'POST' && url.pathname === '/api/discord') {
    let body = ''; req.on('data', (chunk) => { body += chunk; if (body.length > 65536) req.destroy(); });
    return req.on('end', async () => { if (!verifyDiscord(req, body)) return json(res, 401, { error: 'invalid_signature' }); try { return json(res, 200, await discordCommand(JSON.parse(body))); } catch { return json(res, 400, { error: 'invalid_json' }); } });
  }
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const allowed = new Map([['/index.html', 'text/html; charset=utf-8'], ['/styles.css', 'text/css; charset=utf-8'], ['/app.js', 'text/javascript; charset=utf-8']]);
  if (req.method === 'GET' && allowed.has(requested)) { const data = fs.readFileSync(path.join(root, 'static', requested)); res.writeHead(200, { 'content-type': allowed.get(requested), 'content-length': data.length }); return res.end(data); }
  json(res, 404, { error: 'not_found' });
});

if (process.env.NODE_ENV !== 'test') server.listen(port, () => console.log(JSON.stringify({ event: 'server_started', port })));
export { server, discordCommand, verifyDiscord };
