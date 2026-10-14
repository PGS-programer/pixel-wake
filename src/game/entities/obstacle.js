// Layered pixel silhouettes: the body stays aligned with the collision box;
// only non-collidable foam pulses, so animation never disguises a hitbox.
export function buildObstacle(scene, spec) {
    const foam = scene.add.graphics(), body = scene.add.graphics();
    const w = spec.hitboxHalfWidth, h = spec.hitboxHalfHeight;
    const rect = (color, x, y, width, height) => body.fillStyle(color).fillRect(x, y, width, height);
    foam.fillStyle(0xb8f4ef, 0.3).fillRect(-w - 7, -h + 7, w * 2 + 14, h * 2 - 7).fillRect(-w + 3, -h + 1, w * 2 - 6, h * 2 + 8);
    const rock = spec.type.toLowerCase().includes('rock');
    if (rock) {
        const shape = [[-w, h - 5], [-w, -h + 11], [-w + 6, -h + 11], [-w + 6, -h + 4], [-w + 15, -h + 4], [-w + 15, -h], [w - 9, -h], [w - 9, -h + 7], [w - 2, -h + 7], [w - 2, -h + 15], [w, -h + 15], [w, h - 4], [w - 8, h - 4], [w - 8, h], [-w + 6, h], [-w + 6, h - 5]];
        const silhouette = (color, dx, dy) => body.fillStyle(color).fillPoints(shape.map(([x, y]) => ({ x: x + dx, y: y + dy })), true);
        silhouette(0x173c44, 2, 4);
        silhouette(spec.variant % 2 ? 0x6b5946 : 0x485957, 0, 0);
        rect(spec.variant % 2 ? 0x9d8562 : 0x708477, -w + 7, -h + 8, w * 2 - 16, h * 2 - 13);
        rect(spec.variant % 2 ? 0xc7b28b : 0xa8b19a, -w + 15, -h + 3, Math.max(3, w - 15), 4);
        rect(0x33494b, -3 + spec.variant % 3 * 3, -h + 9, 5, h);
        rect(0x8c9b81, w - 10, 2, 7, 5);
        rect(0xaac4a4, -w + 2, h - 6, 9, 4);
    } else if (spec.type === 'buoy') {
        rect(0x183f46, -10, 10, 20, 8); rect(0xe05640, -8, -12, 16, 26);
        rect(0xffeacc, -8, -5, 16, 7); rect(0xff8d67, -5, -12, 4, 25);
        rect(0x203742, -2, -21, 4, 10); rect(0xffd166, -4, -23, 8, 4);
    } else if (spec.type === 'log') {
        rect(0x293e3d, -w - 2, -h + 4, w * 2 + 4, h * 2);
        rect(0x77563a, -w, -h, w * 2, h * 2); rect(0xb5905b, -w, -h, w * 2, 4);
        rect(0x4e3f30, -w + 8, -3, w * 2 - 16, 3); rect(0xd8ba80, -w, -h + 3, 6, h * 2 - 5);
        rect(0x527961, 7, -h, 16, 4); rect(0x77563a, 4, -h - 6, 5, 7);
    } else {
        const hullH = spec.type === 'sailboat' ? 11 : h;
        const colors = [0xe86c4e, 0xf4c46c, 0x63c4bd, 0xa9bbec];
        const accent = colors[spec.variant % colors.length];
        foam.fillStyle(0xd8ffff, 0.5).fillTriangle(w, -hullH + 2, w, hullH - 2, w + 40, 0);
        foam.fillStyle(0xeafff4, 0.7).fillRect(w + 15, -4, 20, 2).fillRect(w + 9, 5, 30, 2);
        body.fillStyle(0x173641).fillTriangle(-w - 3, 0, -w + 12, -hullH - 2, -w + 12, hullH + 2);
        rect(0x173641, -w + 10, -hullH - 2, w * 2 - 8, hullH * 2 + 4);
        body.fillStyle(0xf2e9ce).fillTriangle(-w, 0, -w + 13, -hullH, -w + 13, hullH);
        rect(0xf2e9ce, -w + 12, -hullH, w * 2 - 13, hullH * 2);
        rect(accent, -w + 14, hullH - 5, w * 2 - 17, 4);
        rect(0x194f66, -9, -hullH + 4, 18, 9); rect(0x9bd9d6, -7, -hullH + 4, 6, 3);
        rect(0x5b6660, w - 7, -5, 8, 10);
        if (spec.type === 'fishing') {
            rect(0xbcb68e, -4, -13, 22, 21); rect(0x265b69, 0, -10, 6, 6);
            rect(0x265b69, 9, -10, 6, 6); rect(0x526a5d, -25, -12, 12, 24);
            rect(0x273e40, 18, -h - 8, 3, 17); rect(0xd6c8a0, 5, -h - 8, 16, 3);
        } else if (spec.type === 'sailboat') {
            rect(0x385153, 0, -29, 3, 56);
            body.fillStyle(0xffefd2).fillTriangle(-1, -29, -25, 21, -1, 21);
            body.fillStyle(accent).fillTriangle(4, -27, 25, 17, 4, 17);
            rect(0xc9b58c, -18, 16, 15, 3);
        } else if (spec.type === 'jetski') {
            rect(accent, -w + 9, -h, 22, h * 2); rect(0x203945, -7, -5, 16, 10);
            rect(0xe7b78a, -10, -3, 6, 6); rect(0xfff1cc, -5, -5, 8, 9);
        } else { rect(accent, -w + 12, -h, 8, h * 2); }
    }
    const object = scene.add.container(spec.x, spec.y, [foam, body]).setDepth(scene.DEPTH_WORLD);
    Object.assign(object, spec, { nearMissChecked: false, nearMissCandidate: false, bestNearMissGap: Infinity, foam });
    if (spec.amplitude) {
        const warning = scene.add.graphics().setDepth(scene.DEPTH_WORLD + 1);
        warning.fillStyle(0xffd166, 0.8).fillTriangle(-5, 0, 5, -5, 5, 5);
        object.warning = warning;
        object.once('destroy', () => warning.destroy());
    }
    return object;
}
