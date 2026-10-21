import * as THREE from 'three';
export const material = (color, roughness = .7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
export function box(parent, x, y, z, w, h, d, mat) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}
export function cylinder(parent, x, y, z, radius, height, mat, segments = 16) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}
export function tube(parent, points, radius, mat) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(4, points.length * 3), radius, 6, false), mat); parent.add(m); return m;
}
export function textPanel(parent, text, x, y, z, w, h, color = '#d6e3d7', bg = '#12313b') {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const c = canvas.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, 512, 128); c.fillStyle = color; c.font = '500 38px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 64);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture })); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}
