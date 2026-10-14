export function difficulty(distance) { return Math.min(14, 1 + Math.floor(Math.max(0, distance) / 250)); }
export function overlaps(ax, ay, aw, ah, bx, by, bw, bh) { return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh; }
export function nextCombo(combo) { return { combo: combo + 1, bonus: 100 * (combo + 1), timer: 3000 }; }
export function tickCombo(combo, timer, delta) { const remaining = Math.max(0, timer - delta); return { combo: remaining > 0 ? combo : 0, timer: remaining }; }
export function seededRandom(seed) {
    let state = seed >>> 0;
    return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// Relative-motion slab intersection over the whole frame. This catches a close
// approach or collision even if neither endpoint lies inside the detection box.
export function crossingSample(boat, previousBoatY, hitbox, o, margin = 30) {
    const x0 = (o.previousX ?? o.x) - boat.x, x1 = o.x - boat.x;
    const y0 = (o.previousY ?? o.y) - previousBoatY, y1 = o.y - boat.y;
    const interval = (a, b, radius) => {
        if (a === b) return Math.abs(a) < radius ? [0, 1] : null;
        const u = (-radius - a) / (b - a), v = (radius - a) / (b - a);
        const lo = Math.max(0, Math.min(u, v)), hi = Math.min(1, Math.max(u, v));
        return lo < hi ? [lo, hi] : null;
    };
    const hw = hitbox.halfWidth + o.hitboxHalfWidth, hh = hitbox.halfHeight + o.hitboxHalfHeight;
    const xi = interval(x0, x1, hw), yi = interval(y0, y1, hh);
    const collision = !!(xi && yi && Math.max(xi[0], yi[0]) < Math.min(xi[1], yi[1]));
    const window = interval(x0, x1, hw + 45);
    if (!window || collision) return { collision, nearGap: null };
    const a = y0 + (y1 - y0) * window[0], b = y0 + (y1 - y0) * window[1];
    const gap = (a * b <= 0 ? 0 : Math.min(Math.abs(a), Math.abs(b))) - hh;
    return { collision, nearGap: gap >= 0 && gap <= margin ? gap : null };
}
