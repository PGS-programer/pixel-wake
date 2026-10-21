import * as THREE from 'three';
// One draw call for all sagging ropes of a vessel. Fixed shore ends, live boat ends.
export class RopeBundle {
    constructor(parent, count, material, radius = .028) {
        this.count = count; this.segments = 10; this.sides = 4; this.positions = new Float32Array(count * 11 * 5 * 3);
        const indices = [];
        for (let line = 0; line < count; line++) for (let k = 0; k < 10; k++) for (let j = 0; j < 4; j++) {
            const a = line * 55 + k * 5 + j, b = a + 5; indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
        this.geometry = new THREE.BufferGeometry(); this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage)); this.geometry.setIndex(indices);
        this.mesh = new THREE.Mesh(this.geometry, material); this.mesh.frustumCulled = false; parent.add(this.mesh); this.radius = radius;
    }
    update(lines) {
        const direction = new THREE.Vector3(), normal = new THREE.Vector3(), side = new THREE.Vector3();
        for (let n = 0; n < this.count; n++) {
            const line = lines[n], a = line?.a || new THREE.Vector3(), b = line?.b || a;
            direction.subVectors(b, a).normalize(); normal.crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize(); side.crossVectors(direction, normal).normalize();
            const sag = line ? Math.min(.35, a.distanceTo(b) * .018) : 0, radius = line ? this.radius : 0;
            for (let k = 0; k <= 10; k++) { const t = k / 10, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * sag, z = a.z + (b.z - a.z) * t;
                for (let j = 0; j <= 4; j++) { const theta = j / 4 * Math.PI * 2, ix = (n * 55 + k * 5 + j) * 3, c = Math.cos(theta) * radius, s = Math.sin(theta) * radius; this.positions[ix] = x + normal.x * c + side.x * s; this.positions[ix + 1] = y + normal.y * c + side.y * s; this.positions[ix + 2] = z + normal.z * c + side.z * s; }
            }
        }
        this.geometry.attributes.position.needsUpdate = true; this.geometry.computeVertexNormals();
    }
}
