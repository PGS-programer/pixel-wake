import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
// Bake static geometry per shared material; controls, instruments and animated groups stay independent.
export function batchStatic(root, exclude = new Set()) {
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert(), buckets = new Map();
    const collect = object => {
        if (exclude.has(object) || object.isInstancedMesh) return;
        if (object.isMesh && !Array.isArray(object.material) && object.geometry.attributes.normal && object.geometry.attributes.uv) {
            const key = `${object.material.uuid}/${object.castShadow}/${object.receiveShadow}/${!!object.geometry.index}`;
            if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(object);
        }
        for (const child of object.children) collect(child);
    };
    collect(root);
    for (const meshes of buckets.values()) {
        if (meshes.length < 2) continue;
        const parts = meshes.map(mesh => mesh.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, mesh.matrixWorld)));
        const geometry = mergeGeometries(parts, false); parts.forEach(part => part.dispose());
        if (!geometry) continue;
        const merged = new THREE.Mesh(geometry, meshes[0].material); merged.castShadow = meshes[0].castShadow; merged.receiveShadow = meshes[0].receiveShadow;
        for (const mesh of meshes) { mesh.removeFromParent(); mesh.geometry.dispose(); }
        root.add(merged);
    }
}
