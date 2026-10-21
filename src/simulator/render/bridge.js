import { PLAYER_CLEATS } from '../world/moorings.js';
import * as THREE from 'three';
import { box, cylinder, tube, textPanel, material } from './primitives.js';
export function createVessel(scene) {
    const root = new THREE.Group(); scene.add(root);
    const navy = material('#123949', .38, .2), cream = material('#e1e3d9', .56), charcoal = material('#1a272d', .6), trim = material('#69818a', .35, .65), teak = material('#84715a'), rubber = material('#18232a');
    const shape = new THREE.Shape(); shape.moveTo(-2.35, -8); shape.lineTo(-2.65, 3.6); shape.quadraticCurveTo(-2.5, 7.7, 0, 9.6); shape.quadraticCurveTo(2.5, 7.7, 2.65, 3.6); shape.lineTo(2.35, -8); shape.closePath();
    const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 2.1, bevelEnabled: true, bevelSize: .2, bevelThickness: .2, bevelSegments: 2, steps: 1 }); hullGeo.rotateX(-Math.PI / 2);
    const hull = new THREE.Mesh(hullGeo, navy); hull.position.y = -.9; hull.castShadow = true; root.add(hull);
    const deckGeo = new THREE.ShapeGeometry(shape); deckGeo.rotateX(-Math.PI / 2); const deck = new THREE.Mesh(deckGeo, cream); deck.position.y = 1.25; root.add(deck);
    box(root, 0, 1.65, 6.4, 3.9, .4, 2, teak);
    // Cabin floor and true 3D walls around the helmsman's eye position.
    box(root, 0, 2.1, -.1, 4.7, .18, 6.2, rubber);
    box(root, 0, 2.65, -3.25, 4.7, 1.0, .16, cream);
    box(root, 0, 5.7, -.1, 4.85, .18, 6.5, cream);
    const cabinLight = new THREE.PointLight('#f6deb1', 8, 8, 2); cabinLight.position.set(0, 5.3, .5); root.add(cabinLight);
    box(root, 0, 5.57, .5, 1.3, .025, .14, new THREE.MeshStandardMaterial({color:'#eedeb6',emissive:'#eedeb6',emissiveIntensity:.5}));
    for (const side of [-1, 1]) {
        box(root, side * 2.4, 2.8, -.1, .15, 1.45, 6.4, cream);
        for (const z of [-3.25, -.2, 3]) box(root, side * 2.4, 4.55, z, .12, 2.25, .13, trim);
        box(root, side * 2.4, 3.65, -.1, .16, .15, 6.5, trim);
        box(root, side * 2.4, 5.6, -.1, .16, .12, 6.5, trim);
        const glass = new THREE.MeshPhysicalMaterial({ color:'#a8d6da', transparent:true, opacity:.035, roughness:.05, depthWrite:false, side:THREE.DoubleSide });
        box(root, side * 2.4, 4.6, -.1, .02, 1.8, 6.1, glass).castShadow = false;
    }
    for (const x of [-2.38, -.8, .8, 2.38]) {
        box(root, x, 4.57, -3.23, .10, 2.15, .13, trim);
        // Window wipers: narrow black articulated arms.
        if (Math.abs(x) < 1) tube(root, [[x,3.65,-3.14],[x+.25,4.55,-3.14],[x-.1,4.9,-3.14]], .018, rubber);
    }
    box(root, 0, 3.58, -3.23, 4.8, .14, .2, trim);
    box(root, 0, 4.55, 3.03, 4.8, 2.3, .15, cream);
    box(root, -.8, 4.5, 3.13, 1.0, 1.35, .05, navy);
    // Dashboard: pedestal, sloped upper deck, three live screens, engine levers.
    box(root, 0, 2.65, -1.75, 4.1, 1.0, 1.45, charcoal);
    const top = box(root, 0, 3.15, -1.75, 4.25, .14, 1.65, trim); top.rotation.x = .08;
    box(root, 0, 3.37, -2.17, 4.14, .48, .16, charcoal);
    const mounts = [];
    for (const x of [-1.42, 0, 1.42]) {
        const monitor = box(root, x, 3.65, -1.88, 1.24, .89, .14, rubber); monitor.rotation.x = -.12;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .72), new THREE.MeshBasicMaterial({ color: 0xffffff })); screen.position.set(x, 3.65, -1.79); screen.rotation.x = -.12; root.add(screen); mounts.push(screen);
        for (let i = 0; i < 4; i++) cylinder(root, x - .35 + i * .23, 3.18, -1.06, .035, .04, rubber);
    }
    // Actual helm with rim and spokes. Positive rudder is clockwise from the helm.
    const wheel = new THREE.Group(); wheel.position.set(-.25, 3.07, -.6); wheel.rotation.x = -.23; root.add(wheel);
    cylinder(root, -.25, 2.7, -.82, .1, .7, charcoal);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.36, .035, 10, 48), rubber); rim.userData.control = 'rudder'; wheel.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .1, 20), trim); hub.rotation.x = Math.PI/2; wheel.add(hub);
    for (let i = 0; i < 5; i++) { const ang = i * Math.PI * 2 / 5; tube(wheel, [[0,0,0],[Math.sin(ang)*.34,Math.cos(ang)*.34,0]], .018, trim); }
    const levers = [];
    box(root, 1.35, 2.94, -.48, .82, .33, .75, charcoal);
    for (const [i, x] of [1.13, 1.57].entries()) {
        box(root, x, 3.13, -.48, .07, .02, .62, rubber);
        const pivot = new THREE.Group(); pivot.position.set(x, 3.14, -.48); root.add(pivot);
        cylinder(pivot, 0, .21, 0, .025, .42, trim);
        const handle = box(pivot, 0, .44, 0, .21, .10, .16, material(i ? '#87ae9e' : '#c87d6d', .4));
        handle.userData.control = i ? 'starboard' : 'port'; levers.push(pivot);
        textPanel(root, i ? 'STBD' : 'PORT', x, 2.95, -.06, .29, .09);
    }
    textPanel(root, 'PW–20 / DOBLE HÉLICE', -1.15, 2.89, -.99, 1.15, .13);
    textPanel(root, 'PUENTE / NO CERTIFICADO', 0, 5.38, -3.13, 1.1, .11, '#44585a', '#d9ded2');
    // Foredeck furniture, safety rails, anchor windlass and real mooring attachment points.
    for (const side of [-1, 1]) {
        for (const f of [3.8, 5.8, 7.5]) cylinder(root, side * (f > 7 ? 1.4 : 2.25), 1.85, -f, .025, 1.15, trim, 8);
        tube(root, [[side*2.25,2.4,-3.8],[side*2.25,2.4,-5.8],[side*1.4,2.4,-7.5],[0,2.4,-8.6]], .026, trim);
        for (const cleat of PLAYER_CLEATS) { cylinder(root, side * cleat.across, 1.45, -cleat.forward, .1, .28, trim); box(root,side*cleat.across,1.6,-cleat.forward,.35,.07,.12,trim); }
    }
    box(root, 0, 1.45, -6.6, .65, .4, .6, navy); cylinder(root,0,1.7,-6.6,.18,.2,trim);
    box(root, 0, 1.5, -4.6, 1.5, .14, 1, material('#61797b'));
    cylinder(root,0,6.45,.7,.045,1.5,trim,8); box(root,0,6.9,.7,2.1,.12,.17,cream);
    const chair = box(root,-.3,2.8,1.5,.75,.18,.7,rubber); box(root,-.3,3.25,1.8,.75,.9,.15,rubber); cylinder(root,-.3,2.45,1.5,.08,.55,trim);
    return { root, wheel, levers, screens: mounts, chair };
}
