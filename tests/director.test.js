import test from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE } from '../src/game/config.js';
import { seededRandom, crossingSample, nextCombo } from '../src/game/systems/rules.js';
import { PATTERNS, makePattern, openingPattern, findSafeRoute, chooseEncounter, coinIsClear } from '../src/game/systems/spawnDirector.js';
import { obstacleSpec, atTravel, verticalRange } from '../src/game/data/obstacles.js';

test('opening demands action within two seconds, with a reachable coin route', () => {
    const p = openingPattern();
    assert.ok((p.obstacles[0].x - 196 - p.obstacles[0].hitboxHalfWidth) / BALANCE.startSpeed < 2);
    assert.ok(findSafeRoute(p.obstacles, 270, { coins: p.coins }));
    assert.ok(p.coins.every(c => coinIsClear(c, p.obstacles)));
    assert.equal(BALANCE.startSpeed, 220); assert.deepEqual(nextCombo(50), { combo: 51, bonus: 5100, timer: 3000 });
});
test('swept collision and near miss detect approaches between endpoints', () => {
    const o = { previousX: 250, x: 90, previousY: 240, y: 240, hitboxHalfWidth: 10, hitboxHalfHeight: 18 };
    const boat = { x: 170, y: 200 }, h = { halfWidth: 26, halfHeight: 10 };
    assert.equal(crossingSample(boat, 200, h, o).nearGap, 12);
    o.y = o.previousY = 200; assert.equal(crossingSample(boat, 200, h, o).collision, true);
});
test('sealed barriers are rejected and mobile extrema enclose exact drift', () => {
    const wall = [130, 190, 250, 310, 370, 430].map(y => obstacleSpec('largeRock', 250, y));
    assert.equal(findSafeRoute(wall, 270), null);
    const o = obstacleSpec('jetski', 1200, 270, { phase: 0.4 });
    const [lo, hi] = verticalRange(o, 0, 1000);
    for (let d = 0; d < 1000; d++) { const p = atTravel(o, d); assert.ok(p.y >= lo - 1e-9 && p.y <= hi + 1e-9); }
});
test('all pattern families offer an escape and certified routes avoid actual geometry', () => {
    const random = seededRandom(733);
    const speed = BALANCE.startSpeed + 13 * BALANCE.speedPerLevel;
    for (const pattern of PATTERNS) for (let run = 0; run < 20; run++) {
        const p = makePattern(pattern.id, random), path = findSafeRoute(p.obstacles, 110 + random() * 336);
        assert.ok(path, pattern.id);
        for (let i = 1; i < path.length; i++) {
            const a = path[i - 1], b = path[i];
            assert.ok(Math.abs(a.y - b.y) <= BALANCE.playerSpeed * (b.travel - a.travel) / speed + 1e-8);
            for (let t = 0; t <= 1; t += 0.25) for (const o of p.obstacles) {
                const q = atTravel(o, a.travel + (b.travel - a.travel) * t), y = a.y + (b.y - a.y) * t;
                assert.ok(Math.abs(q.x - 170) >= o.hitboxHalfWidth + 26 || Math.abs(q.y - y) >= o.hitboxHalfHeight + 10, pattern.id);
            }
        }
    }
});
test('director validates overlapping waves and never puts coins into future hazards', () => {
    const random = seededRandom(87); let hazards = [], coins = [], previousPattern;
    for (let i = 0; i < 140; i++) {
        const plan = chooseEncounter({ level: 1 + i % 14, index: i, random, hazards, coins, playerY: 270, previousPattern });
        const all = [...hazards, ...plan.obstacles];
        if (plan.obstacles.length) assert.ok(findSafeRoute(all, 270));
        assert.ok(coins.every(c => coinIsClear(c, plan.obstacles)));
        assert.ok(plan.coins.every(c => coinIsClear(c, all)));
        if (plan.coins.length) assert.ok(findSafeRoute(all, 270, { coins: plan.coins }));
        hazards = all.map(o => ({ ...o, ...atTravel(o, plan.nextTravel), travelled: o.travelled + plan.nextTravel })).filter(o => o.x > 140);
        coins = [...coins, ...plan.coins].map(c => ({ ...c, x: c.x - plan.nextTravel * c.speedFactor })).filter(c => c.x > 140);
        previousPattern = plan.id;
    }
});
