// QA helmsman: feeds engine orders only. Never changes pose, velocities or mission flags.
import { VESSEL, angleDifference, clamp } from '../../src/simulator/physics/vessel.js';
export function createPilot(mission) {
    let waypoint = 0, stopping = false, stopHeading = 0;
    const route = [{ x: 0, y: -30 }, { x: mission.side * 55, y: 0 }, { x: mission.side * 65, y: 25 }, { x: mission.targetX, y: mission.targetY }];
    return state => {
        const goal = route[waypoint], dx = goal.x - state.x, dy = goal.y - state.y, distance = Math.hypot(dx, dy), last = waypoint === route.length - 1;
        if (distance < (last ? 2.2 : 3) && !stopping) { stopping = true; stopHeading = state.heading; }
        const terminal = stopping;
        let desiredHeading = terminal ? (last ? 0 : stopHeading) : Math.atan2(dx, dy);
        const err = angleDifference(desiredHeading - state.heading);
        const speed = terminal ? (last ? clamp(dy * .07, -.12, .12) : 0) : Math.min(.85, distance * .07) * Math.max(0, Math.cos(err));
        const X = VESSEL.surgeMass * (speed - state.u) * .35 + VESSEL.dragU * state.u + VESSEL.dragU2 * state.u * Math.abs(state.u);
        const N = VESSEL.yawInertia * (err * .065 - state.r * .65) + VESSEL.dragR * state.r + VESSEL.dragR2 * state.r * Math.abs(state.r);
        const thrusts = [(X + N / VESSEL.shaftOffset) / 2, (X - N / VESSEL.shaftOffset) / 2];
        [state.port, state.starboard].forEach((e, i) => { const t = thrusts[i]; e.lever = clamp(Math.sign(t) * Math.sqrt(Math.abs(t) / (t >= 0 ? VESSEL.thrustAhead : VESSEL.thrustAstern)), -.8, .8); });
        state.rudderOrder = 0;
        if (!last && terminal && Math.hypot(state.u, state.v) < .09) { waypoint++; stopping = false; }
        if(last && distance < 2.2 && Math.abs(err) < .025 && Math.hypot(state.u,state.v)<.055) { state.port.lever=state.starboard.lever=0;return true; }
        return false;
    };
}
