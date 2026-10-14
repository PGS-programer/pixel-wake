import { DurableObject } from 'cloudflare:workers';
import { SqlStore } from '../server/sql-store.js';
import { Rooms } from '../server/rooms.js';
function database(storage) {
    const exec = (sql, args) => storage.sql.exec(sql, ...args);
    return { exec(sql) { for (const statement of sql.split(';').filter(s => s.trim())) exec(statement, []); },
        prepare(sql) { return { get(...args) { return exec(sql, args).toArray()[0]; }, all(...args) { return exec(sql, args).toArray(); }, run(...args) { const cursor = exec(sql, args); return { changes: cursor.rowsWritten }; } }; },
        transaction(fn) { return storage.transactionSync(fn); }, close() {} };
}
const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
export class PixelWakeBackend extends DurableObject {
    constructor(ctx, env) {
        super(ctx, env); this.store = new SqlStore(database(ctx.storage)); this.rooms = new Rooms(this.store);
        this.clients = new Set(); this.rates = new Map(); this.loop = null; this.tick = 0; this.previous = 0; this.accumulated = 0;
    }
    limit(key, max) {
        const now = Date.now(); let value = this.rates.get(key);
        if (!value || value.until < now) { value = { until: now + 60000, count: 0 }; this.rates.set(key, value); }
        if (++value.count > max) throw new Error('Demasiadas solicitudes. Espera un minuto.');
        if (this.rates.size > 2000) for (const [k, v] of this.rates) if (v.until < now) this.rates.delete(k);
    }
    async fetch(request) {
        const url = new URL(request.url), ip = request.headers.get('cf-connecting-ip') || 'local';
        try {
            this.limit(`http:${ip}`, 180);
            if (url.pathname === '/api/health') return json({ ok: true, runtime: 'cloudflare-durable-object', persistent: true });
            if (url.pathname === '/socket') {
                if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') return json({ error: 'WebSocket requerido.' }, 426);
                this.limit(`socket:${ip}`, 20);
                if (this.clients.size >= 100) return json({ error: 'Servidor lleno.' }, 503);
                const [client, native] = Object.values(new WebSocketPair()); native.accept();
                const ws = { native, aliveAt: Date.now(), bufferedAmount: 0, playerId: null, room: null, busy: false,
                    get readyState() { return native.readyState; }, send(data) { native.send(data); } };
                this.clients.add(ws); this.startLoop();
                native.addEventListener('message', event => this.message(ws, event.data));
                const close = () => { if (!this.clients.has(ws)) return; this.rooms.disconnect(ws); this.clients.delete(ws); if (!this.clients.size && this.loop) { clearInterval(this.loop); this.loop = null; } };
                native.addEventListener('close', close); native.addEventListener('error', close);
                return new Response(null, { status: 101, webSocket: client });
            }
            const read = async () => { const text = await request.text(); if (text.length > 16384) throw new Error('Solicitud demasiado grande.'); return JSON.parse(text || '{}'); };
            if (url.pathname === '/api/identity' && request.method === 'POST') {
                const value = await read(); if (!this.store.get(String(value.id))) this.limit(`identity:${ip}`, 15);
                return json({ profile: this.store.register(value.id, value.token, value.profile) });
            }
            const [id, token] = String(request.headers.get('authorization') || '').replace(/^Bearer /, '').split('.');
            if (!this.store.authenticate(id, token)) return json({ error: 'Perfil no autorizado.' }, 401);
            if (url.pathname === '/api/profile' && request.method === 'GET') return json({ profile: this.store.get(id) });
            if (url.pathname === '/api/profile' && request.method === 'PUT') { const result = this.store.save(id, await read()); return json(result, result.conflict ? 409 : 200); }
            if (url.pathname === '/api/ranking' && request.method === 'GET') return json(this.store.ranking(url.searchParams.get('metric'), id));
            return json({ error: 'Ruta desconocida.' }, 404);
        } catch (e) { return json({ error: e.message || 'Solicitud inválida.' }, 400); }
    }
    async message(ws, raw) {
        if (ws.busy) return;
        try {
            if (typeof raw !== 'string' || raw.length > 8192) { ws.native.close(1009, 'Mensaje demasiado grande'); return; }
            this.limit(`ws:${ws.playerId || 'anonymous'}`, 1800); const msg = JSON.parse(raw); ws.aliveAt = Date.now();
            if (!msg || typeof msg !== 'object') throw new Error('Mensaje inválido.');
            if (!ws.playerId) {
                if (msg.type !== 'auth' || !this.store.authenticate(msg.id, msg.token)) { ws.native.close(1008, 'Perfil no autorizado'); return; }
                if (this.rooms.clients.has(msg.id)) { ws.native.close(1008, 'Perfil ya conectado en otra pestaña'); return; }
                ws.playerId = msg.id; this.rooms.clients.set(msg.id, ws); this.rooms.send(ws, 'authenticated'); return;
            }
            if (msg.type === 'pong') return;
            if (['create', 'join'].includes(msg.type)) { this.limit(`room:${ws.playerId}`, 10); ws.busy = true; }
            await this.rooms.handle(ws, msg);
        } catch (e) { this.rooms.send(ws, 'error', { message: e.message || 'Acción inválida.' }); }
        finally { ws.busy = false; }
    }
    startLoop() {
        if (this.loop) return;
        this.previous = performance.now(); this.accumulated = 0; this.heartbeat = Date.now();
        this.loop = setInterval(() => {
            const now = performance.now(); this.accumulated += Math.min(100, now - this.previous); this.previous = now;
            while (this.accumulated >= 1000 / 60) { this.rooms.tick(++this.tick % 3 === 0); this.accumulated -= 1000 / 60; }
            if (Date.now() - this.heartbeat >= 5000) {
                this.heartbeat = Date.now();
                for (const ws of this.clients) {
                    if ((!ws.playerId && Date.now() - ws.aliveAt >= 5000) || Date.now() - ws.aliveAt >= 20000) { ws.native.close(1001, 'Conexión caducada'); this.rooms.disconnect(ws); this.clients.delete(ws); }
                    else this.rooms.send(ws, 'ping');
                }
            }
            if (!this.clients.size) { clearInterval(this.loop); this.loop = null; }
        }, 8);
    }
}
export default {
    async fetch(request, env) {
        const origin = request.headers.get('origin'), url = new URL(request.url);
        const allowed = new Set(String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
        if (origin && origin !== url.origin && !allowed.has(origin)) return json({ error: 'Origen no permitido.' }, 403);
        const cors = origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {};
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS', 'access-control-max-age': '600' } });
        if (!url.pathname.startsWith('/api/') && url.pathname !== '/socket') return json({ error: 'Backend Pixel Wake. El juego se publica en GitHub Pages.' }, 404);
        const response = await env.BACKEND.getByName('pixel-wake-v1').fetch(request);
        if (response.status === 101) return response;
        const result = new Response(response.body, response); for (const [k, v] of Object.entries(cors)) result.headers.set(k, v); return result;
    }
};
