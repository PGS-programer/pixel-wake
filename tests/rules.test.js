import test from 'node:test';
import assert from 'node:assert/strict';
import { difficulty, overlaps, nextCombo, tickCombo, seededRandom } from '../src/game/systems/rules.js';
import { normalizeProgress, settleRun, availableTrails } from '../src/game/data/progression.js';
import { normalizeSettings } from '../src/game/services/preferences.js';

test('difficulty thresholds and cap keep 250 m thresholds', () => {
    assert.equal(difficulty(249.99), 1); assert.equal(difficulty(250), 2); assert.equal(difficulty(3250), 14); assert.equal(difficulty(1e6), 14);
});
test('hitbox boundary is safe, interior collides', () => {
    assert.equal(overlaps(170, 200, 26, 10, 206, 200, 10, 18), false);
    assert.equal(overlaps(170, 200, 26, 10, 205.99, 200, 10, 18), true);
    assert.equal(overlaps(170, 200, 26, 10, 170, 228, 10, 18), false);
});
test('combo rewards grow linearly and expire exactly at timeout', () => {
    assert.deepEqual(nextCombo(2), { combo: 3, bonus: 300, timer: 3000 });
    assert.deepEqual(tickCombo(3, 100, 99), { combo: 3, timer: 1 });
    assert.deepEqual(tickCombo(3, 100, 100), { combo: 0, timer: 0 });
});
test('missions settle once, preserve profile and unlock cosmetics', () => {
    const p = normalizeProgress(), before = structuredClone(p);
    const first = settleRun(p, { distance: 160, coins: 9, nearMisses: 3, combo: 3 });
    assert.deepEqual(p, before); assert.equal(first.reward, 45);
    assert.deepEqual(availableTrails(first.profile), ['foam', 'mint']);
    const second = settleRun(first.profile, { distance: 160, coins: 0, nearMisses: 0, combo: 0 });
    assert.equal(second.reward, 0); assert.equal(second.profile.runs, 2);
});
test('corrupt progress and settings cannot inject invalid values', () => {
    const p = normalizeProgress({ runs: -1, coins: Infinity, claimed: ['fake', 'chain', 'chain'], achievements: 'gold' });
    assert.equal(p.runs, 0); assert.equal(p.coins, 0); assert.deepEqual(p.claimed, ['chain']); assert.deepEqual(p.achievements, []);
    assert.equal(normalizeSettings(null).volume, 0.45); assert.equal(normalizeSettings({ volume: 900, trail: 'fake' }).volume, 1);
    assert.equal(normalizeSettings({ trail: 'fake' }).trail, 'foam');
});
test('seeded randomness is repeatable and bounded', () => {
    const a = seededRandom(42), b = seededRandom(42);
    for (let i = 0; i < 1000; i++) { const value = a(); assert.equal(value, b()); assert.ok(value >= 0 && value < 1); }
});
