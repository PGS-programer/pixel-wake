import { touchDevice } from '../ui/mobile.js';
import { garageScreen } from '../ui/mobileMenus.js';
import * as Phaser from 'phaser';
import { BOATS } from '../data/boats.js';
import { STORAGE_KEYS } from '../config.js';
import { safeLoadNumber, safeSaveNumber, safeLoadString, safeSaveString, loadUnlockedBoats, saveUnlockedBoats } from '../services/storage.js';
import { getSettings, saveSettings } from '../services/preferences.js';
import { loadProgress } from '../services/progress.js';
import { availableTrails } from '../data/progression.js';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { buildBoat } from '../visuals/boat.js';
import { label, panel, button, header, enter, bindKey } from '../ui/kit.js';
import { audio } from '../services/audio.js';
export default class GarageScene extends Phaser.Scene {
    constructor() { super('GarageScene'); }
    init(data) { this.message = data?.message || 'Misma velocidad. Mismo riesgo. Tu propio estilo.'; }
    create() {
        if (touchDevice()) { createOceanBackdrop(this); garageScreen(this); return; }
        enter(this); createOceanBackdrop(this); header(this, 'Encuentra tu estela.', 'GARAJE / Una flota con carácter. Todas las mejoras son cosméticas.');
        const wallet = safeLoadNumber(STORAGE_KEYS.coins), unlocked = loadUnlockedBoats();
        const raw = safeLoadString(STORAGE_KEYS.selectedBoat, 'coastal');
        const selected = unlocked.includes(raw) ? raw : 'coastal';
        label(this, 920, 67, `${wallet} MONEDAS`, 21, '#ffd166').setOrigin(1, 0);
        BOATS.forEach((boat, i) => {
            const x = 147 + i * 222, owned = unlocked.includes(boat.id), active = selected === boat.id;
            panel(this, x, 278, 206, 276, active ? 0x18565b : 0x103f49);
            if (active) this.add.rectangle(x, 142, 206, 4, 0xffd166).setDepth(100);
            label(this, x - 85, 161, `0${i + 1} / ${active ? 'A BORDO' : owned ? 'TU FLOTA' : 'POR DESCUBRIR'}`, 10, active ? '#ffd166' : '#93bdbe');
            label(this, x - 85, 191, boat.name, 22);
            const preview = buildBoat(this, boat.id, x + 5, 262, 1.5).setDepth(100);
            preview.list[0].scaleX = 0.55;
            preview.list[1].scaleX = 0.65;
            label(this, x, 305, boat.tagline, 12, '#a5d8d1').setOrigin(0.5);
            label(this, x, 330, owned ? 'PROPIEDAD DE TU FLOTA' : `${boat.price} MONEDAS`, 10, '#ffd166').setOrigin(0.5);
            button(this, x, 380, active ? '✓ SELECCIONADO' : owned ? 'ELEGIR' : wallet >= boat.price ? 'DESBLOQUEAR' : `FALTAN ${boat.price - wallet}`, () => {
                if (!owned && wallet < boat.price) { audio.play('crash'); this.status.setText(`Te faltan ${boat.price - wallet} monedas. Completa misiones en la bitácora.`); return; }
                if (!owned) { safeSaveNumber(STORAGE_KEYS.coins, wallet - boat.price); saveUnlockedBoats([...unlocked, boat.id]); audio.play('reward'); }
                safeSaveString(STORAGE_KEYS.selectedBoat, boat.id);
                this.scene.restart({ message: owned ? `${boat.name}, listo para zarpar.` : `¡${boat.name} desbloqueado! Bienvenido a tu flota.` });
            }, { width: 178, height: 42, size: 12, primary: active || (!owned && wallet >= boat.price) });
        });
        const trails = availableTrails(loadProgress()), selectedTrail = getSettings().trail;
        label(this, 43, 442, 'TU ESTELA', 11, '#46dfc1');
        for (const [i, id, title] of [[0, 'foam', 'ESPUMA'], [1, 'mint', 'MENTA · COMBO x3'], [2, 'gold', 'ORO · 1.000 m']]) {
            const allowed = trails.includes(id);
            button(this, 310 + i * 237, 450, `${allowed ? selectedTrail === id ? '✓ ' : '' : '◇ '}${title}`, () => {
                if (!allowed) { this.status.setText('Consigue la insignia correspondiente en la bitácora.'); return; }
                saveSettings({ trail: id }); this.scene.restart({ message: 'Nueva estela equipada.' });
            }, { width: 220, height: 34, size: 11, primary: allowed && selectedTrail === id });
        }
        button(this, 133, 505, '← MENÚ', () => this.scene.start('MenuScene'), { width: 180, height: 40 });
        this.status = label(this, 250, 500, this.message, 12, '#fff4d9');
        bindKey(this, 'keydown-ESC', () => this.scene.start('MenuScene'));
    }
}
