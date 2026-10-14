import { randomBytes, randomInt, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { newMatch, stepMatch, snapshot, STEP } from '../src/game/multiplayer/simulation.js';
const scrypt = promisify(derive);
export class Rooms {
    constructor(store) { this.store = store; this.rooms = new Map(); this.clients = new Map(); }
    send(ws, type, payload = {}) { if (ws?.readyState === 1 && ws.bufferedAmount < 256_000) ws.send(JSON.stringify({ type, ...payload })); }
    public(room) {
        return { roundId: room.roundId, code: room.code, name: room.name, host: room.host, guest: room.guest, status: room.status,
            players: [room.host, room.guest].filter(Boolean).map(id => { const p = this.store.get(id); return { id, name: p.name, boat: p.selectedBoat, ready: !!room.ready[id], rematch: !!room.rematch[id] }; }) };
    }
    broadcast(room, type, payload) { for (const id of [room.host, room.guest]) this.send(this.clients.get(id), type, payload); }
    changed(room) { this.broadcast(room, 'room', { room: this.public(room) }); }
    async handle(ws, msg) {
        const id = ws.playerId;
        if (msg.type === 'create') {
            if (ws.room || this.rooms.size >= 100) throw new Error('Ya estás en una sala o el servidor está lleno.');
            if (typeof msg.password !== 'string' || msg.password.length < 4 || msg.password.length > 64) throw new Error('La contraseña debe tener entre 4 y 64 caracteres.');
            const name = String(msg.name || 'Travesía 1v1').normalize('NFKC').replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 24);
            const salt = randomBytes(16), secret = await scrypt(msg.password, salt, 32);
            if (ws.readyState !== 1) return;
            let code; do { code = randomBytes(4).toString('hex').slice(0, 6).toUpperCase(); } while (this.rooms.has(code));
            const room = { code, name, salt, secret, host: id, guest: null, ready: {}, rematch: {}, status: 'waiting', lastActivity: Date.now(), createdAt: Date.now(), match: null };
            this.rooms.set(code, room); ws.room = code; this.changed(room); return;
        }
        if (msg.type === 'join') {
            if (ws.room) throw new Error('Sal de tu sala antes de entrar en otra.');
            const code = String(msg.code || '').replace(/^PW-/i, '').toUpperCase().trim(), room = this.rooms.get(code);
            if (!room) throw new Error('La sala no existe o ha caducado.');
            if (room.guest) throw new Error('La sala está llena.');
            if (room.status === 'playing') throw new Error('La partida ya ha comenzado.');
            if (typeof msg.password !== 'string' || msg.password.length > 64) throw new Error('Contraseña incorrecta.');
            const secret = await scrypt(msg.password, room.salt, 32);
            if (!timingSafeEqual(secret, room.secret)) throw new Error('Contraseña incorrecta.');
            if (ws.readyState !== 1) return;
            if (room.guest || !this.rooms.has(code)) throw new Error('La sala ya no está disponible.');
            room.guest = id; room.status = 'lobby'; room.lastActivity = Date.now(); room.ready = {}; ws.room = code; this.changed(room); return;
        }
        const room = this.rooms.get(ws.room); if (!room) throw new Error('No estás en una sala.');
        room.lastActivity = Date.now();
        if (msg.type === 'leave') { this.leave(ws); return; }
        if (msg.type === 'ready') { if (room.status === 'playing') return; room.ready[id] = msg.ready === true; this.changed(room); return; }
        if (msg.type === 'start') {
            if (id !== room.host) throw new Error('Solo el creador puede iniciar.');
            if (room.status === 'playing') throw new Error('Ya hay una partida en curso.');
            if (!room.guest || !room.ready[room.host] || !room.ready[room.guest]) throw new Error('Ambos jugadores deben estar listos.');
            this.start(room); return;
        }
        if (msg.type === 'input' && room.status === 'playing') {
            if (msg.roundId !== room.roundId) return;
            const p = room.match.players.find(p => p.id === id);
            if (!Number.isSafeInteger(msg.seq) || msg.seq <= p.inputSeq || !Number.isFinite(msg.direction) || Math.abs(msg.direction) > 1) return;
            p.direction = msg.direction; p.inputSeq = msg.seq; p.lastInput = Date.now(); return;
        }
        if (msg.type === 'rematch' && room.status === 'finished') {
            room.rematch[id] = true; this.changed(room);
            if (room.guest && room.rematch[room.host] && room.rematch[room.guest]) this.start(room);
        }
        if (msg.type === 'lobby' && room.status === 'finished') { room.status = room.guest ? 'lobby' : 'waiting'; room.ready = {}; room.rematch = {}; this.changed(room); }
    }
    start(room) {
        room.roundId = randomBytes(16).toString('hex'); room.match = newMatch(randomInt(0, 0x100000000), [room.host, room.guest].map(id => { const p = this.store.get(id); return { id, name: p.name, boat: p.selectedBoat }; }));
        room.status = 'playing'; room.rematch = {}; room.lastActivity = Date.now(); this.changed(room); this.broadcast(room, 'state', { roundId: room.roundId, state: snapshot(room.match) });
    }
    finish(room, winner, reason) {
        if (room.status !== 'playing') return;
        room.match.result = { winner, reason }; room.status = 'finished'; room.rematch = {}; room.ready = {};
        this.store.finish(room.roundId, room, winner, reason);
        this.broadcast(room, 'state', { roundId: room.roundId, state: snapshot(room.match) }); this.changed(room);
        for (const id of [room.host, room.guest]) this.send(this.clients.get(id), 'profile', { profile: this.store.get(id) });
    }
    tick(broadcast) {
        const now = Date.now();
        for (const room of this.rooms.values()) {
            if (room.status === 'playing') {
                for (const p of room.match.players) if (!p.lastInput || now - p.lastInput > 500) p.direction = 0;
                stepMatch(room.match, STEP); room.lastActivity = now;
                if (room.match.result) this.finish(room, room.match.result.winner, room.match.result.reason);
                else if (broadcast) this.broadcast(room, 'state', { roundId: room.roundId, state: snapshot(room.match) });
            } else if (now - room.lastActivity > 10 * 60_000) this.closeRoom(room, 'La sala ha caducado por inactividad.');
        }
    }
    closeRoom(room, reason) {
        this.broadcast(room, 'closed', { message: reason });
        for (const id of [room.host, room.guest]) { const ws = this.clients.get(id); if (ws) ws.room = null; }
        this.rooms.delete(room.code);
    }
    leave(ws) {
        const room = this.rooms.get(ws.room); ws.room = null;
        if (!room) return;
        if (room.status === 'playing') this.finish(room, ws.playerId === room.host ? room.guest : room.host, 'disconnect');
        if (ws.playerId === room.host) this.closeRoom(room, 'El creador ha salido. La sala se ha cerrado.');
        else { room.guest = null; room.status = 'waiting'; room.ready = {}; room.rematch = {}; this.changed(room); this.send(ws, 'left'); }
    }
    disconnect(ws) { this.leave(ws); if (this.clients.get(ws.playerId) === ws) this.clients.delete(ws.playerId); }
}
