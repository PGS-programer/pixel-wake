import { installPlayerSync } from './game/services/player.js';
import StartGame from './game/main.js';

document.addEventListener('DOMContentLoaded', () => {
    installPlayerSync();
    const game = StartGame('game-container');
    // Inspection hook for local QA only, never included in production builds.
    if (import.meta.env.DEV) window.__PIXEL_WAKE__ = game;
});
