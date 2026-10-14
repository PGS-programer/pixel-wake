// Pure authoritative simulation shared with client prediction and Node tests.
import { BALANCE } from '../config.js';
import { seededRandom, crossingSample, tickCombo, nextCombo, difficulty } from '../systems/rules.js';
import { openingPattern, chooseEncounter, findSafeRoute } from '../systems/spawnDirector.js';
import { atTravel } from '../data/obstacles.js';
export const STEP = 1 / 60, PUSH_COOLDOWN = 0.35, DRAW_WINDOW = 0.25;
export const clampY = y => Math.max(110, Math.min(446, y));
export function movePlayer(p, direction, dt) {
    p.y = clampY(p.y + Math.max(-1, Math.min(1, direction)) * BALANCE.playerSpeed * dt + p.impulse * dt);
    p.impulse *= Math.exp(-9 * dt);
}
export function pushPlayers(a, b) {
    if (!a.alive || !b.alive || a.cooldown > 0 || b.cooldown > 0 || Math.abs(a.y - b.y) >= 24) return false;
    const sign = a.y <= b.y ? -1 : 1, mid = (a.y + b.y) / 2;
    a.y = clampY(mid + sign * 14); b.y = clampY(mid - sign * 14);
    a.impulse = sign * 125; b.impulse = -sign * 125;
    a.cooldown = b.cooldown = PUSH_COOLDOWN; return true;
}
export function newMatch(seed, players) {
    const opening = openingPattern();
    return { seed, random: seededRandom(seed), elapsed: 0, distance: 0, level: 1, speed: BALANCE.startSpeed,
        spawnTravel: 335, encounter: 0, previousPattern: 'opening', nextId: 2,
        obstacles: opening.obstacles.map((o, i) => ({ ...o, id: i + 1 })),
        players: players.map((p, i) => ({ id: p.id, name: p.name, boat: p.boat, y: i ? 315 : 225, impulse: 0, cooldown: 0,
            alive: true, deathAt: null, direction: 0, inputSeq: 0, combo: 0, timer: 0, score: 0, near: [], candidates: [] })),
        result: null, bump: 0 };
}
export function stepMatch(s, dt = STEP) {
    if (s.result) return;
    s.elapsed += dt;
    s.level = difficulty(s.distance);
    s.speed = Math.min(BALANCE.startSpeed + (s.level - 1) * BALANCE.speedPerLevel, s.speed + 72 * dt);
    s.distance += 12 * s.speed / BALANCE.startSpeed * dt;
    const previous = s.players.map(p => p.y);
    for (const p of s.players) { p.cooldown = Math.max(0, p.cooldown - dt); if (p.alive) movePlayer(p, p.direction, dt); }
    if (pushPlayers(...s.players)) s.bump++;
    s.spawnTravel -= s.speed * dt;
    if (s.spawnTravel <= 0) {
        const live = s.players.filter(p => p.alive);
        let plan = chooseEncounter({ level: s.level, index: s.encounter++, random: s.random, hazards: s.obstacles, playerY: live[0]?.y ?? 270, previousPattern: s.previousPattern });
        // Both players must have an escape before an encounter is committed.
        if (live.some(p => !findSafeRoute([...s.obstacles, ...plan.obstacles], p.y))) plan = { id: 'breather', obstacles: [], nextTravel: 100 };
        s.obstacles.push(...plan.obstacles.map(o => ({ ...o, id: s.nextId++ })));
        s.spawnTravel = plan.nextTravel; s.previousPattern = plan.id;
    }
    for (const o of s.obstacles) {
        o.previousX = o.x; o.previousY = o.y;
        Object.assign(o, atTravel(o, s.speed * dt)); o.travelled += s.speed * dt;
    }
    for (let i = 0; i < s.players.length; i++) {
        const p = s.players[i]; if (!p.alive) continue;
        p.score += 6 * s.speed / BALANCE.startSpeed * dt;
        for (const o of s.obstacles) {
            const sample = crossingSample({ x: 170, y: p.y }, previous[i], { halfWidth: 26, halfHeight: 10 }, o);
            if (sample.collision) { p.alive = false; p.deathAt = s.elapsed; break; }
            if (sample.nearGap !== null && !p.candidates.includes(o.id)) p.candidates.push(o.id);
            if (o.x + o.hitboxHalfWidth < 144 && !p.near.includes(o.id)) {
                p.near.push(o.id);
                if (p.candidates.includes(o.id)) { const n = nextCombo(p.combo); p.combo = n.combo; p.timer = n.timer; p.score += n.bonus; }
            }
        }
        const n = tickCombo(p.combo, p.timer, dt * 1000); p.combo = n.combo; p.timer = n.timer;
    }
    s.obstacles = s.obstacles.filter(o => o.x > -100);
    const active = new Set(s.obstacles.map(o => o.id));
    for (const p of s.players) { p.near = p.near.filter(id => active.has(id)); p.candidates = p.candidates.filter(id => active.has(id)); }
    const dead = s.players.filter(p => !p.alive);
    if (dead.length === 2) s.result = { winner: Math.abs(dead[0].deathAt - dead[1].deathAt) <= DRAW_WINDOW ? null : dead.reduce((a, b) => a.deathAt > b.deathAt ? a : b).id, reason: 'collision' };
    else if (dead.length && s.elapsed - dead[0].deathAt >= DRAW_WINDOW) s.result = { winner: s.players.find(p => p.alive).id, reason: 'collision' };
    if (s.elapsed >= 1800 && !s.result) s.result = { winner: null, reason: 'time-limit' };
}
export function snapshot(s) {
    return { seed: s.seed, elapsed: s.elapsed, distance: s.distance, level: s.level, speed: s.speed,
        players: s.players.map(({ near, candidates, ...p }) => p), obstacles: s.obstacles, result: s.result, bump: s.bump };
}
