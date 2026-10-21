import * as THREE from 'three';
// Small, original, deterministic textures; no network or image licensing dependency.
export function mediterraneanMaterials() {
    const textures = [];
    const surface = (base, kind, roughness = .8, metalness = 0) => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
        const c = canvas.getContext('2d'); c.fillStyle = base; c.fillRect(0, 0, 128, 128);
        let seed = 1297; const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
        for (let i = 0; i < 1800; i++) {
            c.fillStyle = random() > .5 ? `rgba(255,250,227,${random() * .12})` : `rgba(35,45,38,${random() * .13})`;
            const x = random() * 128, y = random() * 128;
            c.fillRect(x, y, kind === 'wood' ? 1 : 1 + random() * 2, kind === 'wood' ? 12 + random() * 32 : 1 + random() * 2);
        }
        if (kind === 'paving') { c.strokeStyle = '#4d514929'; c.lineWidth = 1; for (let y = 0; y <= 128; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); for (let x = (y % 64 ? 16 : 0); x < 128; x += 32) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 32); c.stroke(); } } }
        const map = new THREE.CanvasTexture(canvas); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; textures.push(map);
        return new THREE.MeshStandardMaterial({ color: '#ffffff', map, roughness, metalness });
    };
    const solid = (color, roughness = .7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    return {
        concrete: surface('#b8afa0', 'concrete'), paving: surface('#c8bea7', 'paving'), wood: surface('#9b8060', 'wood'),
        stone: surface('#8b9085', 'stone'), rock: surface('#9a9985', 'stone'), plaster: surface('#e2d9bb', 'plaster'),
        terracotta: surface('#b67850', 'tile'), white: solid('#e9e6d6', .42), cream: solid('#d4c7ab'),
        iron: solid('#354448', .57, .5), metal: solid('#9caaa5', .35, .65), rubber: surface('#29332f', 'rubber'),
        rope: solid('#b6a079', .95), navy: solid('#214855', .36), blue: solid('#467887', .38), green: solid('#6f8971'),
        glass: solid('#23424b', .14, .25), red: solid('#b95e48'), buoyGreen: solid('#468972'), gold: solid('#d9bd79'),
        canopy: solid('#e5d7b2'), vegetation: solid('#657d65'), pine: solid('#4f705e'), textures,
    };
}
