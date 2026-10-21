export class FixedClock {
    constructor(step = 1 / 60) { this.step = step; this.accumulator = 0; }
    advance(delta, update) {
        this.accumulator += Math.min(.15, Math.max(0, delta));
        while (this.accumulator + 1e-10 >= this.step) { update(this.step); this.accumulator -= this.step; }
    }
    reset() { this.accumulator = 0; }
}
