import { audio } from '../services/audio.js';
import { getSettings } from '../services/preferences.js';

export const C = { navy: 0x092c37, panel: 0x103f49, teal: 0x46dfc1, gold: 0xffd166, cream: 0xfff4d9, muted: 0x93bdbe };
export function label(scene, x, y, text, size = 16, color = '#fff4d9', depth = 100) {
    return scene.add.text(x, y, text, { fontFamily: 'monospace', fontSize: `${size}px`, color }).setDepth(depth);
}
export function panel(scene, x, y, w, h, color = C.panel, depth = 90) {
    scene.add.rectangle(x + 4, y + 5, w, h, C.navy, 0.5).setDepth(depth - 1);
    return scene.add.rectangle(x, y, w, h, color).setStrokeStyle(1, 0x537d7b, 0.5).setDepth(depth);
}
export function button(scene, x, y, text, action, { width = 260, height = 48, primary = false, depth = 110, size = 17 } = {}) {
    const color = primary ? C.gold : C.panel;
    const shadow = scene.add.rectangle(x + 3, y + 4, width, height, C.navy).setDepth(depth - 1);
    const bg = scene.add.rectangle(x, y, width, height, color).setStrokeStyle(1, primary ? C.gold : 0x638f8d).setDepth(depth).setInteractive({ useHandCursor: true });
    const textObject = label(scene, x, y, text, size, primary ? '#092c37' : '#fff4d9', depth + 1).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(primary ? 0xffdf91 : 0x1b5860));
    bg.on('pointerout', () => bg.setFillStyle(color));
    bg.on('pointerdown', () => { audio.unlock(); audio.play('tap'); action(); });
    return { bg, text: textObject, destroy: () => { bg.destroy(); shadow.destroy(); textObject.destroy(); } };
}
export function bindKey(scene, event, fn) {
    const handler = e => { if (!e?.repeat && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) fn(e); };
    scene.input.keyboard.on(event, handler);
    scene.events.once('shutdown', () => scene.input.keyboard.off(event, handler));
}
export function enter(scene) {
    if (!getSettings().reducedEffects) scene.cameras.main.fadeIn(220, 9, 44, 55);
}
export function header(scene, title, sub) {
    label(scene, 36, 24, 'PW / PIXEL WAKE', 14, '#46dfc1');
    label(scene, 36, 64, title, 34);
    label(scene, 36, 109, sub, 13, '#93bdbe');
}
export function progressBar(scene, x, y, width, ratio, depth = 110) {
    scene.add.rectangle(x, y, width, 5, C.navy).setOrigin(0, 0.5).setDepth(depth);
    return scene.add.rectangle(x, y, width * Math.max(0, Math.min(1, ratio)), 5, C.teal).setOrigin(0, 0.5).setDepth(depth + 1);
}
