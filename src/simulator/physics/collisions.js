import { VESSEL, axes, bodyPoint, groundVelocity } from './vessel.js';
// SAT: oriented vessel rectangle vs axis-aligned harbour collision boxes.
export function overlap(s, box, p = VESSEL) {
    const a = axes(s.heading), dx = s.x - box.x, dy = s.y - box.y;
    const tests = [[a.fx, a.fy], [a.sx, a.sy], [1, 0], [0, 1]];
    let depth = Infinity, nx = 0, ny = 0;
    for (const [x, y] of tests) {
        const ship = p.length / 2 * Math.abs(x * a.fx + y * a.fy) + p.beam / 2 * Math.abs(x * a.sx + y * a.sy);
        const pier = box.w / 2 * Math.abs(x) + box.h / 2 * Math.abs(y);
        const d = ship + pier - Math.abs(dx * x + dy * y);
        if (d <= 0) return null;
        if (d < depth) { depth = d; const sign = dx * x + dy * y >= 0 ? 1 : -1; nx = x * sign; ny = y * sign; }
    }
    return { depth, nx, ny };
}
export function resolveCollisions(s, boxes, p = VESSEL) {
    const impacts = [];
    for (let pass = 0; pass < 2; pass++) for (const box of boxes) {
        const hit = overlap(s, box, p); if (!hit) continue;
        const a = axes(s.heading);
        // Contact support point along the outward normal, clamped along the collider face.
        const towardF = -hit.nx * a.fx - hit.ny * a.fy, towardS = -hit.nx * a.sx - hit.ny * a.sy;
        let f = Math.abs(towardF) > .015 ? Math.sign(towardF) * p.length / 2 : 0;
        let b = Math.abs(towardS) > .015 ? Math.sign(towardS) * p.beam / 2 : 0;
        const middle = bodyPoint(s, f, b);
        const cx = Math.max(box.x - box.w / 2, Math.min(box.x + box.w / 2, middle.x));
        const cy = Math.max(box.y - box.h / 2, Math.min(box.y + box.h / 2, middle.y));
        f = (cx - s.x) * a.fx + (cy - s.y) * a.fy;
        b = (cx - s.x) * a.sx + (cy - s.y) * a.sy;
        const nf = hit.nx * a.fx + hit.ny * a.fy, ns = hit.nx * a.sx + hit.ny * a.sy;
        const vn = (s.u - s.r * b) * nf + (s.v + s.r * f) * ns;
        const arm = f * ns - b * nf;
        if (vn < 0) {
            const impulse = -(1 + (box.soft ? .04 : .1)) * vn / (nf * nf / p.surgeMass + ns * ns / p.swayMass + arm * arm / p.yawInertia);
            s.u += impulse * nf / p.surgeMass; s.v += impulse * ns / p.swayMass; s.r += impulse * arm / p.yawInertia;
            if (pass === 0) impacts.push({ id: box.id, soft: !!box.soft, speed: -vn, energy: .5 * p.mass * vn * vn, time: s.time });
        }
        s.x += hit.nx * (hit.depth + .001); s.y += hit.ny * (hit.depth + .001);
    }
    return impacts;
}
export function clearance(s, boxes) {
    const a = axes(s.heading);
    let best = Infinity;
    for (const b of boxes.filter(b => b.kind === 'quay')) {
        const supportX = Math.abs(a.fx) * VESSEL.length / 2 + Math.abs(a.sx) * VESSEL.beam / 2;
        const supportY = Math.abs(a.fy) * VESSEL.length / 2 + Math.abs(a.sy) * VESSEL.beam / 2;
        const dx = Math.max(0, Math.abs(s.x - b.x) - b.w / 2 - supportX), dy = Math.max(0, Math.abs(s.y - b.y) - b.h / 2 - supportY);
        best = Math.min(best, Math.hypot(dx, dy));
    }
    return best;
}
