import { label, button, C } from './kit.js';
import { formatNumber } from './format.js';
import { activeMission, previewProgress } from '../data/progression.js';

export function createGameHud(scene) {
    scene.add.rectangle(480, 45, 960, 90, C.navy, 0.96).setDepth(100);
    scene.add.rectangle(480, 90, 960, 2, C.teal, 0.4).setDepth(101);
    label(scene, 22, 14, 'DISTANCIA', 10, '#93bdbe');
    scene.distanceText = label(scene, 22, 31, '00000 m', 25);
    scene.distanceBestText = label(scene, 22, 65, `RÉCORD ${formatNumber(scene.startingDistanceRecord)} m`, 10, '#93bdbe');
    label(scene, 226, 14, 'PUNTOS', 10, '#93bdbe');
    scene.pointsText = label(scene, 226, 31, '00000', 25);
    scene.pointsBestText = label(scene, 226, 65, `RÉCORD ${formatNumber(scene.startingPointsRecord)}`, 10, '#93bdbe');
    scene.levelText = label(scene, 408, 18, 'COSTA / NIVEL 1', 13, '#46dfc1');
    scene.speedText = label(scene, 408, 44, '13.5 kn', 17);
    scene.coinText = label(scene, 660, 18, `${scene.walletCoins} MONEDAS`, 18, '#ffd166');
    scene.comboText = label(scene, 660, 49, '', 18, '#ffd166');
    scene.comboMeter = scene.add.rectangle(660, 76, 140, 3, C.gold).setOrigin(0, 0.5).setDepth(110);
    button(scene, 901, 44, 'Ⅱ', () => scene.togglePause(), { width: 62, height: 50, size: 25 });
    scene.add.rectangle(480, 520, 960, 40, C.navy, 0.95).setDepth(100);
    scene.missionText = label(scene, 20, 510, '', 12, '#a5d8d1');
    label(scene, 938, 512, 'P / ESC · PAUSA', 10, '#93bdbe').setOrigin(1, 0);
    scene.feedbackText = label(scene, 480, 143, '', 19, '#ffd166', 200).setOrigin(0.5);
    scene.feedbackText.alpha = 0;
    scene.comboPopupText = label(scene, 495, 112, '', 20, '#ffd166', 200).setOrigin(0.5);
    scene.comboPopupText.alpha = 0;
    scene.tutorialText = label(scene, 480, 476, '', 14, '#fff4d9', 201).setOrigin(0.5);
    scene.tutorialText.setBackgroundColor('#092c37').setPadding(12, 7);
    scene.startText = label(scene, 480, 265, 'LISTO PARA ZARPAR', 28, '#fff4d9', 201).setOrigin(0.5);
}
export function updateMissionHud(scene) {
    const p = previewProgress(scene.profile, scene.runStats());
    const mission = activeMission(scene.profile);
    scene.missionText.setText(mission ? `○ ${mission.description}   ${Math.min(p[mission.metric], mission.target)}/${mission.target}   +${mission.reward}` : '◆ TODOS LOS CONTRATOS COMPLETADOS · A POR TU RÉCORD');
    scene.comboMeter.width = 140 * Math.max(0, scene.comboTimer / scene.comboDuration);
    scene.comboMeter.alpha = scene.combo > 0 ? 1 : 0;
}
