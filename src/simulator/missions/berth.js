import { VESSEL, angleDifference } from '../physics/vessel.js';
import { PORT } from '../world/harbor.js';
const fallback = { minGap: .35, maxGap: 3.5, angleDeg: 8, surge: .22, sway: .12, yaw: .008, safeSpeed: .26, hold: 3, finalSpeedKn: 2 };
export const dockingLimits = mission => ({ ...fallback, ...mission.docking });
export function dockingMetrics(s, mission) {
    const limits = dockingLimits(mission);
    const angle = Math.abs(angleDifference(s.heading));
    const extent = Math.abs(Math.cos(s.heading)) * VESSEL.beam / 2 + Math.abs(Math.sin(s.heading)) * VESSEL.length / 2;
    const gap = PORT.quayX - mission.side * s.x - extent;
    const along = Math.abs(s.y - mission.targetY), speed = Math.hypot(s.u, s.v);
    const neutralEngines = [s.port, s.starboard].every(e => Math.abs(e.lever) < .055 && Math.abs(e.shaft) < .07);
    const geometry = gap >= limits.minGap && gap <= limits.maxGap && along <= mission.precision && angle < limits.angleDeg * Math.PI / 180;
    const slow = Math.abs(s.u) < limits.surge && Math.abs(s.v) < limits.sway && Math.abs(s.r) < limits.yaw && speed < limits.safeSpeed;
    return { angle, gap, along, speed, neutralEngines, geometry, slow, limits, safe: geometry && slow && neutralEngines };
}
// Single source of truth for the water zone, HUD and actual mooring permission.
export function dockingCue(metrics, progress, mission) {
    const d = metrics, l = dockingLimits(mission);
    const berth = mission.side === 1 ? 'E-02 · ESTRIBOR' : 'W-02 · BABOR';
    const activeLines = progress.lines?.length > 0;
    const ready = !!progress.entered && d.safe && progress.safeTime >= l.hold && !activeLines && !progress.finished;
    if (progress.finished) return { color: 'green', ready: false, title: 'ATRAQUE COMPLETADO', detail: 'Seis amarras aseguradas.' };
    if (activeLines && d.safe) return { color: 'green', ready: false, title: 'AMARRANDO — MANTÉN LA POSICIÓN', detail: `${progress.lines.filter(line => line.secured).length} / 6 cabos asegurados` };
    if (ready) return { color: 'green', ready: true, title: 'POSICIÓN CORRECTA — LISTO PARA AMARRAR', detail: 'Pulsa M o da la orden de amarre.' };
    const near = d.gap >= -.2 && d.gap < l.maxGap + 6 && d.along < mission.precision + 15 && d.angle < (l.angleDeg + 20) * Math.PI / 180;
    if (near && d.speed > .65) return { color: 'red', ready: false, title: 'REDUCE VELOCIDAD ANTES DE ATRACAR', detail: `${berth} · Conservas demasiada arrancada.` };
    if (near) {
        let detail = !d.slow ? 'Reduce la arrancada. N no detiene el barco de golpe.' : !d.geometry ? 'Ajusta suavemente distancia y alineación.' : !d.neutralEngines ? 'Ordena N y espera a que desaceleren ambos motores.' : !progress.entered ? 'Entra primero por la bocana señalizada.' : `Posición correcta: mantén ${Math.max(0, l.hold - progress.safeTime).toFixed(1)} s más.`;
        return { color: 'yellow', ready: false, title: 'CASI LISTO — PEQUEÑOS AJUSTES', detail };
    }
    return { color: 'red', ready: false, title: `TU ATRAQUE: ${berth}`, detail: 'Sigue la baliza y la flecha. La zona cambia a verde cuando puedes amarrar.' };
}
