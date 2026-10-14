import { BOATS } from '../game/data/boats.js';
import { normalizeProgress } from '../game/data/progression.js';
export const PROFILE_KEY = 'pixelWakePlayerV1';
export const LIMITS = { bestScore: 10_000_000, bestDistance: 1_000_000, coins: 1_000_000, gamesPlayed: 1_000_000 };
export function playerName(raw) {
    const name = typeof raw === 'string' ? raw.normalize('NFKC').trim().replace(/ +/g, ' ') : '';
    if (Array.from(name).length < 3 || Array.from(name).length > 15 || !/^[\p{L}\p{N}_ -]+$/u.test(name)) throw new Error('Usa entre 3 y 15 letras, números, espacios, guiones o _.');
    return name;
}
export function count(value, max = Number.MAX_SAFE_INTEGER) { return Number.isSafeInteger(value) && value >= 0 ? Math.min(max, value) : 0; }
export function normalizePlayer(value = {}) {
    const unlockedBoats = [...new Set(['coastal', ...(Array.isArray(value.unlockedBoats) ? value.unlockedBoats.filter(id => BOATS.some(b => b.id === id)) : [])])];
    return { id: typeof value.id === 'string' ? value.id : '', name: typeof value.name === 'string' ? value.name : '',
        coins: count(value.coins), selectedBoat: unlockedBoats.includes(value.selectedBoat) ? value.selectedBoat : 'coastal', unlockedBoats,
        bestScore: count(value.bestScore), bestDistance: count(value.bestDistance),
        gamesPlayed: count(value.gamesPlayed), multiplayerGames: count(value.multiplayerGames), wins: count(value.wins), losses: count(value.losses),
        progress: normalizeProgress(value.progress), settings: value.settings && typeof value.settings === 'object' ? value.settings : {},
        revision: count(value.revision), updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null };
}
export function validateUpload(value) {
    playerName(value.name);
    for (const [key, max] of Object.entries(LIMITS)) if (!Number.isSafeInteger(value[key]) || value[key] < 0 || value[key] > max) throw new Error(`Valor inválido: ${key}`);
    return normalizePlayer(value);
}
