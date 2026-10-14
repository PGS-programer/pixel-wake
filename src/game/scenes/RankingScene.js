import * as Phaser from 'phaser';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { request, syncPlayer } from '../services/player.js';
import { screen, action, back, element } from '../ui/screen.js';
export default class RankingScene extends Phaser.Scene {
    constructor() { super('RankingScene'); }
    create() {
        createOceanBackdrop(this); const ui = screen(this, 'RANKING GLOBAL', 'Un mejor resultado por jugador. Puntuaciones individuales.');
        const tabs = element('div', '', 'button-row'); ui.card.append(tabs);
        const content = element('div'); ui.card.append(content); let serial = 0;
        const load = async metric => {
            const ticket = ++serial; content.replaceChildren(element('p', 'Conectando…'));
            try {
                await syncPlayer(); const data = await request(`/api/ranking?metric=${metric}`);
                if (!this.sys.isActive() || ticket !== serial) return;
                content.replaceChildren(); const table = element('table'), head = element('tr');
                for (const text of ['POS.', 'JUGADOR', metric === 'distance' ? 'METROS' : 'PUNTOS']) head.append(element('th', text));
                const thead = element('thead'); thead.append(head); table.append(thead); const tbody = element('tbody');
                for (const row of data.rows) { const tr = element('tr'); [row.position, row.playerName, metric === 'distance' ? row.bestDistance : row.bestScore].forEach(value => tr.append(element('td', String(value)))); tbody.append(tr); }
                table.append(tbody); content.append(table);
                content.append(element('p', data.me ? `MI POSICIÓN: ${data.me.position} · ${data.me.playerName} · ${metric === 'distance' ? data.me.bestDistance + ' m' : data.me.bestScore + ' pts'}` : 'Completa una partida para aparecer.', 'notice'));
                ui.message('Ranking del servidor conectado. Los resultados offline se envían al recuperar conexión.');
            } catch { if (this.sys.isActive() && ticket === serial) { content.replaceChildren(element('p', 'Ranking no disponible sin conexión. Tus récords locales siguen guardados.', 'error')); } }
        };
        action(tabs, 'PUNTOS', () => load('score'), true); action(tabs, 'DISTANCIA', () => load('distance')); action(ui.card, 'ACTUALIZAR', () => load('score')); back(this, ui.card);
        load('score');
    }
}
