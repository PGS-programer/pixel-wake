import { installPlayerSync } from './game/services/player.js';
import { Platform } from './platform/Platform.js';
import './platform/platform.css';

document.addEventListener('DOMContentLoaded', () => {
    installPlayerSync();
    new Platform(document.getElementById('app')).home();
});
