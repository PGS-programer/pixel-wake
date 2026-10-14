import * as Phaser from 'phaser';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { getPlayer, createPlayer, renamePlayer, syncPlayer, syncStatus } from '../services/player.js';
import { screen, form, input, submit, action, stats, back, element } from '../ui/screen.js';
export default class ProfileScene extends Phaser.Scene {
    constructor() { super('ProfileScene'); }
    init(data) { this.view = !!data?.view; }
    create() {
        const p = getPlayer();
        if (p.name && !this.view) { syncPlayer().catch(() => {}); this.scene.start('MenuScene'); return; }
        createOceanBackdrop(this);
        const ui = screen(this, p.name ? 'TU PERFIL' : 'CREA TU PERFIL', p.name ? 'Tu progreso local y tu copia en el servidor.' : 'Elige un alias. Conservaremos tus monedas, barcos y récords anteriores.');
        const f = form(ui.card, async () => {
            try { if (p.name) renamePlayer(name.value); else createPlayer(name.value); syncPlayer().catch(() => {}); this.scene.start('MenuScene'); }
            catch (e) { ui.message(e.message, true); }
        });
        const name = input(f, 'NOMBRE DE JUGADOR', { maxLength: 15, value: p.name, autocomplete: 'nickname', placeholder: 'Tu alias · 3 a 15 caracteres' });
        submit(f, p.name ? 'GUARDAR NOMBRE' : 'CONTINUAR →');
        if (p.name) {
            stats(ui.card, [['DISTANCIA', `${p.bestDistance} m`], ['PUNTOS', p.bestScore], ['MONEDAS', p.coins], ['PARTIDAS', p.gamesPlayed], ['VICTORIAS', p.wins], ['DERROTAS', p.losses]]);
            ui.card.append(element('p', `ID: ${p.id}`, 'small'));
            const refresh = () => ui.message(syncStatus() === 'conflicto' ? 'Otra sesión cambió el perfil: se conserva la versión del servidor. La copia local anterior está guardada para recuperación.' : `Guardado: ${syncStatus()}. Sin Internet puedes seguir jugando.`);
            window.addEventListener('pixelwake:profile', refresh); this.events.once('shutdown', () => window.removeEventListener('pixelwake:profile', refresh)); refresh();
            action(ui.card, 'SINCRONIZAR AHORA', async () => { try { await syncPlayer(); this.scene.restart({ view: true }); } catch { ui.message('Sin conexión. El progreso sigue guardado en este dispositivo.', true); } });
            back(this, ui.card);
        }
    }
}
