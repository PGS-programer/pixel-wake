import * as Phaser from 'phaser';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { buildBoat } from '../visuals/boat.js';
import { buildObstacle } from '../entities/obstacle.js';
import { label, bindKey } from '../ui/kit.js';
import { screen, action, element } from '../ui/screen.js';
import { mobileControls, portraitTouch } from '../ui/mobile.js';
import { getSettings } from '../services/preferences.js';
import { getPlayer } from '../services/player.js';
import { audio } from '../services/audio.js';
import { network } from '../multiplayer/network.js';
import { movePlayer } from '../multiplayer/simulation.js';
import { effectsMethods } from '../systems/effects.js';
export default class MultiplayerGameScene extends Phaser.Scene {
    constructor() { super('MultiplayerGameScene'); }
    create() {
        this.roundId = network.room?.roundId; this.finished = false; this.localId = getPlayer().id; this.state = null; this.pendingInputs = [];
        this.gameWidth = 960; this.DEPTH_WORLD = 10; this.DEPTH_PARTICLES = 50; this.settings = getSettings(); this.particles = [];
        this.waves = createOceanBackdrop(this); this.views = new Map(); this.hazards = new Map(); this.seq = 0; this.inputTimer = 0; this.direction = 0;
        this.cursor = this.input.keyboard.createCursorKeys(); this.keys = this.input.keyboard.addKeys({ up: 'W', down: 'S' });
        this.add.rectangle(480, 45, 960, 90, 0x092c37, .97).setDepth(100);
        this.hud = label(this, 35, 18, 'CONECTANDO LA TRAVESÍA…', 18); this.hud2 = label(this, 35, 49, '', 15, '#93bdbe');
        this.statusText = label(this, 480, 477, 'W/S o ↑/↓ · Acércate al rival para empujarlo', 13).setOrigin(.5).setBackgroundColor('#092c37').setPadding(8);
        const neutral = () => { this.direction = 0; network.send('input', { seq: ++this.seq, direction: 0 }); };
        mobileControls(this, { multiplayer: true, neutral });
        this.touchTarget = null;
        const target = p => { if (p.wasTouch && p.isDown && p.y > 95 && p.y < 460) this.touchTarget = p.y; };
        const release = () => { this.touchTarget = null; };
        this.input.on('pointerdown', target); this.input.on('pointermove', target); this.input.on('pointerup', release); this.input.on('pointerupoutside', release);
        this.events.once('shutdown', () => { neutral(); this.input.off('pointerdown', target); this.input.off('pointermove', target); this.input.off('pointerup', release); this.input.off('pointerupoutside', release); });
        network.on(this, 'state', msg => this.receive(msg));
        network.on(this, 'room', ({ room }) => { if (room.status === 'playing' && room.roundId !== this.roundId) this.scene.restart(); });
        network.on(this, 'error', ({ message }) => this.statusText.setText(message));
        network.on(this, 'closed', ({ message }) => { if (!this.finished) this.connectionLost(message); });
        network.on(this, 'offline', ({ message }) => this.connectionLost(message));
        bindKey(this, 'keydown-ESC', () => this.connectionLost('¿Salir de la partida? Si abandonas, gana tu rival.'));
        if (network.state && network.roundId === this.roundId) this.receive({ state: network.state, roundId: network.roundId });
    }
    visualBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    receive({ state, roundId }) {
        if (roundId !== this.roundId) return;
        this.state = state; this.receivedAt = performance.now();
        for (const p of state.players) {
            let view = this.views.get(p.id);
            if (!view) {
                const color = state.players[0].id === p.id ? '#ffd166' : '#69e6e2';
                const boat = buildBoat(this, p.boat, 170, p.y).setDepth(p.id === this.localId ? 32 : 30);
                const ring = this.add.rectangle(170, p.y, 88, 34).setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color, .7).setFillStyle(0, 0).setDepth(31);
                const name = label(this, 170, p.y - 39, `${p.name}${p.id === this.localId ? ' ▼' : ''}`, 11, color, 60).setOrigin(.5);
                view = { boat, ring, name, y: p.y, impulse: p.impulse, target: p.y, wasAlive: true, combo: 0 }; this.views.set(p.id, view);
            }
            view.target = p.y;
            if (p.id === this.localId) {
                // Replay unacknowledged 50 ms input slices over the authoritative state.
                this.pendingInputs = this.pendingInputs.filter(i => i.seq > p.inputSeq);
                const predicted = { y: p.y, impulse: p.impulse };
                for (const input of this.pendingInputs) movePlayer(predicted, input.direction, .05);
                view.correction = predicted.y; view.impulse = p.impulse;
            }
            if (view.wasAlive && !p.alive) { this.createBurst(170, p.y, 20, [0xffffff, 0x71d8ef, 0xffd166], 160); audio.play('crash'); }
            if (p.combo > view.combo) { this.createBurst(170, p.y, 8, [0xffffff, 0x73d8f3], 100); if (p.id === this.localId) audio.play('near', p.combo); }
            view.wasAlive = p.alive; view.combo = p.combo;
        }
        const ids = new Set(state.obstacles.map(o => o.id));
        for (const [id, view] of this.hazards) if (!ids.has(id)) { view.destroy(); this.hazards.delete(id); }
        for (const o of state.obstacles) { if (!this.hazards.has(o.id)) this.hazards.set(o.id, buildObstacle(this, o)); this.hazards.get(o.id).target = o; }
        if (state.bump !== this.bump && this.bump !== undefined) { this.createBurst(170, (state.players[0].y + state.players[1].y) / 2, 10, [0xffffff, 0x73d8f3], 100); audio.play('tap'); if (!this.settings.reducedEffects) this.cameras.main.shake(60, .0015); }
        this.bump = state.bump;
        if (state.result && !this.finished) this.showResult(state.result);
    }
    showResult(result) {
        this.finished = true; this.mobileDirection = 0;
        const title = result.winner === null ? 'EMPATE' : result.winner === this.localId ? 'VICTORIA' : 'DERROTA';
        const winner = this.state.players.find(p => p.id === result.winner);
        const ui = screen(this, title, result.reason === 'disconnect' ? 'El rival se ha desconectado.' : winner ? `${winner.name} ha ganado la travesía.` : 'Ningún barco llegó más lejos.');
        this.resultUi = ui; ui.card.append(element('p', 'Las estadísticas se registran una sola vez en el servidor.'));
        action(ui.card, 'REVANCHA', () => { if (!network.room?.guest) { ui.message('Esperando a un rival en el lobby.', true); return; } network.send('rematch'); ui.message('Revancha solicitada. Esperando al rival…'); }, true);
        action(ui.card, 'VOLVER AL LOBBY', () => { network.send('lobby'); this.scene.start(network.room ? 'LobbyScene' : 'MultiplayerMenuScene'); });
        action(ui.card, 'SALIR', () => { network.leave(); this.scene.start('MenuScene'); }); audio.play(title === 'VICTORIA' ? 'reward' : 'tap');
    }
    connectionLost(message) {
        if (this.finished && this.resultUi) { this.resultUi.message(message, true); return; }
        if (this.lostUi) { this.lostUi.message(message, true); return; }
        this.direction = 0; network.send('input', { seq: ++this.seq, direction: 0 });
        const ui = screen(this, 'CONEXIÓN / SALIR', message); this.lostUi = ui;
        if (network.status === 'online' && !this.finished) action(ui.card, 'SEGUIR JUGANDO', () => { ui.destroy(); this.lostUi = null; });
        action(ui.card, 'SALIR AL MENÚ', () => { network.leave(); this.scene.start('MenuScene'); }, true);
    }
    update(time, delta) {
        delta = Math.min(delta, 40); this.updateParticles(delta);
        const s = this.state; if (!s) return;
        for (const wave of this.waves) { wave.object.x -= s.speed * wave.speedFactor * delta / 1000; if (wave.object.x < -wave.width) wave.object.x = 960 + wave.width; }
        const self = s.players.find(p => p.id === this.localId), local = this.views.get(this.localId);
        let dir = this.mobileDirection || Number(this.cursor.down.isDown || this.keys.down.isDown) - Number(this.cursor.up.isDown || this.keys.up.isDown);
        if (!this.mobileDirection && this.touchTarget !== null && local) dir = Math.max(-1, Math.min(1, (this.touchTarget - local.y) / 12));
        if (this.finished || this.lostUi || portraitTouch() || document.hidden) dir = 0;
        this.direction = dir;
        this.inputTimer += delta;
        if (this.inputTimer >= 50 && !this.finished) {
            this.inputTimer %= 50; const seq = ++this.seq; network.send('input', { seq, direction: dir });
            if (!this.finished) { this.pendingInputs.push({ seq, direction: dir }); if (this.pendingInputs.length > 20) this.pendingInputs.shift(); }
        }
        for (const p of s.players) {
            const v = this.views.get(p.id); if (!v) continue;
            if (p.id === this.localId && p.alive && !this.finished) {
                movePlayer(v, dir, delta / 1000);
                if (v.correction !== undefined) { v.y += (v.correction - v.y) * (1 - Math.exp(-10 * delta / 1000)); v.correction += dir * 420 * delta / 1000; v.correction = Math.max(110, Math.min(446, v.correction)); }
            } else v.y += (v.target - v.y) * (1 - Math.exp(-20 * delta / 1000));
            v.boat.setPosition(170, v.y).setAlpha(p.alive ? 1 : .25); v.ring.setPosition(170, v.y).setAlpha(p.alive ? 1 : .2); v.name.setPosition(170, Math.max(105, v.y - 39));
        }
        const extrapolate = this.finished ? 0 : Math.min(100, performance.now() - this.receivedAt) / 1000;
        for (const view of this.hazards.values()) {
            const o = view.target; view.x = o.x - s.speed * o.speedFactor * extrapolate; view.y += (o.y - view.y) * (1 - Math.exp(-20 * delta / 1000));
            view.foam.scaleX = 1 + Math.sin(time / 120) * .08;
            if (view.warning) view.warning.setPosition(939, view.y).setVisible(view.x > 960 && view.x < 1210);
        }
        this.hud.setText(s.players.map(p => `${p.name} · ${p.alive ? 'A FLOTE' : 'FUERA'} · x${p.combo}`).join('     VS     '));
        this.hud2.setText(`${Math.floor(s.distance)} m  /  NIVEL ${s.level}     ${s.players.map(p => `${p.name}: ${Math.floor(p.score)} pts`).join('   ·   ')}`);
    }
}
Object.assign(MultiplayerGameScene.prototype, { createBurst: effectsMethods.createBurst, updateParticles: effectsMethods.updateParticles });
