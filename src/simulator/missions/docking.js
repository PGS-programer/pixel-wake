import { VESSEL, angleDifference, knots, bodyPoint, groundVelocity, neutral } from '../physics/vessel.js';
export function dockingMetrics(s, mission) {
    const angle = Math.abs(angleDifference(s.heading));
    const extent = Math.abs(Math.cos(s.heading)) * VESSEL.beam / 2 + Math.abs(Math.sin(s.heading)) * VESSEL.length / 2;
    const gap = 75 - mission.side * s.x - extent;
    const along = Math.abs(s.y - mission.targetY);
    const speed = Math.hypot(s.u, s.v);
    const neutralEngines = [s.port, s.starboard].every(e => Math.abs(e.lever) < .055 && Math.abs(e.shaft) < .07);
    return { angle, gap, along, speed, neutralEngines,
        safe: gap >= .35 && gap <= 3.5 && along <= mission.precision && angle < 8 * Math.PI / 180 && Math.abs(s.u) < .22 && Math.abs(s.v) < .12 && Math.abs(s.r) < .008 && neutralEngines };
}
export class DockingMission {
    constructor(config, harbor) { this.config = config; this.harbor = harbor; this.phase = 'entrada'; this.entered = false; this.safeTime = 0; this.lines = []; this.mooringTime = 0; this.finished = false; this.lastImpacts = new Map(); this.stats = { maxFinalSpeed: 0, maxContact: 0, collisions: 0, severe: 0, fenderContacts: 0, reversals: 0, engineEffort: 0 }; this.signs = [0, 0]; }
    update(s, dt, impacts = []) {
        if (this.finished) return;
        if (!this.entered && s.y > -50 && Math.abs(s.x) < 31) this.entered = true;
        const d = dockingMetrics(s, this.config); this.metrics = d;
        if (Math.hypot(s.x - this.config.targetX, s.y - this.config.targetY) < 40) this.stats.maxFinalSpeed = Math.max(this.stats.maxFinalSpeed, knots(d.speed));
        this.phase = !this.entered ? 'entrada' : d.along < 25 && Math.abs(s.x - this.config.targetX) < 25 ? 'posicionamiento' : 'aproximación';
        for (const impact of impacts) {
            if (impact.speed < .035 || s.time - (this.lastImpacts.get(impact.id) ?? -10) < 2) continue;
            this.lastImpacts.set(impact.id, s.time);
            this.stats.maxContact = Math.max(this.stats.maxContact, impact.speed);
            if (impact.soft) this.stats.fenderContacts++; else this.stats.collisions++;
            if (impact.speed > .55) this.stats.severe++;
        }
        [s.port, s.starboard].forEach((e, i) => { const sign = Math.abs(e.lever) > .1 ? Math.sign(e.lever) : 0; if (sign && this.signs[i] && this.signs[i] !== sign) this.stats.reversals++; if (sign) this.signs[i] = sign; this.stats.engineEffort += Math.abs(e.lever) * dt; });
        this.safeTime = this.entered && d.safe ? this.safeTime + dt : 0;
        if (this.lines.length) {
            this.phase = 'amarre';
            if (!d.safe || !this.entered) { this.lines = []; this.mooringTime = 0; this.safeTime = 0; return; }
            this.mooringTime += dt;
            for (const line of this.lines) line.secured = this.mooringTime > line.order * 1.5;
            // Elastic moorings exert force at their real attachment points while the crew secures them.
            this.applyLines(s, dt);
            if (this.mooringTime > 10 && this.lines.every(l => l.secured)) { this.finished = true; this.phase = 'completado'; neutral(s); s.moored = true; s.u = s.v = s.r = 0; this.result = this.evaluate(s); }
        }
    }
    requestMooring(s) {
        if (this.safeTime < 3 || !dockingMetrics(s, this.config).safe || this.lines.length) return false;
        const side = this.config.side;
        const ends = [[8, 79, 'Largo de proa'], [-8, 35, 'Largo de popa'], [7, 45, 'Esprín de proa'], [-7, 69, 'Esprín de popa'], [3, 60, 'Través de proa'], [-3, 54, 'Través de popa']];
        this.lines = ends.map(([forward, y, name], i) => { const point = bodyPoint(s, forward, side * 2.5); return { forward, starboard: side * 2.5, shore: { x: side * 76, y: y }, rest: Math.hypot(point.x - side * 76, point.y - y), secured: false, order: i + 1, name }; });
        return true;
    }
    applyLines(s, dt) {
        const vel = groundVelocity(s); let fx = 0, fy = 0, moment = 0;
        for (const line of this.lines.filter(l => l.secured)) {
            const p = bodyPoint(s, line.forward, line.starboard), dx = line.shore.x - p.x, dy = line.shore.y - p.y, length = Math.hypot(dx, dy);
            const stretch = Math.max(0, length - line.rest);
            const tension = Math.min(22000, Math.max(0, stretch * 6000 - (vel.x * dx + vel.y * dy) / length * 2500));
            const x = dx / length * tension, y = dy / length * tension; fx += x; fy += y; moment += (p.y - s.y) * x - (p.x - s.x) * y;
        }
        const h = s.heading; s.u += (fx * Math.sin(h) + fy * Math.cos(h)) / VESSEL.surgeMass * dt; s.v += (fx * Math.cos(h) - fy * Math.sin(h)) / VESSEL.swayMass * dt; s.r += moment / VESSEL.yawInertia * dt;
    }
    evaluate(s) {
        const d = dockingMetrics(s, this.config), t = this.stats;
        const position = Math.max(0, 25 - d.along / this.config.precision * 12 - Math.abs(d.gap - 2) * 3);
        const alignment = Math.max(0, 20 - d.angle * 180 / Math.PI * 2);
        const contact = Math.max(0, 25 - t.collisions * 5 - t.severe * 8 - t.maxContact * 6);
        const approach = Math.max(0, 20 - Math.max(0, t.maxFinalSpeed - 2) * 5);
        const control = Math.max(0, 10 - Math.max(0, t.reversals - 12) * .3);
        const score = Math.round(position + alignment + contact + approach + control);
        const tips = [];
        if (t.maxFinalSpeed > 2) tips.push('Reduce antes de la aproximación final: el punto muerto conserva la arrancada.');
        if (t.collisions || t.severe) tips.push('Anticipa el espacio de la popa durante el giro y utiliza la vista de banda.');
        if (d.angle > .05) tips.push('Pequeños impulsos opuestos permiten ajustar el rumbo a poca velocidad.');
        if (t.reversals > 12) tips.push('Espera la respuesta del motor antes de volver a invertir la marcha.');
        if (!tips.length) tips.push('Buen control. Repite con la banda opuesta o con viento y corriente.');
        return { score, time: s.time, ...t, gap: d.gap, along: d.along, angle: d.angle * 180 / Math.PI, components: { position, alignment, contact, approach, control }, tips, mooring: '6 cabos asegurados · motores en punto muerto' };
    }
}
