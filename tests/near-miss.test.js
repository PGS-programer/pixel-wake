import test from 'node:test';
import assert from 'node:assert/strict';
import { scoringMethods } from '../src/game/systems/scoring.js';
import { obstaclesMethods } from '../src/game/systems/obstacles.js';
function fixture(y) {
    const obstacle = { x: 170, y, hitboxHalfWidth: 10, hitboxHalfHeight: 18, nearMissChecked: false, nearMissCandidate: false, bestNearMissGap: Infinity };
    return { boat: { x: 170, y: 200 }, boatHitbox: { halfWidth: 26, halfHeight: 10 }, obstacles: [obstacle], nearMissMargin: 30, awarded: 0,
        registerNearMiss() { this.awarded++; }, triggerGameOver() { this.collided = true; } };
}
test('near miss waits for complete pass and awards each obstacle once', () => {
    const scene = fixture(245);
    scoringMethods.checkNearMisses.call(scene); assert.equal(scene.awarded, 0); assert.equal(scene.obstacles[0].nearMissCandidate, true);
    scene.obstacles[0].x = 130; scoringMethods.checkNearMisses.call(scene); assert.equal(scene.awarded, 1);
    scoringMethods.checkNearMisses.call(scene); assert.equal(scene.awarded, 1);
});
test('safe distant passes and actual collisions are not near misses', () => {
    for (const y of [259, 210]) {
        const scene = fixture(y); scoringMethods.checkNearMisses.call(scene); scene.obstacles[0].x = 130; scoringMethods.checkNearMisses.call(scene); assert.equal(scene.awarded, 0);
    }
    const scene = fixture(210); assert.equal(obstaclesMethods.checkCollisions.call(scene), true); assert.equal(scene.collided, true);
});
