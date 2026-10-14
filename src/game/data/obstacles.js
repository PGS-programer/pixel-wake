// Half-extents describe solid hulls, never foam, sails' shadows or wakes.
export const OBSTACLES = Object.freeze({
    rock:      { name: 'Roca',          halfWidth: 22, halfHeight: 18, speedFactor: 1,    minLevel: 1 },
    smallRock: { name: 'Roca pequeña',  halfWidth: 17, halfHeight: 14, speedFactor: 1,    minLevel: 1 },
    largeRock: { name: 'Roca grande',   halfWidth: 34, halfHeight: 31, speedFactor: 1,    minLevel: 2 },
    buoy:      { name: 'Boya',          halfWidth: 10, halfHeight: 18, speedFactor: 1,    minLevel: 1 },
    speedboat: { name: 'Lancha',        halfWidth: 32, halfHeight: 12, speedFactor: 1.28, minLevel: 3, amplitude: 22, period: 160 },
    fishing:   { name: 'Pesquero',      halfWidth: 39, halfHeight: 22, speedFactor: 0.90, minLevel: 4 },
    sailboat:  { name: 'Velero',        halfWidth: 31, halfHeight: 34, speedFactor: 0.94, minLevel: 3 },
    jetski:    { name: 'Moto de agua',  halfWidth: 20, halfHeight: 11, speedFactor: 1.50, minLevel: 7, amplitude: 30, period: 125 },
    log:       { name: 'Tronco',        halfWidth: 29, halfHeight: 11, speedFactor: 1,    minLevel: 2 }
});
export function obstacleSpec(type, x, y, options = {}) {
    const data = OBSTACLES[type];
    if (!data) throw new Error(`Unknown obstacle: ${type}`);
    const amplitude = options.amplitude ?? data.amplitude ?? 0;
    const baseY = Math.max(120 + data.halfHeight + amplitude, Math.min(436 - data.halfHeight - amplitude, y));
    const phase = options.phase ?? 0;
    return { type, x, y: baseY + Math.sin(phase) * amplitude, baseY, amplitude, phase,
        period: data.period || 160, travelled: 0, speedFactor: data.speedFactor,
        hitboxHalfWidth: data.halfWidth, hitboxHalfHeight: data.halfHeight, variant: options.variant ?? 0 };
}
export function atTravel(obstacle, worldTravel) {
    const amplitude = obstacle.amplitude || 0;
    return { x: obstacle.x - worldTravel * obstacle.speedFactor,
        y: (obstacle.baseY ?? obstacle.y) + Math.sin((obstacle.phase || 0) + ((obstacle.travelled || 0) + worldTravel) / (obstacle.period || 160)) * amplitude };
}
// Exact sine extrema over a world-distance interval, for conservative swept bounds.
export function verticalRange(obstacle, start, end) {
    if (!obstacle.amplitude) return [obstacle.y, obstacle.y];
    const a = (obstacle.phase || 0) + ((obstacle.travelled || 0) + start) / obstacle.period;
    const b = (obstacle.phase || 0) + ((obstacle.travelled || 0) + end) / obstacle.period;
    let low = Math.min(Math.sin(a), Math.sin(b)), high = Math.max(Math.sin(a), Math.sin(b));
    for (let k = Math.ceil((a - Math.PI / 2) / Math.PI); Math.PI / 2 + k * Math.PI <= b; k++) {
        const value = k % 2 === 0 ? 1 : -1; low = Math.min(low, value); high = Math.max(high, value);
    }
    return [obstacle.baseY + low * obstacle.amplitude, obstacle.baseY + high * obstacle.amplitude];
}
