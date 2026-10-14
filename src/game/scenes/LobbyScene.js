import * as Phaser from 'phaser';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { screen, action, element } from '../ui/screen.js';
import { network } from '../multiplayer/network.js';
import { getPlayer } from '../services/player.js';
import { canStartGameplay, portraitTouch } from '../ui/mobile.js';
export default class LobbyScene extends Phaser.Scene {
    constructor() { super('LobbyScene'); }
    create() {
        createOceanBackdrop(this); const ui = screen(this, 'LOBBY', 'Comparte el código y la contraseña por tu cuenta.');
        const content = element('div'); ui.card.append(content);
        const render = () => {
            const room = network.room; if (!room) return;
            if (room.status === 'playing') { this.scene.start('MultiplayerGameScene'); return; }
            const mine = room.players.find(p => p.id === getPlayer().id);
            content.replaceChildren(element('h2', `SALA PW-${room.code}`), element('p', room.name, 'muted'));
            for (const p of room.players) content.append(element('p', `${p.id === room.host ? 'HOST' : 'JUGADOR 2'} · ${p.name} · ${p.ready ? '✓ LISTO' : 'PREPARANDO'}`));
            if (!room.guest) content.append(element('p', 'ESPERANDO JUGADOR…', 'notice'));
            action(content, mine?.ready ? 'CANCELAR LISTO' : 'ESTOY LISTO', () => { if (!mine?.ready && !canStartGameplay(ui.message)) return; network.send('ready', { ready: !mine?.ready }); }, !mine?.ready);
            if (room.host === getPlayer().id) action(content, 'INICIAR PARTIDA', () => { if (canStartGameplay(ui.message)) network.send('start'); }, true);
            action(content, 'SALIR DE SALA', () => { network.leave(); this.scene.start('MultiplayerMenuScene'); });
        };
        network.on(this, 'room', render); network.on(this, 'error', ({ message }) => ui.message(message, true));
        const gone = ({ message }) => { content.replaceChildren(element('p', message, 'error')); action(content, 'VOLVER', () => this.scene.start('MultiplayerMenuScene')); };
        network.on(this, 'closed', gone); network.on(this, 'offline', gone);
        const orientation = () => { if (portraitTouch()) network.send('ready', { ready: false }); };
        window.addEventListener('resize', orientation); this.events.once('shutdown', () => window.removeEventListener('resize', orientation));
        render();
    }
}
