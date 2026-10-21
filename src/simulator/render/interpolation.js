import { angleDifference, clamp } from '../physics/vessel.js';
const poseKeys = ['x', 'y', 'heading', 'u', 'v', 'r', 'rudder', 'time'];
// Standard one-physics-tick interpolation. Never writes back to simulation state.
export class PoseInterpolator {
    reset(state) { this.previous = Object.fromEntries(poseKeys.map(key => [key, state[key]])); }
    capture(state) { this.reset(state); }
    sample(state, alpha = 1) {
        if (!this.previous) this.reset(state);
        const a = clamp(alpha, 0, 1), pose = { ...state };
        for (const key of poseKeys) pose[key] = this.previous[key] + (state[key] - this.previous[key]) * a;
        pose.heading = this.previous.heading + angleDifference(state.heading - this.previous.heading) * a;
        return pose;
    }
}
