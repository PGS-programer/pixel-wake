import * as Phaser from 'phaser';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { screen, action, form, input, submit, back, element } from '../ui/screen.js';
import { network } from '../multiplayer/network.js';
export default class MultiplayerMenuScene extends Phaser.Scene {
    constructor() { super('MultiplayerMenuScene'); }
    create() {
        createOceanBackdrop(this); const ui = screen(this, 'MULTIJUGADOR', 'Dos barcos. El mismo océano. Solo uno sobrevive.');
        const choices = element('div'); ui.card.append(choices); const fields = element('div'); ui.card.append(fields);
        const show = mode => {
            fields.replaceChildren();
            const f = form(fields, async () => {
                try {
                    ui.message('Conectando…'); await network.connect();
                    network.send(mode, mode === 'create' ? { name: roomName.value, password: password.value } : { code: code.value, password: password.value });
                    password.value = ''; ui.message('Comprobando sala…');
                } catch (e) { ui.message(e.message, true); }
            });
            let roomName, code;
            if (mode === 'create') roomName = input(f, 'NOMBRE DE SALA (OPCIONAL)', { maxLength: 24, placeholder: 'Travesía 1v1' });
            else code = input(f, 'CÓDIGO DE SALA', { maxLength: 9, placeholder: 'PW-A7C9D2' });
            const password = input(f, 'CONTRASEÑA · 4 A 64 CARACTERES', { type: 'password', autocomplete: mode === 'create' ? 'new-password' : 'current-password' });
            password.minLength = 4; password.required = true; if (code) code.required = true;
            submit(f, mode === 'create' ? 'CREAR SALA' : 'UNIRSE');
        };
        action(choices, 'CREAR SALA', () => show('create'), true); action(choices, 'UNIRSE A SALA', () => show('join')); back(this, ui.card);
        network.on(this, 'room', ({ room }) => { if (room) this.scene.start('LobbyScene'); });
        network.on(this, 'error', ({ message }) => ui.message(message, true)); network.on(this, 'offline', ({ message }) => ui.message(message, true));
    }
}
