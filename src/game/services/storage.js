import { STORAGE_KEYS } from '../config.js';
import { BOATS } from '../data/boats.js';
// Memory fallback keeps progress across scenes when storage is blocked or full.
const memory = new Map();
function read(key) {
    if (memory.has(key)) return memory.get(key);
    try { return window.localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
    const text = String(value);
    memory.set(key, text);
    try { window.localStorage.setItem(key, text); } catch { /* Session remains playable. */ }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new CustomEvent('pixelwake:storage', { detail: key }));
}
export function safeLoadNumber(key, fallback = 0) {
    const raw = read(key);
    if (raw === null) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}
export function safeSaveNumber(key, value) {
    if (Number.isFinite(value) && value >= 0) write(key, Math.floor(value));
}
export function safeLoadString(key, fallback = '') { return read(key) ?? fallback; }
export function safeSaveString(key, value) { write(key, value); }
export function loadUnlockedBoats() {
    try {
        const parsed = JSON.parse(read(STORAGE_KEYS.unlockedBoats) || '["coastal"]');
        if (!Array.isArray(parsed)) return ['coastal'];
        return [...new Set(['coastal', ...parsed.filter(id => BOATS.some(b => b.id === id))])];
    } catch { return ['coastal']; }
}
export function saveUnlockedBoats(ids) {
    write(STORAGE_KEYS.unlockedBoats, JSON.stringify([...new Set(['coastal', ...ids.filter(id => BOATS.some(b => b.id === id))])]));
}
