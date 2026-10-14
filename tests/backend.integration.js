import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import WebSocket from 'ws';
import { createBackend } from '../server/index.js';
const dir = mkdtempSync(join(tmpdir(), 'pw-backend-'));
const app = createBackend({ database: join(dir, 'test.sqlite') });
await new Promise(r => app.server.listen(0, '127.0.0.1', r));
const port = app.server.address().port, root = `http://127.0.0.1:${port}`;
const accounts = [];
const call = async (path, method = 'GET', body, user = accounts[0]) => {
    const res = await fetch(root + path, { method, headers: { 'content-type': 'application/json', ...(user ? { authorization: `Bearer ${user.id}.${user.token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, data: await res.json() };
};
function channel(user) {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/socket`), queue = [], pending = [];
    ws.on('message', data => { const msg = JSON.parse(data); const index = pending.findIndex(p => p.test(msg)); if (index >= 0) { const p = pending.splice(index, 1)[0]; clearTimeout(p.timer); p.resolve(msg); } else queue.push(msg); });
    const wait = test => { const i = queue.findIndex(test); if (i >= 0) return Promise.resolve(queue.splice(i, 1)[0]); return new Promise((resolve, reject) => { const p = { test, resolve }; p.timer = setTimeout(() => reject(new Error('WS timeout')), 5000); pending.push(p); }); };
    const send = (type, payload = {}) => ws.send(JSON.stringify({ type, ...payload }));
    ws.on('open', () => send('auth', user));
    return { ws, send, wait };
}
try {
    for (const name of ['POL_TEST', 'MARC_TEST', 'NORA_TEST']) {
        const a = { id: randomUUID(), token: randomBytes(32).toString('hex') }; accounts.push(a);
        const r = await call('/api/identity', 'POST', { ...a, profile: { name, coins: 75, bestScore: 2000, bestDistance: 500, gamesPlayed: 3, unlockedBoats: ['coastal', 'riptide'], selectedBoat: 'riptide' } }); assert.equal(r.status, 200);
    }
    assert.equal((await call('/api/profile', 'GET', undefined, { id: accounts[0].id, token: 'c'.repeat(64) })).status, 401);
    let p = (await call('/api/profile')).data.profile;
    assert.equal((await call('/api/profile', 'PUT', { ...p, bestScore: -1 })).status, 400);
    p = (await call('/api/profile', 'PUT', { ...p, bestScore: 4000 })).data.profile;
    await call('/api/profile', 'PUT', { ...p, bestScore: 3000 });
    assert.equal((await call('/api/ranking')).data.me.bestScore, 4000);
    const host = channel(accounts[0]), guest = channel(accounts[1]), extra = channel(accounts[2]);
    await Promise.all([host, guest, extra].map(c => c.wait(m => m.type === 'authenticated')));
    host.send('create', { name: 'TEST', password: 'secret7' }); const { room } = await host.wait(m => m.type === 'room');
    const internal = app.rooms.rooms.get(room.code); assert.equal('password' in internal, false); assert.ok(Buffer.isBuffer(internal.secret));
    guest.send('join', { code: 'BAD123', password: 'secret7' }); assert.match((await guest.wait(m => m.type === 'error')).message, /existe/);
    guest.send('join', { code: room.code, password: 'wrong' }); assert.match((await guest.wait(m => m.type === 'error')).message, /incorrecta/);
    guest.send('join', { code: room.code, password: 'secret7' }); await guest.wait(m => m.type === 'room' && m.room.guest);
    extra.send('join', { code: room.code, password: 'secret7' }); assert.match((await extra.wait(m => m.type === 'error')).message, /llena/);
    guest.send('start'); assert.match((await guest.wait(m => m.type === 'error')).message, /creador/);
    host.send('start'); assert.match((await host.wait(m => m.type === 'error')).message, /listos/);
    host.send('ready', { ready: true }); guest.send('ready', { ready: true }); await host.wait(m => m.type === 'room' && m.room.players.every(p => p.ready));
    host.send('start'); const a = await host.wait(m => m.type === 'state'), b = await guest.wait(m => m.type === 'state'); assert.deepEqual(a.state.obstacles, b.state.obstacles); assert.equal(a.state.seed, b.state.seed);
    internal.match.players[0].y = 250; internal.match.players[1].y = 260;
    await host.wait(m => m.type === 'state' && m.state.bump > 0);
    host.send('input', { roundId: internal.roundId, seq: 1, direction: 1 }); await host.wait(m => m.type === 'state' && m.state.players[0].inputSeq === 1);
    internal.match.players[0].alive = false; internal.match.players[0].deathAt = internal.match.elapsed;
    const result = await host.wait(m => m.type === 'state' && m.state.result); assert.equal(result.state.result.winner, accounts[1].id);
    assert.equal(app.store.get(accounts[0].id).losses, 1); assert.equal(app.store.get(accounts[1].id).wins, 1);
    const firstRound = internal.roundId;
    host.send('rematch'); guest.send('rematch'); await host.wait(m => m.type === 'state' && m.roundId !== firstRound);
    assert.notEqual(internal.roundId, firstRound); assert.equal(internal.match.players.every(p => p.alive), true);
    guest.ws.close(); const disconnect = await host.wait(m => m.type === 'state' && m.roundId !== firstRound && m.state.result?.reason === 'disconnect'); assert.equal(disconnect.state.result.winner, accounts[0].id);
    assert.equal(app.store.get(accounts[0].id).wins, 1);
    await host.wait(m => m.type === 'room' && m.room.guest === null);
    internal.lastActivity = Date.now() - 700_000; app.rooms.tick(false); await host.wait(m => m.type === 'closed'); assert.equal(app.rooms.rooms.size, 0);
    host.ws.close(); extra.ws.close();
    // A complete restart reopens the same persistent database.
    const { Store } = await import('../server/store.js'); const disk = new Store(join(dir, 'test.sqlite')); assert.equal(disk.get(accounts[0].id).wins, 1); disk.close();
    console.log('PASS: auth, migration, best ranking, negative values, passwords, unknown/full rooms, host permissions, readiness, shared world, inputs, push, win/loss, rematch, disconnect, expiry, SQLite persistence');
} finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
