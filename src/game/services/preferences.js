import { safeLoadString, safeSaveString } from './storage.js';
const KEY = 'pixelWakeSettingsV1';
export function normalizeSettings(value = {}) {
    if (!value || typeof value !== 'object') value = {};
    return {
        volume: Number.isFinite(value.volume) ? Math.max(0, Math.min(1, value.volume)) : 0.45,
        muted: value.muted === true,
        reducedEffects: value.reducedEffects === true,
        tutorialSeen: value.tutorialSeen === true,
        trail: ['foam', 'mint', 'gold'].includes(value.trail) ? value.trail : 'foam'
    };
}
export function getSettings() {
    try { return normalizeSettings(JSON.parse(safeLoadString(KEY, '{}'))); }
    catch { return normalizeSettings(); }
}
export function saveSettings(patch) {
    const next = normalizeSettings({ ...getSettings(), ...patch });
    safeSaveString(KEY, JSON.stringify(next));
    return next;
}
