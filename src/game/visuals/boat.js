export function buildBoat(scene, type, x, y, scale = 1) {
    const wakeBack = scene.add.graphics();
    wakeBack.fillStyle(0xcdf7ff, 0.40);
    wakeBack.fillTriangle(-44, -12, -44, 12, -100, 0);

    const wakeFront = scene.add.graphics();
    wakeFront.fillStyle(0xeafcff, 0.65);
    wakeFront.fillTriangle(-34, -9, -34, 9, -76, 0);

    const g = scene.add.graphics();

    if (type === 'riptide') {
        g.fillStyle(0x092f46, 0.30);
        g.fillRect(-30, 11, 60, 5);

        g.fillStyle(0xf2f0e6);
        g.fillRect(-34, -9, 50, 18);
        g.fillTriangle(16, -9, 16, 9, 40, 0);

        g.fillStyle(0xd84c45);
        g.fillRect(-31, 4, 47, 4);

        g.fillStyle(0x173f65);
        g.fillRect(-8, -7, 18, 7);
        g.fillTriangle(10, -7, 10, 0, 20, 0);

        g.fillStyle(0xffffff);
        g.fillRect(-12, -12, 20, 4);
    } else if (type === 'marlin') {
        g.fillStyle(0x102f3d, 0.30);
        g.fillRect(-30, 12, 60, 5);

        g.fillStyle(0x3b6673);
        g.fillRect(-34, -11, 53, 22);
        g.fillTriangle(19, -11, 19, 11, 38, 0);

        g.fillStyle(0xf1dfb6);
        g.fillRect(-4, -17, 18, 14);

        g.fillStyle(0x1d4f68);
        g.fillRect(0, -14, 5, 5);
        g.fillRect(7, -14, 5, 5);

        g.fillStyle(0x4c3327);
        g.fillRect(6, -27, 3, 10);
        g.fillRect(-26, -17, 20, 2);
    } else if (type === 'aurora') {
        g.fillStyle(0x102d42, 0.28);
        g.fillRect(-31, 13, 63, 5);

        g.fillStyle(0xf8f2e5);
        g.fillRect(-31, -12, 48, 24);
        g.fillTriangle(17, -12, 17, 12, 42, 0);

        g.fillStyle(0x213e68);
        g.fillRect(-29, 7, 45, 4);

        g.fillStyle(0xe0a96d);
        g.fillRect(-27, 3, 38, 3);

        g.fillStyle(0xf9f5ec);
        g.fillRect(-15, -12, 24, 16);
        g.fillRect(-8, -20, 18, 8);

        g.fillStyle(0x3b83ba);
        g.fillRect(-11, -8, 7, 5);
        g.fillRect(-2, -8, 7, 5);
        g.fillRect(-4, -17, 10, 4);

        g.fillStyle(0x7a5535);
        g.fillRect(0, -28, 2, 8);
    } else {
        // COASTAL
        g.fillStyle(0x0c3550, 0.35);
        g.fillRect(-28, 12, 54, 6);

        g.fillStyle(0xf5ecd7);
        g.fillRect(-28, -12, 42, 24);
        g.fillTriangle(14, -12, 14, 12, 38, 0);

        g.fillStyle(0x203f73);
        g.fillRect(-27, 8, 39, 4);

        g.fillStyle(0xd07c3d);
        g.fillRect(-26, 5, 35, 3);

        g.fillStyle(0xf7f1e2);
        g.fillRect(-16, -10, 20, 20);

        g.fillStyle(0x3d86c9);
        g.fillRect(-11, -6, 7, 5);
        g.fillRect(-2, -6, 6, 5);

        g.fillStyle(0xf7f1e2);
        g.fillRect(-8, -15, 12, 5);

        g.fillStyle(0xeed9b9);
        g.fillRect(-4, -19, 7, 4);

        g.fillStyle(0x734d2c);
        g.fillRect(-1, -24, 2, 8);
    }

    // Small specular details bring the original silhouettes together.
    g.fillStyle(0xffffff, 0.65).fillRect(-25, -8, 9, 2);
    g.fillStyle(0x092c37, 0.25).fillRect(-23, 14, 44, 3);
    g.fillStyle(0xffd166).fillRect(25, -1, 4, 2);
    g.fillStyle(0xffffff, 0.45).fillRect(14, -5, 10, 1);
    g.fillStyle(0x092c37, 0.3).fillRect(-23, -5, 4, 9);
    g.fillStyle(0xe4aa66).fillRect(-27, -9, 3, 15);
    g.fillStyle(0xf3ae65).fillRect(-19, -2, 4, 4);
    g.fillStyle(0xfff4d9).fillRect(-18, -1, 2, 2);
    return scene.add.container(x, y, [wakeBack, wakeFront, g]).setScale(scale);
}
