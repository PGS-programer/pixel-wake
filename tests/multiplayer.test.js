import test from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, stepMatch, pushPlayers, movePlayer, DRAW_WINDOW } from '../src/game/multiplayer/simulation.js';
import { playerName, validateUpload, normalizePlayer } from '../src/shared/profile.js';
import { Store } from '../server/store.js';
const people = [{ id: 'a', name: 'POL', boat: 'coastal' }, { id: 'b', name: 'MARC', boat: 'coastal' }];
test('profile validation rejects dangerous names and invalid score claims', () => {
    assert.equal(playerName('  Pól_7  '), 'Pól_7');
    assert.equal(normalizePlayer({ bestScore: 11_000_000 }).bestScore, 11_000_000); // Cloud limits never truncate a local record.
    for (const name of ['', 'ab', '<script>', 'a'.repeat(16), 'POL\nMARC']) assert.throws(() => playerName(name));
    for (const value of [-1, Infinity, NaN, 1e20, 1.5]) assert.throws(() => validateUpload({ name: 'POL', bestScore: value, bestDistance: 0, coins: 0, gamesPlayed: 0 }));
});
test('server simulation is deterministic, shared obstacles and separate combos', () => {
    const a = newMatch(42, people), b = newMatch(42, people); a.players[1].y = b.players[1].y = 380;
    for (let i = 0; i < 160; i++) { stepMatch(a); stepMatch(b); }
    assert.deepEqual(a.obstacles, b.obstacles); assert.deepEqual(a.players, b.players);
    assert.equal(a.players[0].alive, true); assert.equal(a.players[1].alive, true);
    assert.equal(a.players[0].combo, 1); assert.equal(a.players[1].combo, 0);
});
test('push separates hulls with bounded impulse and cooldown, not death', () => {
    const s = newMatch(7, people), [a, b] = s.players; a.y = 250; b.y = 260;
    assert.equal(pushPlayers(a, b), true); assert.equal(Math.abs(a.y - b.y), 28); assert.equal(a.alive, true); assert.equal(b.alive, true);
    assert.ok(Math.abs(a.impulse) <= 125); assert.equal(pushPlayers(a, b), false);
    const before = a.y; movePlayer(a, 0, .016); assert.ok(before - a.y < 3);
});
test('near simultaneous deaths draw; surviving player wins after grace window', () => {
    const draw = newMatch(7, people); draw.players[0].alive = false; draw.players[0].deathAt = 0; draw.players[1].alive = false; draw.players[1].deathAt = .2;
    stepMatch(draw); assert.equal(draw.result.winner, null);
    const win = newMatch(8, people); win.players[0].alive = false; win.players[0].deathAt = 0;
    for (let t = 0; t < DRAW_WINDOW + .05; t += 1 / 60) stepMatch(win);
    assert.equal(win.result.winner, 'b');
});
test('SQL saves one best ranking row, authentication, revision conflicts and idempotent results', () => {
    const store = new Store(':memory:');
    const ids = ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'];
    const base = { name: 'POL', coins: 10, bestScore: 1000, bestDistance: 100, gamesPlayed: 1 };
    let p = store.register(ids[0], 'a'.repeat(64), base); store.register(ids[1], 'b'.repeat(64), { ...base, name: 'MARC' });
    assert.equal(store.authenticate(ids[0], 'c'.repeat(64)), false);
    p = store.save(ids[0], { ...p, bestScore: 2000 }).profile;
    p = store.save(ids[0], { ...p, bestScore: 1500 }).profile;
    assert.equal(store.ranking('score', ids[0]).me.bestScore, 2000); assert.equal(store.ranking('score', ids[0]).rows.length, 2);
    assert.equal(store.save(ids[0], { ...p, revision: 1 }).conflict, true);
    const room = { code: 'ABC123', host: ids[0], guest: ids[1] };
    store.finish('round', room, ids[0], 'collision'); store.finish('round', room, ids[0], 'collision');
    assert.equal(store.get(ids[0]).gamesPlayed, 2); assert.equal(store.get(ids[0]).multiplayerGames, 1); assert.equal(store.get(ids[0]).wins, 1); assert.equal(store.get(ids[1]).losses, 1); store.close();
});
