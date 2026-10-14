import { safeLoadString, safeSaveString, safeLoadNumber } from './storage.js';
import { STORAGE_KEYS } from '../config.js';
import { normalizeProgress } from '../data/progression.js';
export function loadProgress() {
    let value;
    try { value = JSON.parse(safeLoadString('pixelWakeProgressV1', '{}')); } catch { value = {}; }
    const profile = normalizeProgress(value);
    // Existing distance records count towards goals; original records are untouched.
    profile.bestDistance = Math.max(profile.bestDistance, safeLoadNumber(STORAGE_KEYS.bestDistance));
    return profile;
}
export function saveProgress(profile) { safeSaveString('pixelWakeProgressV1', JSON.stringify(normalizeProgress(profile))); }
