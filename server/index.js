import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { Store } from './store.js';
import { Rooms } from './rooms.js';
export function createBackend({ database = process.env.DATABASE_PATH || 'server/data/pixel-wake.sqlite', origins = process.env.ALLOWED_ORIGINS || '', staticRoot = resolve('dist') } = {}) {
    const store = new Store(database), rooms = new Rooms(store), rates = new Map();
    const allowed = new Set(origins.split(',').map(s => s.trim()).filter(Boolean));
    const originAllowed = req => !req.headers.origin || req.headers.origin === `http://${req.headers.host}` || req.headers.origin === `https://${req.headers.host}` || allowed.has(req.headers.origin);
    const limited = (key, limit) => {
        const now = Date.now(); let rate = rates.get(key); if (!rate || now > rate.until) { rate = { count: 0, until: now + 60_000 }; rates.set(key, rate); }
        if (++rate.count > limit) throw new Error('Demasiadas solicitudes. Espera un minuto.');
    };
    const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(body)); };
    const body = async req => {
        let text = ''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 16384) throw new Error('Solicitud demasiado grande.'); }
        return JSON.parse(text || '{}');
    };
    const server = createServer(async (req, res) => {
        try {
            if (!originAllowed(req)) { json(res, 403, { error: 'Origen no permitido.' }); return; }
            if (req.headers.origin && allowed.has(req.headers.origin)) { res.setHeader('access-control-allow-origin', req.headers.origin); res.setHeader('vary', 'Origin'); }
            if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' }); res.end(); return; }
            const url = new URL(req.url, 'http://localhost');
            if (url.pathname.startsWith('/api/')) {
                limited(req.socket.remoteAddress, 180);
                if (req.method === 'GET' && url.pathname === '/api/health') { json(res, 200, { ok: true }); return; }
                if (req.method === 'POST' && url.pathname === '/api/identity') {
                    const input = await body(req);
                    if (!store.get(String(input.id))) limited(`identity:${req.socket.remoteAddress}`, 15); json(res, 200, { profile: store.register(input.id, input.token, input.profile) }); return;
                }
                const [id, token] = String(req.headers.authorization || '').replace(/^Bearer /, '').split('.');
                if (!store.authenticate(id, token)) { json(res, 401, { error: 'Perfil no autorizado.' }); return; }
                if (req.method === 'GET' && url.pathname === '/api/profile') { json(res, 200, { profile: store.get(id) }); return; }
                if (req.method === 'PUT' && url.pathname === '/api/profile') { const result = store.save(id, await body(req)); json(res, result.conflict ? 409 : 200, result); return; }
                if (req.method === 'GET' && url.pathname === '/api/ranking') { json(res, 200, store.ranking(url.searchParams.get('metric'), id)); return; }
                json(res, 404, { error: 'Ruta desconocida.' }); return;
            }
            if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
            let path; try { path = decodeURIComponent(url.pathname); } catch { res.writeHead(400).end(); return; }
            const file = resolve(staticRoot, '.' + (path === '/' ? '/index.html' : path));
            if (!file.startsWith(staticRoot + '/')) { res.writeHead(403).end(); return; }
            try {
                const content = await readFile(file);
                res.writeHead(200, { 'content-type': ({ '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' });
                res.end(req.method === 'HEAD' ? undefined : content);
            } catch { res.writeHead(404).end('No encontrado'); }
        } catch (e) { if (!res.headersSent) json(res, 400, { error: e.message || 'Solicitud inválida.' }); else res.end(); }
    });
    const wss = new WebSocketServer({ noServer: true, maxPayload: 8192, perMessageDeflate: false });
    server.on('upgrade', (req, socket, head) => {
        try { limited(`socket:${req.socket.remoteAddress}`, 20); } catch { socket.destroy(); return; }
        if (new URL(req.url, 'http://localhost').pathname !== '/socket' || !originAllowed(req) || wss.clients.size >= 100) { socket.destroy(); return; }
        wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
    });
    wss.on('connection', ws => {
        ws.alive = true; ws.on('pong', () => { ws.alive = true; });
        const timeout = setTimeout(() => { if (!ws.playerId) ws.close(1008, 'Autenticación requerida'); }, 5000);
        ws.on('message', async data => {
            if (ws.busy) return;
            try {
                limited(`ws:${ws.playerId || 'anonymous'}:${ws._socket.remotePort}`, 1800);
                const msg = JSON.parse(data.toString());
                if (!msg || typeof msg !== 'object') throw new Error('Mensaje inválido.');
                if (!ws.playerId) {
                    if (msg.type !== 'auth' || !store.authenticate(msg.id, msg.token)) { ws.close(1008, 'Perfil no autorizado'); return; }
                    if (rooms.clients.has(msg.id)) { ws.close(1008, 'Perfil ya conectado en otra pestaña'); return; }
                    ws.playerId = msg.id; rooms.clients.set(msg.id, ws); clearTimeout(timeout); rooms.send(ws, 'authenticated'); return;
                }
                if (['create', 'join'].includes(msg.type)) { limited(`room:${ws.playerId}`, 10); ws.busy = true; }
                await rooms.handle(ws, msg);
            } catch (e) { rooms.send(ws, 'error', { message: e.message || 'No se pudo completar la acción.' }); }
            finally { ws.busy = false; }
        });
        ws.on('close', () => { clearTimeout(timeout); rooms.disconnect(ws); }); ws.on('error', () => {});
    });
    let tick = 0, previous = performance.now(), accumulated = 0;
    const loop = setInterval(() => {
        const now = performance.now(); accumulated += Math.min(100, now - previous); previous = now;
        while (accumulated >= 1000 / 60) { rooms.tick(++tick % 3 === 0); accumulated -= 1000 / 60; }
    }, 8);
    const heartbeat = setInterval(() => {
        for (const ws of wss.clients) { if (!ws.alive) ws.terminate(); else { ws.alive = false; ws.ping(); } }
        for (const [key, value] of rates) if (Date.now() > value.until) rates.delete(key);
    }, 10000);
    return { server, store, rooms, async close() { clearInterval(loop); clearInterval(heartbeat); for (const ws of wss.clients) ws.terminate(); await new Promise(r => wss.close(r)); await new Promise(r => server.close(r)); store.close(); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const app = createBackend(); app.server.listen(Number(process.env.PORT || 3001), process.env.HOST || '0.0.0.0', () => console.log(`Pixel Wake backend: http://localhost:${process.env.PORT || 3001}`));
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await app.close(); process.exit(0); });
}
