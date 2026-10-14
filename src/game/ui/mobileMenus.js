import { screen, action, back, element, input, stats } from './screen.js';
import { getPlayer } from '../services/player.js';
import { chooseBoat } from '../services/shop.js';
import { BOATS } from '../data/boats.js';
import { MISSIONS, ACHIEVEMENTS, availableTrails } from '../data/progression.js';
import { getSettings, saveSettings } from '../services/preferences.js';
import { audio } from '../services/audio.js';
export function garageScreen(scene) {
    const p = getPlayer(), ui = screen(scene, 'GARAJE', `${p.coins} monedas · Todos los barcos son cosméticos.`);
    for (const b of BOATS) {
        const owned = p.unlockedBoats.includes(b.id), card = element('div', '', 'shop-card');
        card.append(element('h2', b.name), element('p', b.tagline, 'muted'));
        action(card, p.selectedBoat === b.id ? '✓ SELECCIONADO' : owned ? 'ELEGIR' : `DESBLOQUEAR · ${b.price}`, () => {
            try { chooseBoat(b.id); audio.play('reward'); scene.scene.restart(); } catch (e) { ui.message(e.message, true); }
        }, p.selectedBoat === b.id); ui.card.append(card);
    }
    ui.card.append(element('h2', 'TU ESTELA'));
    for (const [id, text] of [['foam', 'ESPUMA'], ['mint', 'MENTA · COMBO x3'], ['gold', 'ORO · 1.000 m']]) {
        const allowed = availableTrails(p.progress).includes(id);
        action(ui.card, `${getSettings().trail === id ? '✓ ' : ''}${text}`, () => { if (!allowed) { ui.message('Consigue la insignia correspondiente en la bitácora.', true); return; } saveSettings({ trail: id }); scene.scene.restart(); });
    }
    back(scene, ui.card);
}
export function journalScreen(scene) {
    const p = getPlayer().progress, ui = screen(scene, 'BITÁCORA', 'Contratos permanentes e insignias.');
    for (const m of MISSIONS) { const card = element('div', '', 'shop-card'); card.append(element('h2', `${p.claimed.includes(m.id) ? '✓ ' : '○ '}${m.title}`), element('p', m.description), element('p', `${Math.min(p[m.metric], m.target)} / ${m.target} · +${m.reward} monedas`, 'notice')); ui.card.append(card); }
    ui.card.append(element('h2', 'INSIGNIAS'));
    for (const a of ACHIEVEMENTS) ui.card.append(element('p', `${p.achievements.includes(a.id) ? '◆' : '◇'} ${a.title} · ${a.detail}`));
    back(scene, ui.card);
}
export function settingsScreen(scene) {
    const s = getSettings(), ui = screen(scene, 'AJUSTES', 'Audio y efectos guardados en tu dispositivo.');
    const volume = input(ui.card, 'VOLUMEN', { type: 'range', value: String(s.volume) }); volume.min = '0'; volume.max = '1'; volume.step = '.05';
    volume.addEventListener('input', () => { saveSettings({ volume: Number(volume.value) }); audio.unlock(); });
    action(ui.card, s.muted ? 'SONIDO: APAGADO' : 'SONIDO: ENCENDIDO', () => { saveSettings({ muted: !s.muted }); audio.unlock(); scene.scene.restart(); });
    action(ui.card, s.reducedEffects ? 'EFECTOS SUAVES: SÍ' : 'EFECTOS SUAVES: NO', () => { saveSettings({ reducedEffects: !s.reducedEffects }); scene.scene.restart(); });
    ui.card.append(element('p', 'Ordenador: W/S o flechas. Móvil: botones ▲ ▼ o arrastra en el mar. P / Escape para pausar.', 'muted')); back(scene, ui.card);
}
