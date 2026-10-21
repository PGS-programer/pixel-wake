// QA helmsman: feeds engine orders only. Never changes pose, velocities or mission flags.
import { VESSEL, angleDifference, clamp } from '../../src/simulator/physics/vessel.js';
import {PORT} from '../../src/simulator/world/harbor.js';
import {dockingMetrics} from '../../src/simulator/missions/berth.js';
export function createPilot(mission) {
    let waypoint = 0, stopping = false, stopHeading = 0;
    const route = [{ x: mission.side * 33, y: 14 }, { x: mission.targetX-mission.side*.9, y: mission.targetY }];
    return state => {
        const goal = route[waypoint], dx = goal.x - state.x, dy = goal.y - state.y, distance = Math.hypot(dx, dy), last = waypoint === route.length - 1;
        const onFinal=last&&PORT.quayX-mission.side*state.x-VESSEL.beam/2<mission.docking.maxGap-.4&&Math.abs(state.heading)<.27;
        if ((distance < (last ? 1.2 : 2.2)||onFinal) && !stopping) { stopping = true; stopHeading = state.heading; }
        const terminal = stopping;
        let desiredHeading = terminal ? (last ? 0 : stopHeading) : Math.atan2(dx, dy);
        if(last&&!terminal){const cap=Math.asin(clamp((PORT.quayX-Math.abs(state.x)-VESSEL.beam/2-3)/ (VESSEL.length/2),0,1));desiredHeading=clamp(desiredHeading,-cap,cap);}
        const err = angleDifference(desiredHeading - state.heading);
        const speed = terminal ? (last ? clamp(dy * .07, -.12, .12) : 0) : Math.min(last?.4:.65, distance * .07) * (last?Math.max(0,1-Math.abs(err)/.12):Math.max(0,Math.cos(err)));
        const X = VESSEL.surgeMass * (speed - state.u) * .35 + VESSEL.dragU * state.u + VESSEL.dragU2 * state.u * Math.abs(state.u);
        const N = VESSEL.yawInertia * (err * .065 - state.r * .65) + VESSEL.dragR * state.r + VESSEL.dragR2 * state.r * Math.abs(state.r);
        const thrusts = [(X + N / VESSEL.shaftOffset) / 2, (X - N / VESSEL.shaftOffset) / 2];
        [state.port, state.starboard].forEach((e, i) => { const t = thrusts[i]; e.lever = clamp(Math.sign(t) * Math.sqrt(Math.abs(t) / (t >= 0 ? VESSEL.thrustAhead : VESSEL.thrustAstern)), -.8, .8); });
        state.rudderOrder = 0;
        if (!last && terminal && Math.hypot(state.u, state.v) < .09) { waypoint++; stopping = false; }
        if(last && dockingMetrics(state,mission).geometry && Math.abs(err) < .025 && Math.hypot(state.u,state.v)<.055) { state.port.lever=state.starboard.lever=0;return true; }
        return false;
    };
}
