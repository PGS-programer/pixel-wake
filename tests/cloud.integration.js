import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import WebSocket from 'ws';
const root = process.env.BACKEND_TEST_URL || 'http://127.0.0.1:8787';
const accounts = [];
async function call(path, method = 'GET', body, user = accounts[0]) {
    const res = await fetch(root + path, { method, headers: { 'content-type': 'application/json', ...(user ? { authorization: `Bearer ${user.id}.${user.token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json(); if (res.status >= 500) throw new Error(JSON.stringify(data)); return { status: res.status, data };
}
function channel(user) {
    const ws = new WebSocket(root.replace(/^http/, 'ws') + '/socket', { origin: 'https://pgs-programer.github.io' }), queue = [], pending = [];
    ws.on('message', raw => { const msg = JSON.parse(raw); if (msg.type === 'ping') { ws.send(JSON.stringify({ type: 'pong' })); return; } const i = pending.findIndex(p => p.test(msg)); if (i >= 0) { const p = pending.splice(i, 1)[0]; clearTimeout(p.timer); p.resolve(msg); } else queue.push(msg); });
    const wait = test => { const i = queue.findIndex(test); if (i >= 0) return Promise.resolve(queue.splice(i, 1)[0]); return new Promise((resolve, reject) => { const p = { test, resolve, timer: setTimeout(() => reject(new Error('WebSocket timeout')), 15000) }; pending.push(p); }); };
    ws.on('open', () => ws.send(JSON.stringify({ type: 'auth', ...user })));
    return { ws, wait, send: (type, payload = {}) => ws.send(JSON.stringify({ type, ...payload })) };
}
assert.equal((await call('/api/health')).data.ok, true);
for (const name of ['CLOUD_HOST', 'CLOUD_GUEST']) {
    const a = { id: randomUUID(), token: randomBytes(32).toString('hex') }; accounts.push(a);
    assert.equal((await call('/api/identity', 'POST', { ...a, profile: { name, coins: 25, bestScore: 1200, bestDistance: 500, gamesPlayed: 1 } })).status, 200);
}
const own = (await call('/api/profile')).data.profile;
assert.equal((await call('/api/profile', 'PUT', { ...own, bestScore: 2000 })).status, 200);
assert.equal((await call('/api/ranking')).data.me.bestScore, 2000);
const host = channel(accounts[0]), guest = channel(accounts[1]);
try {
    await Promise.all([host.wait(m => m.type === 'authenticated'), guest.wait(m => m.type === 'authenticated')]);
    host.send('create', { name: 'Cloud QA', password: 'cloud-secret7' }); const { room } = await host.wait(m => m.type === 'room');
    guest.send('join', { code: room.code, password: 'bad' }); assert.match((await guest.wait(m => m.type === 'error')).message, /incorrecta/);
    guest.send('join', { code: room.code, password: 'cloud-secret7' }); await guest.wait(m => m.type === 'room' && m.room.guest);
    host.send('ready', { ready: true }); guest.send('ready', { ready: true }); await host.wait(m => m.type === 'room' && m.room.players.every(p => p.ready));
    host.send('start'); const a = await host.wait(m => m.type === 'state'), b = await guest.wait(m => m.type === 'state'); assert.deepEqual(a.state.obstacles, b.state.obstacles); assert.equal(a.state.seed, b.state.seed);
    let seq = 0;
    const inputs = setInterval(() => host.send('input', { roundId: a.roundId, seq: ++seq, direction: seq <= 6 ? 1 : 0 }), 50);
    await host.wait(m => m.type === 'state' && m.state.bump > 0);
    clearInterval(inputs);
    // A socket disconnect must resolve once and persist the result in hosted SQL.
    guest.ws.close(); const result = await host.wait(m => m.type === 'state' && m.state.result); assert.equal(result.state.result.winner, accounts[0].id);
    assert.equal((await call('/api/profile')).data.profile.wins, 1); assert.equal((await call('/api/profile', 'GET', undefined, accounts[1])).data.profile.losses, 1);
    host.send('leave');
    console.log('PASS: Cloudflare runtime, persistent SQL, identity, best ranking, password hashing, shared world, inputs, push, disconnect, win/loss');
} finally { host.ws.close(); guest.ws.close(); }
