// SI units. Aurea 24 geometry; preserved training actuators/forces, see docs/SUPERYACHT.md.
export const VESSEL = Object.freeze({
    length: 24, beam: 6.2, draft: 1.8, mass: 60000,
    surgeMass: 66000, swayMass: 96000, yawInertia: 2300000,
    shaftOffset: 1.65, thrustAhead: 18000, thrustAstern: 11500,
    engineLag: 1.6, gearboxDelay: 0.9, leverRate: 0.38,
    rudderLimit: 35 * Math.PI / 180, rudderRate: 5 * Math.PI / 180,
    rudderArea: 0.65, rudderArm: -7.4, rho: 1025,
    dragU: 1300, dragU2: 1800, dragV: 14000, dragV2: 20000,
    dragR: 550000, dragR2: 2600000,
});
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const angleDifference = a => Math.atan2(Math.sin(a), Math.cos(a));
export const knots = ms => ms * 1.943844;
export function axes(heading) { return { fx: Math.sin(heading), fy: Math.cos(heading), sx: Math.cos(heading), sy: -Math.sin(heading) }; }
export function bodyPoint(s, forward, starboard) {
    const a = axes(s.heading); return { x: s.x + a.fx * forward + a.sx * starboard, y: s.y + a.fy * forward + a.sy * starboard };
}
export function createState(start = {}) {
    return { x: 0, y: -185, heading: 0, u: 0, v: 0, r: 0, rudder: 0, rudderOrder: 0,
        port: engine(), starboard: engine(), time: 0, moored: false, ...start };
}
function engine() { return { lever: 0, shaft: 0, gear: 0, pending: 0, delay: 0, rpm: 650 }; }
export function setLever(s, side, value) { s[side].lever = clamp(value, -1, 1); }
export function neutral(s) { s.port.lever = 0; s.starboard.lever = 0; }
function stepEngine(e, dt, p) {
    const wanted = Math.abs(e.lever) < .055 ? 0 : Math.sign(e.lever);
    if (wanted !== e.gear) {
        // Reversal always disengages, runs down, then waits at neutral.
        if (e.gear !== 0) { e.gear = 0; e.delay = p.gearboxDelay; e.pending = wanted; }
        else if (e.pending !== wanted) { e.pending = wanted; e.delay = p.gearboxDelay; }
        else { e.delay = Math.max(0, e.delay - dt); if (!e.delay && Math.abs(e.shaft) < .12) e.gear = wanted; }
    } else { e.pending = wanted; e.delay = 0; }
    const target = e.gear === wanted && wanted ? e.lever : 0;
    e.shaft += (target - e.shaft) * (1 - Math.exp(-dt / p.engineLag));
    e.rpm = 650 + 1350 * Math.abs(e.shaft);
    return e.shaft * Math.abs(e.shaft) * (e.shaft >= 0 ? p.thrustAhead : p.thrustAstern);
}
export function waterVelocity(s, environment = {}) {
    const a = axes(s.heading), c = environment.current || { x: 0, y: 0 };
    return { u: s.u - c.x * a.fx - c.y * a.fy, v: s.v - c.x * a.sx - c.y * a.sy };
}
export function groundVelocity(s) {
    const a = axes(s.heading); return { x: a.fx * s.u + a.sx * s.v, y: a.fy * s.u + a.sy * s.v };
}
export function stepPhysics(s, environment, dt, p = VESSEL) {
    if (s.moored) return { X: 0, Y: 0, N: 0 };
    const port = stepEngine(s.port, dt, p), starboard = stepEngine(s.starboard, dt, p);
    const delta = clamp(s.rudderOrder - s.rudder, -p.rudderRate * dt, p.rudderRate * dt); s.rudder += delta;
    const water = waterVelocity(s, environment), a = axes(s.heading), vel = groundVelocity(s);
    let X = port + starboard - p.dragU * water.u - p.dragU2 * water.u * Math.abs(water.u);
    let Y = -p.dragV * water.v - p.dragV2 * water.v * Math.abs(water.v);
    let N = p.shaftOffset * (port - starboard) - p.dragR * s.r - p.dragR2 * s.r * Math.abs(s.r);
    // Two conventional linked rudders, each aft of its fixed-pitch propeller.
    for (const thrust of [port, starboard]) {
        const wash2 = Math.max(0, thrust) / (p.rho * .8);
        const inflow = Math.sign(water.u || wash2) * Math.sqrt(water.u ** 2 + wash2 * .55);
        const lateral = water.v + p.rudderArm * s.r;
        const alpha = s.rudder + Math.atan2(lateral, Math.max(.2, Math.abs(inflow)));
        const lift = clamp(3.8 * alpha, -1.2, 1.2);
        const force = -.5 * p.rho * p.rudderArea * inflow * Math.abs(inflow) * lift;
        Y += force; N += p.rudderArm * force; X -= Math.abs(force * Math.sin(s.rudder)) * Math.sign(water.u || 1);
    }
    const wind = environment.wind || { x: 0, y: 0 };
    const wx = wind.x - vel.x, wy = wind.y - vel.y;
    const wu = wx * a.fx + wy * a.fy, wv = wx * a.sx + wy * a.sy;
    const windY = .5 * 1.225 * 65 * .95 * wv * Math.abs(wv);
    X += .5 * 1.225 * 18 * .85 * wu * Math.abs(wu); Y += windY; N += windY * .7;
    // Diagonal added-inertia approximation and energy-conserving planar Coriolis coupling.
    const du = (X + p.swayMass * s.v * s.r) / p.surgeMass;
    const dv = (Y - p.surgeMass * s.u * s.r) / p.swayMass;
    const dr = (N + (p.surgeMass - p.swayMass) * s.u * s.v) / p.yawInertia;
    s.u += du * dt; s.v += dv * dt; s.r += dr * dt;
    s.heading = angleDifference(s.heading + s.r * dt);
    const v = groundVelocity(s); s.x += v.x * dt; s.y += v.y * dt; s.time += dt;
    return { X, Y, N, port, starboard };
}
