import { syncPlayer, credentials, backendBase, applyServerStats } from '../services/player.js';
class Network extends EventTarget {
    constructor() { super(); this.ws = null; this.room = null; this.state = null; this.roundId = null; this.status = 'offline'; this.pending = null; }
    emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail })); }
    async connect() {
        if (this.status === 'online' && this.ws?.readyState === WebSocket.OPEN) return;
        if (this.pending) return this.pending;
        this.pending = (async () => {
            await syncPlayer();
            const url = new URL(backendBase() || location.origin); url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'; url.pathname = '/socket'; url.search = ''; url.hash = '';
            await new Promise((resolve, reject) => {
                let complete = false;
                const ws = new WebSocket(url); this.ws = ws; this.status = 'connecting';
                const timeout = setTimeout(() => { if (!complete) { complete = true; reject(new Error('El servidor no responde.')); ws.close(); } }, 7000);
                ws.addEventListener('open', () => ws.send(JSON.stringify({ type: 'auth', ...credentials() })));
                ws.addEventListener('message', e => {
                    let msg; try { msg = JSON.parse(e.data); } catch { return; }
                    if (msg.type === 'authenticated') { complete = true; clearTimeout(timeout); this.status = 'online'; resolve(); }
                    if (msg.type === 'room') this.room = msg.room;
                    if (msg.type === 'state') { this.state = msg.state; this.roundId = msg.roundId; this.receivedAt = performance.now(); }
                    if (msg.type === 'profile') applyServerStats(msg.profile);
                    if (['closed', 'left'].includes(msg.type)) this.room = null;
                    this.emit(msg.type, msg);
                });
                ws.addEventListener('close', e => {
                    clearTimeout(timeout); this.status = 'offline'; this.room = null;
                    const message = e.reason || 'Se perdió la conexión con el servidor.';
                    if (!complete) { complete = true; reject(new Error(message)); }
                    this.emit('offline', { message });
                });
                ws.addEventListener('error', () => { if (!complete) { complete = true; clearTimeout(timeout); reject(new Error('No se pudo conectar. Comprueba que el backend está iniciado.')); } });
            });
        })().finally(() => { this.pending = null; });
        return this.pending;
    }
    send(type, payload = {}) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type, ...(type === 'input' ? { roundId: this.roundId } : {}), ...payload })); }
    leave() { this.send('leave'); this.room = null; this.state = null; }
    on(scene, type, fn) { const handler = e => fn(e.detail); this.addEventListener(type, handler); scene.events.once('shutdown', () => this.removeEventListener(type, handler)); }
}
export const network = new Network();
