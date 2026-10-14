import { touchDevice } from './mobile.js';
import { screen, action, stats } from './screen.js';
import { label, panel, button, C } from './kit.js';
import { activeMission } from '../data/progression.js';
import { formatNumber } from './format.js';
export function showRunResults(scene, result, records) {
    if (touchDevice()) {
        const ui = screen(scene, records ? '¡NUEVO RÉCORD!' : 'EL MAR TE ESPERA.', 'Fin de la travesía.');
        stats(ui.card, [['DISTANCIA', `${Math.floor(scene.distance)} m`], ['PUNTOS', Math.floor(scene.points)], ['COMBO', `x${scene.maxCombo}`]]);
        ui.message(`Monedas +${scene.runCoins} · Misiones +${result.reward} · Saldo ${scene.walletCoins}`);
        for (const m of result.completed) { const p = document.createElement('p'); p.textContent = `✓ ${m.title} · +${m.reward}`; ui.card.append(p); }
        action(ui.card, 'OTRA TRAVESÍA →', () => scene.scene.restart(), true);
        action(ui.card, 'MENÚ', () => scene.scene.start('MenuScene')); action(ui.card, 'GARAJE', () => scene.scene.start('GarageScene')); return;
    }
    scene.add.rectangle(480, 270, 960, 540, C.navy, 0.78).setDepth(500).setInteractive();
    panel(scene, 480, 266, 660, 474, C.navy, 501);
    scene.add.rectangle(480, 32, 660, 4, C.gold).setDepth(502);
    label(scene, 480, 56, 'FIN DE LA TRAVESÍA', 12, '#46dfc1', 503).setOrigin(0.5);
    label(scene, 480, 87, records ? '¡NUEVO RÉCORD!' : 'EL MAR TE ESPERA.', 29, records ? '#ffd166' : '#fff4d9', 503).setOrigin(0.5);
    const stats = [['DISTANCIA', `${formatNumber(scene.distance)} m`], ['PUNTOS', formatNumber(scene.points)], ['COMBO MÁX.', `x${scene.maxCombo}`]];
    stats.forEach(([title, value], i) => { label(scene, 222 + i * 190, 132, title, 11, '#93bdbe', 503); label(scene, 222 + i * 190, 151, value, 26, '#fff4d9', 503); });
    label(scene, 480, 204, `MONEDAS +${scene.runCoins}    MISIONES +${result.reward}    SALDO ${scene.walletCoins}`, 15, '#ffd166', 503).setOrigin(0.5);
    label(scene, 480, 235, `MEJORES: ${Math.max(scene.startingDistanceRecord, Math.floor(scene.distance))} m / ${Math.max(scene.startingPointsRecord, Math.floor(scene.points))} pts`, 11, '#93bdbe', 503).setOrigin(0.5);
    const contracts = result.completed.length > 2 ? [`✓ ${result.completed.length} contratos completados · +${result.reward} monedas`] : result.completed.map(m => `✓ ${m.title}  +${m.reward}`);
    const messages = [...contracts, ...result.unlocked.map(a => `◆ ${a.title}${a.trail ? ' · nueva estela' : ''}`)];
    label(scene, 480, 260, messages.length ? messages.slice(0, 4).join('\n') : 'Cada intento afina tu rumbo.', 12, '#46dfc1', 503).setOrigin(0.5, 0).setAlign('center').setLineSpacing(3);
    const mission = activeMission(result.profile);
    label(scene, 480, 338, mission ? `SIGUIENTE: ${mission.description}` : 'TODAS LAS MISIONES COMPLETADAS', 12, '#a5d8d1', 503).setOrigin(0.5);
    button(scene, 480, 387, 'OTRA TRAVESÍA  →', () => scene.scene.restart(), { width: 540, height: 52, primary: true, depth: 505, size: 20 });
    button(scene, 339, 452, '← MENÚ', () => scene.scene.start('MenuScene'), { width: 258, height: 40, depth: 505, size: 14 });
    button(scene, 621, 452, 'GARAJE', () => scene.scene.start('GarageScene'), { width: 258, height: 40, depth: 505, size: 14 });
    label(scene, 480, 486, 'ESPACIO · REINTENTAR     M · MENÚ', 10, '#93bdbe', 503).setOrigin(0.5);
}
