import * as Phaser from 'phaser';
import { createOceanBackdrop, createIsland } from '../visuals/ocean.js';
import { buildBoat } from '../visuals/boat.js';
import { bindKey } from '../ui/kit.js';
import { audio } from '../services/audio.js';
import { getPlayer } from '../services/player.js';
import { activeMission } from '../data/progression.js';
import { screen, action, stats, element } from '../ui/screen.js';
import { canStartGameplay } from '../ui/mobile.js';
import { openHarbor } from '../../platform/navigation.js';
export default class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        const p = getPlayer(); if (!p.name) { this.scene.start('ProfileScene'); return; }
        this.waves = createOceanBackdrop(this); createIsland(this, 743, 173, 1.15);
        this.previewBoat = buildBoat(this, p.selectedBoat, 716, 283, 2.7).setDepth(30);
        const ui = screen(this, 'PIXEL WAKE', `Bienvenido a bordo, ${p.name}.`, { menu: true });
        const play = () => { if (!canStartGameplay(ui.message)) return; audio.unlock(); this.scene.start('GameScene'); };
        action(ui.card, '▶ JUGAR', play, true);
        action(ui.card, '⚔ MULTIJUGADOR', () => this.scene.start('MultiplayerMenuScene'));
        const row = element('div', '', 'button-row'); ui.card.append(row);
        action(row, 'GARAJE', () => this.scene.start('GarageScene')); action(row, 'RANKING', () => this.scene.start('RankingScene'));
        const row2 = element('div', '', 'button-row'); ui.card.append(row2);
        action(row2, 'PERFIL', () => this.scene.start('ProfileScene', { view: true })); action(row2, 'BITÁCORA', () => this.scene.start('JournalScene'));
        action(ui.card, 'AJUSTES', () => this.scene.start('SettingsScene'));
        action(ui.card, '← CENTRO NÁUTICO', openHarbor);
        stats(ui.card, [['RÉCORD', `${p.bestDistance} m`], ['PUNTOS', p.bestScore], ['MONEDAS', p.coins]]);
        const mission = activeMission(p.progress); if (mission) ui.card.append(element('p', `○ ${mission.description} · +${mission.reward} monedas`, 'small'));
        bindKey(this, 'keydown-SPACE', play);
    }
    update(time, delta) {
        for (const w of this.waves || []) { w.object.x -= 42 * w.speedFactor * delta / 1000; if (w.object.x < -w.width) w.object.x = 960 + w.width; }
        if (this.previewBoat) this.previewBoat.y = 283 + Math.sin(time / 650) * 4;
    }
}
