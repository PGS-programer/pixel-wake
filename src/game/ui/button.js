export function createButton(scene, x, y, label, onClick, width = 300) {
    const bg = scene.add.rectangle(x, y, width, 54, 0x071923, 0.90)
        .setStrokeStyle(2, 0x6de3ff, 0.9)
        .setInteractive({ useHandCursor: true })
        .setDepth(100);

    const text = scene.add.text(x, y, label, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff'
    }).setOrigin(0.5).setDepth(101);

    const activate = () => onClick();
    bg.on('pointerdown', activate);
    text.setInteractive({ useHandCursor: true }).on('pointerdown', activate);

    bg.on('pointerover', () => bg.setFillStyle(0x0c2b39, 0.96));
    bg.on('pointerout', () => bg.setFillStyle(0x071923, 0.90));

    return { bg, text };
}
