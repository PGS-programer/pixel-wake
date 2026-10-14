import { touchDevice } from '../ui/mobile.js';
import { journalScreen } from '../ui/mobileMenus.js';
import * as Phaser from 'phaser';
import { MISSIONS, ACHIEVEMENTS } from '../data/progression.js';
import { loadProgress } from '../services/progress.js';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { label, panel, button, header, enter, progressBar, bindKey } from '../ui/kit.js';
export default class JournalScene extends Phaser.Scene {
    constructor() { super('JournalScene'); }
    create() {
        if (touchDevice()) { createOceanBackdrop(this); journalScreen(this); return; }
        enter(this); createOceanBackdrop(this); header(this, 'Cada travesía cuenta.', 'BITÁCORA / Misiones permanentes. Sin prisas, sin rachas.');
        const p = loadProgress();
        panel(this, 311, 309, 550, 330); panel(this, 755, 309, 338, 330);
        MISSIONS.forEach((m, i) => {
            const y = 160 + i * 43, done = p.claimed.includes(m.id);
            label(this, 54, y, `${done ? '✓' : '○'} ${m.title}`, 13, done ? '#46dfc1' : '#fff4d9');
            label(this, 54, y + 18, m.description, 10, '#93bdbe');
            label(this, 545, y, done ? 'HECHO' : `+${m.reward}`, 12, '#ffd166').setOrigin(1, 0);
            progressBar(this, 406, y + 24, 140, p[m.metric] / m.target);
        });
        label(this, 607, 163, 'INSIGNIAS', 13, '#46dfc1');
        ACHIEVEMENTS.forEach((a, i) => { const y = 201 + i * 63; label(this, 607, y, `${p.achievements.includes(a.id) ? '◆' : '◇'} ${a.title}`, 14); label(this, 607, y + 23, a.detail, 10, '#93bdbe'); });
        button(this, 157, 507, '← MENÚ', () => this.scene.start('MenuScene'), { width: 240, height: 40 });
        label(this, 612, 500, `${p.runs} TRAVESÍAS  /  ${p.nearMisses} PASOS CERCANOS`, 11, '#d5f4df');
        bindKey(this, 'keydown-ESC', () => this.scene.start('MenuScene'));
    }
}
