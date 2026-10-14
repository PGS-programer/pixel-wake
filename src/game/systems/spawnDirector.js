import { BALANCE } from '../config.js';
import { obstacleSpec, verticalRange } from '../data/obstacles.js';

const MIN_Y = 110, MAX_Y = 446, STEP = 4, DT = 0.04, MARGIN = 6;
const MAX_SPEED = BALANCE.startSpeed + (BALANCE.maxLevel - 1) * BALANCE.speedPerLevel;
const YS = Array.from({ length: (MAX_Y - MIN_Y) / STEP + 1 }, (_, i) => MIN_Y + i * STEP);
const STRIDE = MAX_SPEED * DT;

// Every edge is a continuous vertical segment outside swept hazard rectangles.
// World-distance drift makes a route validated at maximum world speed feasible
// at any slower speed too: same geometry, more time to move vertically.
export function findSafeRoute(hazards, playerY, { reaction = 0.12, coins = [] } = {}) {
    const ys = [...new Set([...YS, playerY])].sort((a, b) => a - b);
    hazards = hazards.filter(o => o.x + o.hitboxHalfWidth >= 144);
    const travel = Math.max(STRIDE, ...hazards.map(o => (o.x + o.hitboxHalfWidth - 144) / o.speedFactor + STRIDE), ...coins.map(c => (c.x - 170) / (c.speedFactor || 1) + STRIDE));
    const steps = Math.ceil(travel / STRIDE);
    const goals = new Map();
    for (const c of coins) {
        const tick = Math.max(1, Math.round((c.x - 170) / (c.speedFactor || 1) / STRIDE));
        const ys = goals.get(tick) || []; ys.push(c.y); goals.set(tick, ys);
    }
    let prev = [{ y: playerY, index: -1 }];
    const history = [];
    for (let tick = 1; tick <= steps; tick++) {
        const start = (tick - 1) * STRIDE, end = tick * STRIDE;
        const blocks = [];
        for (const o of hazards) {
            const a = o.x - start * o.speedFactor, b = o.x - end * o.speedFactor;
            if (b - o.hitboxHalfWidth > 196 + MARGIN || a + o.hitboxHalfWidth < 144 - MARGIN) continue;
            const [lo, hi] = verticalRange(o, start, end);
            blocks.push([lo - o.hitboxHalfHeight - 10 - MARGIN, hi + o.hitboxHalfHeight + 10 + MARGIN]);
        }
        const parents = new Int16Array(ys.length).fill(-2), next = [];
        const allowance = tick * DT <= reaction ? 0 : BALANCE.playerSpeed * DT;
        const targets = goals.get(tick);
        for (let i = 0; i < ys.length; i++) {
            const y = ys[i];
            if (targets?.some(target => Math.abs(y - target) > 14)) continue;
            for (const p of prev) {
                if (Math.abs(y - p.y) > allowance) continue;
                if (blocks.some(([lo, hi]) => Math.min(y, p.y) <= hi && Math.max(y, p.y) >= lo)) continue;
                parents[i] = p.index; next.push({ y, index: i }); break;
            }
        }
        if (!next.length) return null;
        history.push(parents); prev = next;
    }
    let index = prev.reduce((best, p) => Math.abs(p.y - playerY) < Math.abs(best.y - playerY) ? p : best).index;
    const path = [];
    for (let tick = steps - 1; tick >= 0; tick--) { path.push({ travel: (tick + 1) * STRIDE, y: ys[index] }); index = history[tick][index]; }
    path.push({ travel: 0, y: playerY }); path.reverse();
    return path;
}

export const PATTERNS = [
    { id: 'slalom', minLevel: 1, title: 'SLALOM' },
    { id: 'risk-line', minLevel: 1, title: 'POR EL BORDE' },
    { id: 'channel', minLevel: 2, title: 'ENTRE BOYAS' },
    { id: 'rock-bank', minLevel: 2, title: 'ESCOLLOS' },
    { id: 'crossing', minLevel: 3, title: 'TRÁFICO CRUZADO' },
    { id: 'sailing', minLevel: 3, title: 'A TODA VELA' },
    { id: 'overtake', minLevel: 4, title: 'ADELANTAMIENTO' },
    { id: 'driftwood', minLevel: 2, title: 'A LA DERIVA' },
    { id: 'jetski', minLevel: 7, title: 'ESTELA RÁPIDA' }
];
export function makePattern(id, random, x = 1035) {
    const mirror = random() < 0.5 ? -1 : 1;
    const center = 270 + (Math.floor(random() * 3) - 1) * 36;
    const obstacles = [], coins = [];
    const add = (type, dx, dy, extra = {}) => { const o = obstacleSpec(type, x + dx, center + dy * mirror, { phase: random() * Math.PI * 2, variant: Math.floor(random() * 6), ...extra }); obstacles.push(o); return o; };
    const line = (dx, y, arc = false, factor = 1) => { for (let i = 0; i < 3; i++) coins.push({ x: x + dx + i * 44, y: y + (arc ? Math.sin(i * Math.PI / 2) * 16 : 0), speedFactor: factor }); };
    switch (id) {
        case 'slalom': add('smallRock', 0, -78); add('buoy', 210, 78); line(20, center, true); break;
        case 'risk-line': { const o = add('rock', 0, 0); line(-80, o.y + 49 * mirror); break; }
        case 'channel': add('buoy', 0, -62); add('buoy', 0, 62); line(-80, center + 12 * mirror); break;
        case 'rock-bank': add('smallRock', 0, -92); add('smallRock', 65, -52); add('largeRock', 240, 80); line(-30, center + 3 * mirror); break;
        case 'crossing': add('speedboat', 0, -70); add('rock', 280, 76); line(110, center + 3 * mirror); break;
        case 'sailing': add('sailboat', 0, 55); line(-100, center - 26 * mirror, true, 0.94); break;
        case 'overtake': add('fishing', 0, -65); add('speedboat', 300, 75); line(60, center, false); break;
        case 'driftwood': add('log', 0, -70); add('largeRock', 200, 73); line(0, center + 3 * mirror, true); break;
        case 'jetski': add('jetski', 80, -50); add('buoy', 300, 90); line(10, center + 38 * mirror); break;
        default: throw new Error(`Unknown pattern: ${id}`);
    }
    return { id, obstacles, coins, extent: Math.max(...obstacles.map(o => o.x - x)) };
}
export function openingPattern() {
    return { id: 'opening', obstacles: [obstacleSpec('smallRock', 640, 270, { variant: 1 })], coins: [365, 411, 457].map(x => ({ x, y: 225, speedFactor: 1 })), extent: 0 };
}
export function directorSettings(level, index) {
    return { recovery: index > 0 && index % 5 === 4, gap: Math.max(190, 285 - (level - 1) * 8), maxObstacles: level < 3 ? 7 : 10 };
}
export function chooseEncounter({ level, index, random, hazards, coins = [], playerY, previousPattern }) {
    const settings = directorSettings(level, index);
    const eligible = PATTERNS.filter(p => p.minLevel <= level && p.id !== previousPattern);
    for (let attempt = 0; attempt < 4; attempt++) {
        const selected = eligible[Math.floor(random() * eligible.length)];
        const plan = makePattern(selected.id, random);
        const all = [...hazards, ...plan.obstacles];
        if (all.length > settings.maxObstacles || !findSafeRoute(all, playerY)) continue;
        if (coins.some(c => !coinIsClear(c, plan.obstacles))) continue;
        // Reward paths must be safe and reachable too, not merely visually empty.
        if (plan.coins.some(c => !coinIsClear(c, all)) || !findSafeRoute(all, playerY, { coins: plan.coins })) plan.coins = [];
        return { ...plan, nextTravel: plan.extent + settings.gap + (settings.recovery ? 160 : 0), recovery: settings.recovery };
    }
    return { id: 'breather', obstacles: [], coins: [], extent: 0, nextTravel: 100, recovery: true };
}
export function coinIsClear(coin, hazards) {
    const limit = Math.max(0, (coin.x - 140) / (coin.speedFactor || 1));
    for (const o of hazards) {
        for (let d = 0; d <= limit; d += 6) {
            const end = Math.min(limit, d + 6);
            const a = coin.x - d * (coin.speedFactor || 1) - (o.x - d * o.speedFactor);
            const b = coin.x - end * (coin.speedFactor || 1) - (o.x - end * o.speedFactor);
            const minX = a * b <= 0 ? 0 : Math.min(Math.abs(a), Math.abs(b));
            const [lo, hi] = verticalRange(o, d, end);
            if (minX < o.hitboxHalfWidth + 34 && coin.y > lo - o.hitboxHalfHeight - 21 && coin.y < hi + o.hitboxHalfHeight + 21) return false;
        }
    }
    return true;
}
