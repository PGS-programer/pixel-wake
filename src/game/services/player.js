import { PROFILE_KEY, normalizePlayer, playerName } from '../../shared/profile.js';
import { STORAGE_KEYS } from '../config.js';
import { safeLoadString, safeSaveString, safeLoadNumber, safeSaveNumber, loadUnlockedBoats, saveUnlockedBoats } from './storage.js';
import { loadProgress, saveProgress } from './progress.js';
import { getSettings, saveSettings } from './preferences.js';
let cached = null, applying = false, dirty = false, generation = 0, inFlight = null, timer = null, status = 'local';
const base = (import.meta.env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
export const backendBase = () => base;
function persist() { safeSaveString(PROFILE_KEY, JSON.stringify(cached)); }
export function getPlayer() {
    if (!cached) { try { cached = normalizePlayer(JSON.parse(safeLoadString(PROFILE_KEY, '{}'))); } catch { cached = normalizePlayer(); } }
    const progress = loadProgress();
    cached = normalizePlayer({ ...cached, coins: safeLoadNumber(STORAGE_KEYS.coins), selectedBoat: safeLoadString(STORAGE_KEYS.selectedBoat, 'coastal'),
        unlockedBoats: loadUnlockedBoats(), bestScore: Math.max(cached.bestScore, safeLoadNumber(STORAGE_KEYS.bestPoints)),
        bestDistance: Math.max(cached.bestDistance, safeLoadNumber(STORAGE_KEYS.bestDistance)), gamesPlayed: Math.max(cached.gamesPlayed, progress.runs + cached.multiplayerGames), progress, settings: getSettings() });
    return cached;
}
export function credentials() { return { id: getPlayer().id, token: safeLoadString('pixelWakeIdentitySecretV1') }; }
export function createPlayer(name) {
    const valid = playerName(name), previous = getPlayer();
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    safeSaveString('pixelWakeIdentitySecretV1', [...bytes].map(n => n.toString(16).padStart(2, '0')).join(''));
    cached = normalizePlayer({ ...previous, id: [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5'), name: valid });
    persist(); changed(); return cached;
}
export function renamePlayer(name) { cached = { ...getPlayer(), name: playerName(name) }; persist(); changed(); }
export function syncStatus() { return status; }
export async function request(path, options = {}) {
    const { id, token } = credentials();
    const response = await fetch(base + path, { ...options, headers: { 'content-type': 'application/json', authorization: `Bearer ${id}.${token}`, ...options.headers }, signal: options.signal || AbortSignal.timeout(7000) });
    const result = await response.json();
    if (!response.ok) { const e = new Error(result.error || 'No se pudo conectar al servidor.'); e.status = response.status; e.profile = result.profile; throw e; }
    return result;
}
function applyCloud(value, preserveLocal = false) {
    const local = getPlayer();
    cached = normalizePlayer({ ...value, ...(preserveLocal ? { ...local, revision: value.revision, wins: value.wins, losses: value.losses,
        bestScore: Math.max(local.bestScore, value.bestScore), bestDistance: Math.max(local.bestDistance, value.bestDistance) } : {}) });
    cached.bestScore = Math.max(local.bestScore, cached.bestScore); cached.bestDistance = Math.max(local.bestDistance, cached.bestDistance);
    applying = true;
    try {
        safeSaveNumber(STORAGE_KEYS.coins, cached.coins); safeSaveNumber(STORAGE_KEYS.bestDistance, cached.bestDistance); safeSaveNumber(STORAGE_KEYS.bestPoints, cached.bestScore);
        safeSaveString(STORAGE_KEYS.selectedBoat, cached.selectedBoat); saveUnlockedBoats(cached.unlockedBoats); saveProgress(cached.progress); saveSettings(cached.settings); persist();
    } finally { applying = false; }
    window.dispatchEvent(new CustomEvent('pixelwake:profile'));
}
export function applyServerStats(value) {
    const p = getPlayer(); cached = { ...p, wins: value.wins, losses: value.losses, multiplayerGames: value.multiplayerGames, gamesPlayed: Math.max(value.gamesPlayed, p.progress.runs + value.multiplayerGames), revision: value.revision }; persist();
    window.dispatchEvent(new CustomEvent('pixelwake:profile'));
}
export function changed() {
    if (applying || !getPlayer().name) return;
    generation++; dirty = true; persist(); safeSaveString('pixelWakeSyncPendingV1', '1');
    clearTimeout(timer); timer = setTimeout(() => { syncPlayer().catch(() => {}); }, 600);
}
export function syncPlayer() {
    if (!getPlayer().name) return Promise.resolve(null);
    if (inFlight) return inFlight;
    inFlight = (async () => {
        const local = { ...getPlayer() }, stamp = generation; status = 'sincronizando';
        try {
            const auth = credentials();
            const { profile: remote } = await request('/api/identity', { method: 'POST', body: JSON.stringify({ ...auth, profile: local }) });
            if (!dirty && safeLoadString('pixelWakeSyncPendingV1') !== '1') { applyCloud(remote); status = 'online'; return remote; }
            // Revision conflicts preserve the server wallet; keep a copy for manual recovery.
            try {
                const { profile } = await request('/api/profile', { method: 'PUT', body: JSON.stringify({ ...local, revision: local.revision || remote.revision }) });
                applyCloud(profile, generation !== stamp);
                if (generation === stamp) { dirty = false; safeSaveString('pixelWakeSyncPendingV1', '0'); }
                status = 'online'; return profile;
            } catch (e) {
                if (e.status === 409 && e.profile) {
                    safeSaveString('pixelWakeSyncConflictBackupV1', JSON.stringify(local));
                    const remote = e.profile;
                    const progress = { ...remote.progress };
                    for (const key of ['runs', 'coins', 'nearMisses', 'bestDistance', 'bestCombo']) progress[key] = Math.max(local.progress[key], remote.progress[key]);
                    for (const key of ['claimed', 'achievements']) progress[key] = [...new Set([...local.progress[key], ...remote.progress[key]])];
                    const merged = { ...local, revision: remote.revision, coins: remote.coins,
                        bestScore: Math.max(local.bestScore, remote.bestScore), bestDistance: Math.max(local.bestDistance, remote.bestDistance),
                        gamesPlayed: Math.max(local.gamesPlayed, remote.gamesPlayed), unlockedBoats: [...new Set([...local.unlockedBoats, ...remote.unlockedBoats])], progress };
                    const { profile } = await request('/api/profile', { method: 'PUT', body: JSON.stringify(merged) });
                    applyCloud(profile, generation !== stamp);
                    if (generation === stamp) { dirty = false; safeSaveString('pixelWakeSyncPendingV1', '0'); }
                    status = 'conflicto'; return profile;
                }
                throw e;
            }
        } catch (e) { status = e.status === 400 ? 'dato rechazado por el servidor' : 'sin conexión'; throw e; }
        finally { inFlight = null; window.dispatchEvent(new CustomEvent('pixelwake:profile')); }
    })();
    return inFlight;
}
export function installPlayerSync() {
    window.addEventListener('pixelwake:storage', e => { if (Object.values(STORAGE_KEYS).includes(e.detail) || ['pixelWakeProgressV1', 'pixelWakeSettingsV1'].includes(e.detail)) changed(); });
    window.addEventListener('online', () => syncPlayer().catch(() => {}));
    setInterval(() => { if (getPlayer().name && (dirty || status !== 'online')) syncPlayer().catch(() => {}); }, 30_000);
}
