const KEY = 'pixelWakeDockingV1';
let session = { version: 1, unlocked: 1, best: {}, options: { quality: 'auto', sound: true, sensitivity: 1 } };
export function loadSimulator() {
    try {
        const p = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (p?.version === 1) {
            const best = {};
            for (let id = 1; id <= 5; id++) { const r = p.best?.[id]; if (r && Number.isFinite(r.score) && Number.isFinite(r.time) && r.time >= 0) best[id] = { score: Math.max(0, Math.min(100, Math.round(r.score))), time: r.time }; }
            const o = p.options || {};
            session = { version: 1, unlocked: Math.max(1, Math.min(5, Math.floor(Number(p.unlocked) || 1))), best,
                options: { quality: ['auto', 'low', 'high'].includes(o.quality) ? o.quality : 'auto', sound: typeof o.sound === 'boolean' ? o.sound : true, sensitivity: Number.isFinite(o.sensitivity) ? Math.max(.3, Math.min(2, o.sensitivity)) : 1 } };
        }
    } catch { /* Storage unavailable: keep this session playable. */ }
    return session;
}
export function saveOptions(options) { session.options = { ...session.options, ...options }; persist(); }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(session)); } catch { /* Explicitly independent of the arcade profile. */ } }
export function saveResult(id, result) {
    const previous = session.best[id];
    if (!previous || result.score > previous.score) session.best[id] = { score: result.score, time: result.time };
    if (result.score >= 60) session.unlocked = Math.max(session.unlocked, Math.min(5, id + 1));
    persist();
}
