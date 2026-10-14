import { touchDevice } from '../ui/mobile.js';
import { settingsScreen } from '../ui/mobileMenus.js';
import * as Phaser from 'phaser';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { label, panel, button, header, enter, bindKey } from '../ui/kit.js';
import { getSettings, saveSettings } from '../services/preferences.js';
import { audio } from '../services/audio.js';
export default class SettingsScene extends Phaser.Scene {
    constructor() { super('SettingsScene'); }
    create() {
        if (touchDevice()) { createOceanBackdrop(this); settingsScreen(this); return; }
        enter(this); createOceanBackdrop(this); header(this, 'A tu ritmo.', 'AJUSTES / Se guardan en este navegador.');
        panel(this, 480, 300, 888, 296);
        label(this, 66, 180, 'SONIDO', 14, '#46dfc1');
        label(this, 66, 208, 'Pequeñas notas, grandes momentos.', 14);
        const s = getSettings();
        button(this, 778, 211, s.muted ? 'SILENCIADO' : 'ACTIVADO', () => { saveSettings({ muted: !s.muted }); this.scene.restart(); }, { width: 220 });
        label(this, 66, 270, 'VOLUMEN', 14, '#46dfc1');
        [0, 0.25, 0.5, 0.75, 1].forEach((v, i) => button(this, 532 + i * 80, 287, `${v * 100}%`, () => { saveSettings({ volume: v }); audio.play('coin'); this.scene.restart(); }, { width: 70, height: 42, primary: Math.abs(s.volume - v) < 0.13, size: 13 }));
        label(this, 66, 352, 'EFECTOS SUAVES', 14, '#46dfc1');
        label(this, 66, 378, 'Reduce partículas, destellos y vibración.', 13, '#93bdbe');
        button(this, 778, 376, s.reducedEffects ? 'ACTIVADOS' : 'DESACTIVADOS', () => { saveSettings({ reducedEffects: !s.reducedEffects }); this.scene.restart(); }, { width: 220 });
        button(this, 158, 495, '← MENÚ', () => this.scene.start('MenuScene'), { width: 244 });
        label(this, 400, 486, 'P / ESC: PAUSA    ·    H: HITBOXES', 13);
        label(this, 400, 510, 'TÁCTIL: ARRASTRA EN EL MAR PARA MOVERTE', 11, '#93bdbe');
        bindKey(this, 'keydown-ESC', () => this.scene.start('MenuScene'));
    }
}
