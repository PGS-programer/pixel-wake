import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

// Deterministic decoration keeps visual noise independent from encounter seeds.
export function createOceanBackdrop(scene) {
    const g = scene.add.graphics().setDepth(0);
    g.fillStyle(0x167d88).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 18) {
        const t = y / GAME_HEIGHT;
        const color = (Math.round(18 + t * 20) << 16) | (Math.round(101 + t * 54) << 8) | Math.round(114 + t * 45);
        g.fillStyle(color).fillRect(0, y, GAME_WIDTH, 18);
    }
    for (let i = 0; i < 110; i++) {
        const x = (i * 137) % GAME_WIDTH, y = (i * 83) % GAME_HEIGHT;
        g.fillStyle(i % 3 === 0 ? 0x64d1c0 : 0x0a596b, 0.14).fillRect(x, y, 24 + i % 27, 2);
    }
    const waves = [];
    for (let row = 0; row < 13; row++) {
        const y = 22 + row * 42;
        for (let col = 0; col < 9; col++) {
            const width = 12 + ((row * 13 + col * 17) % 34);
            const object = scene.add.graphics().setPosition(col * 124 + (row % 2) * 48, y).setDepth(1);
            object.lineStyle(2, 0x9aead6, 0.15 + (row % 3) * 0.04);
            object.beginPath(); object.moveTo(0, 3); object.lineTo(width / 3, 3); object.lineTo(width / 3 + 4, 0); object.lineTo(width, 0); object.strokePath();
            const foreground = (row + col) % 4 === 0;
            if (foreground) {
                object.fillStyle(0x0b5a70, 0.18).fillRect(3, 7, width + 8, 3);
                object.fillStyle(0xd2fff1, 0.3).fillRect(2, 1, Math.max(5, width / 3), 2);
                object.fillStyle(0x94e6d2, 0.22).fillRect(width - 1, -3, 5, 2);
            }
            waves.push({ object, width: width + 8, speedFactor: foreground ? 1.15 : 0.32 + row * 0.045 });
        }
    }
    // Receding shoreline, above the navigable area.
    g.fillStyle(0x83c9ad).fillRect(0, 0, 960, 9);
    g.fillStyle(0xe8d4a2).fillRect(0, 0, 960, 5);
    for (let x = 0; x < 960; x += 38) g.fillStyle(0xbbf0d0, 0.45).fillRect(x, 10 + x % 4, 19, 3);
    return waves;
}

export function createIsland(scene, x, y, scale = 1) {
    const g = scene.add.graphics().setPosition(x, y).setScale(scale).setDepth(4);
    // Stepped coastline instead of a smooth vector ellipse.
    for (const [radius, height, offset, color, alpha] of [[120, 48, 12, 0x73d7bd, 0.2], [105, 38, 5, 0xa3e1c0, 1], [93, 32, 0, 0xe9d5a1, 1], [80, 27, -6, 0xffe5ac, 1], [60, 22, -13, 0x4d9870, 1]]) {
        for (let row = -height; row <= height; row += 7) {
            const half = Math.round(Math.sqrt(Math.max(0, 1 - (row / height) ** 2)) * radius / 7) * 7;
            const shift = Math.round(Math.sin(row / 12) * 2) * 7;
            g.fillStyle(color, alpha).fillRect(-half + shift, row + offset, half * 2, 7);
        }
    }
    for (let i = 0; i < 16; i++) g.fillStyle(0x79b978, 0.55).fillRect(-44 + i * 37 % 90, -20 + i * 13 % 25, 5, 3);
    for (const [px, py] of [[-30, -30], [24, -17]]) {
        g.fillStyle(0x805c3b).fillRect(px, py - 12, 6, 27).fillRect(px + 3, py - 32, 6, 21);
        g.fillStyle(0xb08c54).fillRect(px + 4, py - 30, 2, 30);
        g.fillStyle(0x164f45).fillRect(px - 20, py - 37, 50, 6).fillRect(px - 8, py - 46, 28, 6).fillRect(px - 29, py - 30, 19, 5).fillRect(px + 24, py - 29, 18, 5).fillRect(px - 35, py - 25, 12, 5).fillRect(px + 37, py - 24, 10, 5);
        g.fillStyle(0x4d9870).fillRect(px - 17, py - 40, 24, 4).fillRect(px + 10, py - 39, 19, 4);
    }
    // Tiny jetty and lighthouse make this a place to return to.
    g.fillStyle(0x79593f).fillRect(36, 19, 12, 38).fillRect(29, 50, 26, 7);
    for (let i = 0; i < 5; i++) g.fillStyle(0xbc9562).fillRect(36, 21 + i * 7, 12, 2);
    g.fillStyle(0xc4ae84).fillRect(53, -12, 22, 7);
    g.fillStyle(0xfff4d9).fillRect(58, -38, 12, 27);
    g.fillStyle(0xd36f52).fillRect(58, -27, 12, 6).fillRect(55, -44, 18, 5);
    g.fillStyle(0x092c37).fillRect(60, -41, 8, 4);
    g.fillStyle(0xffd166).fillRect(62, -41, 4, 3);
    g.fillStyle(0xfff4d9, 0.7).fillRect(-98, 32, 28, 2).fillRect(62, 38, 22, 2);
    return g;
}
