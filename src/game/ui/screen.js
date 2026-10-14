import { audio } from '../services/audio.js';
export function element(tag, text = '', className = '') {
    const node = document.createElement(tag); node.textContent = text; node.className = className; return node;
}
export function screen(scene, title, subtitle = '', { menu = false } = {}) {
    const layer = element('section', '', `ui-screen${menu ? ' menu-screen' : ''}`); layer.setAttribute('aria-label', title);
    const card = element('div', '', 'ui-card'); layer.append(card);
    card.append(element('div', 'PW / OCEAN ARCADE', 'eyebrow'), element('h1', title), element('p', subtitle, 'muted'));
    layer.addEventListener('keydown', e => { if (e.target.closest('input, button, select, textarea')) e.stopPropagation(); });
    layer.addEventListener('keyup', e => { if (e.target.closest('input, button, select, textarea')) e.stopPropagation(); });
    document.getElementById('app').append(layer);
    const destroy = () => { layer.remove(); scene.events.off('shutdown', destroy); };
    scene.events.once('shutdown', destroy);
    return { layer, card, destroy, message: (text, error = false) => { let n = card.querySelector('[role=status]'); if (!n) { n = element('p'); n.setAttribute('role', 'status'); card.append(n); } n.textContent = text; n.className = error ? 'error' : 'notice'; } };
}
export function action(parent, text, fn, primary = false) {
    const button = element('button', text, primary ? 'primary' : ''); button.type = 'button';
    button.addEventListener('click', e => { audio.unlock(); audio.play('tap'); fn(e); }); parent.append(button); return button;
}
export function input(parent, title, { type = 'text', maxLength = 64, value = '', placeholder = '', autocomplete = 'off' } = {}) {
    const label = element('label', title); const field = document.createElement('input');
    Object.assign(field, { type, maxLength, value, placeholder, autocomplete }); label.append(field); parent.append(label); return field;
}
export function back(scene, parent, target = 'MenuScene') { return action(parent, '← VOLVER', () => scene.scene.start(target)); }
export function form(parent, fn) {
    const f = element('form'); parent.append(f);
    f.addEventListener('submit', async e => { e.preventDefault(); audio.unlock(); const b = f.querySelector('[type=submit]'); if (b?.disabled) return; if (b) b.disabled = true; try { await fn(); } finally { if (b) b.disabled = false; } });
    return f;
}
export function submit(parent, text) { const b = element('button', text, 'primary'); b.type = 'submit'; parent.append(b); return b; }
export function stats(parent, entries) {
    const grid = element('dl', '', 'stats-grid');
    for (const [title, value] of entries) { const cell = element('div'); cell.append(element('dt', title), element('dd', String(value))); grid.append(cell); }
    parent.append(grid); return grid;
}
