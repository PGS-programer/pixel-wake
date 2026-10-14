import { element, action } from './screen.js';
export const touchDevice = () => navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
export const portraitTouch = () => touchDevice() && window.innerHeight > window.innerWidth;
export function canStartGameplay(message) {
    if (!portraitTouch()) return true;
    message('↻ GIRA EL DISPOSITIVO · La navegación se juega en horizontal.', true); return false;
}
export function mobileControls(scene, { multiplayer = false, neutral = () => {} } = {}) {
    scene.mobileDirection = 0;
    const controls = element('div', '', 'mobile-controls'); controls.setAttribute('aria-label', 'Controles de navegación');
    const held = new Map();
    for (const [text, direction] of [['▲', -1], ['▼', 1]]) {
        const b = action(controls, text, () => {}); b.setAttribute('aria-label', direction < 0 ? 'Subir' : 'Bajar');
        b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); held.set(e.pointerId, direction); scene.mobileDirection = direction; });
        const release = e => { held.delete(e.pointerId); scene.mobileDirection = [...held.values()].at(-1) || 0; };
        b.addEventListener('pointerup', release); b.addEventListener('pointercancel', release); b.addEventListener('lostpointercapture', release);
    }
    const cover = element('div', '↻ GIRA EL DISPOSITIVO\nNavega en horizontal.', 'rotate-cover');
    document.getElementById('app').append(controls, cover);
    const check = () => {
        cover.hidden = !portraitTouch();
        if (portraitTouch()) { held.clear(); scene.mobileDirection = 0; neutral(); if (!multiplayer && !scene.isPaused && !scene.isGameOver) scene.togglePause(); }
    };
    const blur = () => { held.clear(); scene.mobileDirection = 0; neutral(); };
    window.addEventListener('resize', check); window.addEventListener('blur', blur); check();
    scene.events.once('shutdown', () => { controls.remove(); cover.remove(); window.removeEventListener('resize', check); window.removeEventListener('blur', blur); });
    return controls;
}
