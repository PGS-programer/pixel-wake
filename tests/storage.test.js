import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS } from '../src/game/config.js';
import { safeLoadNumber, safeSaveNumber, safeLoadString, safeSaveString, loadUnlockedBoats, saveUnlockedBoats } from '../src/game/services/storage.js';
import { loadProgress } from '../src/game/services/progress.js';
const data = new Map([[STORAGE_KEYS.coins, '27'], [STORAGE_KEYS.bestDistance, '820'], [STORAGE_KEYS.unlockedBoats, '["riptide","unknown","riptide"]']]);
globalThis.window = { localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } };
test('legacy saves remain readable, normalize boat list, seed distance only', () => {
    assert.equal(safeLoadNumber(STORAGE_KEYS.coins), 27);
    assert.deepEqual(loadUnlockedBoats(), ['coastal', 'riptide']);
    assert.equal(loadProgress().bestDistance, 820); assert.equal(data.get(STORAGE_KEYS.bestDistance), '820');
});
test('bad numeric and JSON values recover without throwing', () => {
    data.set('negative', '-40'); data.set('notFinite', 'Infinity'); data.set(STORAGE_KEYS.unlockedBoats, '{broken');
    assert.equal(safeLoadNumber('negative', 7), 7); assert.equal(safeLoadNumber('notFinite'), 0);
    assert.deepEqual(loadUnlockedBoats(), ['coastal']);
});
test('storage denied keeps wallet, boats and selection across scenes in memory', () => {
    window.localStorage = { getItem() { throw Error('denied'); }, setItem() { throw Error('quota'); } };
    safeSaveNumber(STORAGE_KEYS.coins, 31); saveUnlockedBoats(['aurora']); safeSaveString(STORAGE_KEYS.selectedBoat, 'aurora');
    assert.equal(safeLoadNumber(STORAGE_KEYS.coins), 31); assert.deepEqual(loadUnlockedBoats(), ['coastal', 'aurora']); assert.equal(safeLoadString(STORAGE_KEYS.selectedBoat), 'aurora');
});
