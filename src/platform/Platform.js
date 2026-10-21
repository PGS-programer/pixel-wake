import { MISSIONS } from '../simulator/world/harbor.js';
import { loadSimulator, saveOptions } from '../simulator/services/persistence.js';
const chart = `<svg viewBox="0 0 600 530" aria-hidden="true" class="harbor-illustration"><defs><pattern id="grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#67a29e" stroke-opacity=".12"/></pattern><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#173e49"/><stop offset="1" stop-color="#0a252f"/></linearGradient></defs><rect width="600" height="530" fill="url(#sea)"/><rect width="600" height="530" fill="url(#grid)"/><g fill="#244853" stroke="#72908b" stroke-width="1"><path d="M65 0V265H205V246H89V0ZM510 0V265H377V246H486V0Z"/><path d="M89 0H486V42H89Z"/><path d="M90 104H213V117H90ZM485 151H382V164H485Z"/></g><g fill="none" stroke="#8ac0b4" opacity=".18"><circle cx="300" cy="295" r="104"/><circle cx="300" cy="295" r="180"/><path d="M300 30V500M50 295H550"/></g><path d="M365 195Q410 184 438 148L460 105" stroke="#cbb286" stroke-width="2" stroke-dasharray="5 9" fill="none"/><g transform="translate(365 195) rotate(26)"><path d="M0 -49Q-15 -32 -15 32Q-14 43 0 44Q14 43 15 32Q15 -32 0 -49" fill="#e7e6d8"/><path d="M-12 -20H12V25H-12Z" fill="#567d86"/><path d="M-10 -18H10V-5H-10Z" fill="#152f3b"/><rect x="-10" y="1" width="20" height="15" fill="#c7ccc0"/><path d="M-11 47L-13 63M0 48V67M11 47L13 63" stroke="#e0e8d4" stroke-width="2" opacity=".23"/></g><circle cx="221" cy="282" r="4" fill="#cf6e5e"/><circle cx="370" cy="282" r="4" fill="#70b89c"/><rect x="460" y="64" width="14" height="55" fill="none" stroke="#d8be8b"/><g fill="#a9c4bf" font-family="monospace" font-size="10"><text x="102" y="70">PUERTO DE LA ESTELA</text><text x="400" y="58">E–02</text><text x="268" y="490">MARINA / N ↑</text><text x="405" y="330">07.2 m</text></g></svg>`;
export class Platform {
    constructor(root) { this.root = root; this.generation = 0; this.current = null; window.addEventListener('pixelwake:home', () => this.home()); }
    async clear() {
        const generation = ++this.generation;
        if (this.current) { const dispose = this.current; this.current = null; this.disposing = Promise.resolve(dispose()); }
        if (this.disposing) { const pending = this.disposing; await pending; if (this.disposing === pending) this.disposing = null; }
        if (generation !== this.generation) return null;
        this.root.querySelectorAll('.platform-screen, .sim-root').forEach(n => n.remove());
        document.body.classList.remove('simulator-active', 'gameplay-active', 'platform-active');
        return generation;
    }
    async home() {
        if (await this.clear() === null) return; document.body.classList.add('platform-active');
        const page = document.createElement('section'); page.className = 'platform-screen'; page.setAttribute('aria-label', 'Centro náutico Pixel Wake');
        page.innerHTML = `<header class="port-header"><a class="port-brand" href="#" aria-label="Pixel Wake inicio"><span class="brand-mark">PW</span><span>PIXEL WAKE<small>CENTRO NÁUTICO</small></span></a><div class="port-coordinates">41° N / 02° E <span>EDICIÓN PORTUARIA · 01</span></div><button class="text-button" data-options>OPCIONES ↗</button></header><main class="port-main"><div class="port-intro"><div class="port-kicker"><i></i> DOS FORMAS DE VIVIR EL MAR</div><h1>Encuentra<br>tu <em>rumbo.</em></h1><p>La adrenalina de una travesía.<br>La precisión de una maniobra.<br>El mismo horizonte.</p><span class="port-rule"></span><small>ELIGE TU EXPERIENCIA</small></div><div class="port-chart">${chart}<div class="chart-caption"><span>AUREA 24 / PUENTE DE MANDO</span><span>24 m · DOBLE HÉLICE</span></div></div><div class="mode-cards"><button class="mode-card arcade-card" data-arcade><span class="mode-number">01 / ARCADE MARÍTIMO</span><h2>Una travesía más <span>↗</span></h2><p>Obstáculos, monedas y combos.<br>Tu océano pixel art de siempre.</p><span class="mode-footer">INDIVIDUAL + MULTIJUGADOR <b>JUGAR →</b></span></button><button class="mode-card sim-card" data-simulator><span class="mode-number">02 / SIMULADOR DE ATRAQUE</span><h2>Al mando del puente <span>↗</span></h2><p>Dos motores. Una decisión a la vez.<br>Tu yate, tu amarre. Maniobra desde el inicio.</p><span class="mode-footer">PRIMERA PERSONA · 3D <b>EMBARCAR →</b></span></button></div></main><footer class="port-footer"><span>HECHO PARA QUIENES MIRAN AL MAR.</span><span>Simulación introductoria · Sin validez para navegación real</span></footer>`;
        this.root.append(page); page.querySelector('a').onclick = e => e.preventDefault();
        page.querySelector('[data-arcade]').onclick = () => this.arcade(); page.querySelector('[data-simulator]').onclick = () => this.levels(); page.querySelector('[data-options]').onclick = () => this.options();
    }
    async arcade() {
        const generation = await this.clear(); if (generation === null) return;
        const { default: StartGame } = await import('../game/main.js'); if (generation !== this.generation) return;
        const game = StartGame('game-container');
        this.current = () => new Promise(resolve => { game.events.once('destroy', () => { document.getElementById('game-container').replaceChildren(); resolve(); }); game.destroy(true); });
        if (import.meta.env.DEV) window.__PIXEL_WAKE__ = game;
    }
    async levels() {
        if (await this.clear() === null) return; document.body.classList.add('platform-active');
        const progress = loadSimulator(), page = document.createElement('section'); page.className = 'platform-screen level-screen';
        page.innerHTML = `<header class="port-header"><span class="port-brand"><span class="brand-mark">PW</span> ACADEMIA DE MANIOBRA</span><button data-back class="text-button">← CENTRO NÁUTICO</button></header><main class="level-main"><div class="port-kicker">SIMULADOR / AUREA 24</div><h1>Despacio.<br><em>Con intención.</em></h1><p>Cinco maniobras, un mismo puente. Completa cada atraque con 60 puntos para avanzar.</p><div class="level-list"></div><p class="level-note">Teclado: W/S babor · O/L estribor · ← → timón · ↑ a la vía · N punto muerto.<br>Ratón: arrastra para mirar. En móvil, controles táctiles. Tu progreso del arcade se conserva.</p></main>`;
        this.root.append(page); page.querySelector('[data-back]').onclick = () => this.home();
        for (const m of MISSIONS) {
            const b = document.createElement('button'); b.className = 'level-card'; b.disabled = m.id > progress.unlocked;
            b.innerHTML = `<span class="level-id">0${m.id}</span><span><strong>${m.title}</strong><small>${m.description}</small></span><span>${b.disabled ? 'BLOQUEADO' : progress.best[m.id] ? `${progress.best[m.id].score} / 100 ↗` : 'EMBARCAR ↗'}</span>`;
            b.onclick = () => this.simulator(m); page.querySelector('.level-list').append(b);
        }
    }
    async simulator(mission) {
        const generation = await this.clear(); if (generation === null) return; document.body.classList.add('simulator-active');
        const loading = document.createElement('div'); loading.className = 'sim-loading'; loading.textContent = 'PREPARANDO EL PUENTE…'; this.root.append(loading);
        try {
            const { startSimulator } = await import('../simulator/index.js'); if (generation !== this.generation) return;
            this.current = await startSimulator(this.root, mission, () => this.levels(), () => this.home());
        } catch (error) {
            if (generation !== this.generation) return;
            const p = document.createElement('section'); p.className = 'sim-fallback'; const message = document.createElement('p'); message.textContent = `No se pudo iniciar el modo 3D. Comprueba WebGL 2 y la aceleración gráfica. ${error.message}`;
            const back = document.createElement('button'); back.textContent = 'VOLVER AL CENTRO NÁUTICO'; back.onclick = () => this.home(); p.append(message, back); this.root.append(p); this.current = () => p.remove();
        } finally { loading.remove(); }
    }
    options() {
        const p = loadSimulator(), dialog = document.createElement('dialog'); dialog.className = 'port-dialog';
        dialog.innerHTML = `<div class="port-kicker">PREFERENCIAS / SIMULADOR</div><h2>Tu puesto de mando.</h2><label>Calidad gráfica<select><option value="auto">Automática</option><option value="high">Alta · reflejos y sombras</option><option value="low">Reducida · menor consumo</option></select></label><label><input type="checkbox"> Sonido de motores y ambiente</label><label>Sensibilidad de cámara<input type="range" min="0.3" max="2" step="0.1" value="${p.options.sensitivity}"></label><p>Los ajustes del arcade siguen disponibles dentro de su propio menú.</p><button class="port-primary">GUARDAR Y VOLVER</button>`;
        this.root.append(dialog); const select = dialog.querySelector('select'), check = dialog.querySelector('[type=checkbox]'); select.value = p.options.quality; check.checked = p.options.sound;
        dialog.querySelector('button').onclick = () => { saveOptions({ quality: select.value, sound: check.checked, sensitivity: Number(dialog.querySelector('[type=range]').value) }); dialog.close(); };
        dialog.addEventListener('close', () => dialog.remove(), { once: true }); dialog.showModal();
    }
}
