export const MISSIONS = [
    { id: 'first-mile', title: 'La primera travesía', description: 'Alcanza 150 m en una partida', metric: 'bestDistance', target: 150, reward: 8 },
    { id: 'treasure', title: 'Pequeño tesoro', description: 'Recoge 9 monedas entre partidas', metric: 'coins', target: 9, reward: 10 },
    { id: 'close-call', title: 'Por los pelos', description: 'Consigue 3 pasos cercanos en total', metric: 'nearMisses', target: 3, reward: 12 },
    { id: 'chain', title: 'En la zona', description: 'Alcanza un combo x3', metric: 'bestCombo', target: 3, reward: 15 },
    { id: 'navigator', title: 'Horizonte abierto', description: 'Alcanza 600 m en una partida', metric: 'bestDistance', target: 600, reward: 20 },
    { id: 'collector', title: 'El coleccionista', description: 'Recoge 50 monedas entre partidas', metric: 'coins', target: 50, reward: 25 },
    { id: 'master', title: 'Capitán del riesgo', description: 'Alcanza un combo x6', metric: 'bestCombo', target: 6, reward: 30 }
];
export const ACHIEVEMENTS = [
    { id: 'sailor', title: 'Primera estela', metric: 'runs', target: 1, detail: 'Completa tu primera partida' },
    { id: 'mint', title: 'Agua esmeralda', metric: 'bestCombo', target: 3, detail: 'Combo x3 · desbloquea estela menta', trail: 'mint' },
    { id: 'gold', title: 'Hora dorada', metric: 'bestDistance', target: 1000, detail: '1.000 m · desbloquea estela dorada', trail: 'gold' },
    { id: 'veteran', title: 'Lobo de mar', metric: 'runs', target: 20, detail: 'Completa 20 partidas' }
];
const count = value => Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
export function normalizeProgress(value = {}) {
    if (!value || typeof value !== 'object') value = {};
    return {
        version: 1, runs: count(value.runs), coins: count(value.coins), nearMisses: count(value.nearMisses),
        bestDistance: count(value.bestDistance), bestCombo: count(value.bestCombo),
        claimed: [...new Set(Array.isArray(value.claimed) ? value.claimed.filter(id => MISSIONS.some(m => m.id === id)) : [])],
        achievements: [...new Set(Array.isArray(value.achievements) ? value.achievements.filter(id => ACHIEVEMENTS.some(a => a.id === id)) : [])]
    };
}
export function previewProgress(profile, run) {
    return { ...profile, runs: profile.runs + 1, coins: profile.coins + count(run.coins), nearMisses: profile.nearMisses + count(run.nearMisses),
        bestDistance: Math.max(profile.bestDistance, count(run.distance)), bestCombo: Math.max(profile.bestCombo, count(run.combo)) };
}
export function settleRun(profile, run) {
    const next = previewProgress(normalizeProgress(profile), run);
    const completed = MISSIONS.filter(m => !next.claimed.includes(m.id) && next[m.metric] >= m.target);
    const unlocked = ACHIEVEMENTS.filter(a => !next.achievements.includes(a.id) && next[a.metric] >= a.target);
    next.claimed = [...next.claimed, ...completed.map(m => m.id)];
    next.achievements = [...next.achievements, ...unlocked.map(a => a.id)];
    return { profile: next, completed, unlocked, reward: completed.reduce((sum, m) => sum + m.reward, 0) };
}
export function activeMission(profile) { return MISSIONS.find(m => !profile.claimed.includes(m.id)); }
export function availableTrails(profile) { return ['foam', ...ACHIEVEMENTS.filter(a => a.trail && profile.achievements.includes(a.id)).map(a => a.trail)]; }
