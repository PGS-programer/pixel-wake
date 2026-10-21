import { PLAYER_CLEATS } from '../world/moorings.js';
import { VESSEL } from '../physics/vessel.js';
import * as THREE from 'three';
import { box, cylinder, tube, textPanel } from './primitives.js';
import { yachtHullGeometry, yachtDeckGeometry, softBox } from './yachtGeometry.js';
import { yachtMaterials } from './materials.js';
export const HELM_EYE={height:5.65,z:1.4,wing:2.2,zoomZ:-.25};
export function createVessel(scene){
    const root=new THREE.Group();root.name='Aurea 24 / player yacht';scene.add(root);const m=yachtMaterials(),{length,beam}=VESSEL;
    const hull=new THREE.Mesh(yachtHullGeometry(length,beam),m.pearl);hull.name='24m sculpted hull';hull.castShadow=hull.receiveShadow=true;root.add(hull);
    const deck=new THREE.Mesh(yachtDeckGeometry(length,beam,.12),m.teak);deck.position.y=1.64;deck.receiveShadow=true;root.add(deck);
    for(const side of [-1,1]){
        tube(root,[[side*2.3,.42,11.2],[side*2.83,.38,8],[side*3.03,.42,2],[side*2.99,.48,-3],[side*2.58,.65,-7],[side*1.08,1.05,-11]],.045,m.graphite);
        for(const z of [-2,0,2,4])softBox(root,side*3.025,.92,z,.035,.31,1.15,m.glass,.11);
        softBox(root,side*2.48,2.4,.45,.09,1.38,10.1,m.glass,.03);
        tube(root,[[side*2.55,3.12,5.65],[side*2.6,3.38,2],[side*2.52,3.4,-3.4],[side*1.84,3.18,-5.25]],.075,m.pearl);
        for(const z of [-3.8,1.7,5])box(root,side*2.52,2.42,z,.08,1.35,.075,m.pearl);
        const rail=[[side*2.7,2.5,8.8],[side*2.95,2.5,4],[side*2.98,2.5,-1],[side*2.7,2.62,-6.5],[side*1.93,2.77,-9.3],[0,2.9,-11.9]];
        tube(root,rail,.024,m.chrome);for(const [x,y,z]of rail.slice(0,-1))cylinder(root,x,(y+1.65)/2,z,.019,y-1.65,m.chrome,8);
        for(const cleat of PLAYER_CLEATS){cylinder(root,side*cleat.across,1.75,-cleat.forward,.075,.18,m.chrome,10);box(root,side*cleat.across,1.86,-cleat.forward,.42,.07,.12,m.chrome);}
        for(let i=0;i<7;i++)softBox(root,side*2.17,1.81+i*.265,6.4-i*.39,.72,.15,.5,m.teak,.05);
        tube(root,[[side*2.62,2.65,6.7],[side*2.62,4.3,3.9]],.028,m.chrome);
    }
    softBox(root,0,1.85,.25,4.95,.4,11.8,m.pearl,.8);softBox(root,0,3.42,.1,5.5,.22,12.2,m.pearl,.9);
    softBox(root,0,1.9,-7.7,3.65,.2,3.3,m.teak,.65);for(const side of [-1,1])softBox(root,side*.78,2.1,-7.85,1.45,.26,2.7,m.linen,.2);
    softBox(root,0,1.86,-10.1,.9,.12,1.2,m.chrome,.12);cylinder(root,0,2.0,-10.2,.18,.18,m.chrome);
    softBox(root,0,1.0,11.1,4.4,.22,1.7,m.teak,.4);for(let i=0;i<3;i++)softBox(root,0,1.16+i*.17,10.3-i*.37,4.6,.16,.55,m.teak,.12);
    softBox(root,0,1.92,8.45,4.3,.25,1.45,m.linen,.35);softBox(root,0,2.31,9.0,4.4,.65,.25,m.linen,.1);
    softBox(root,0,2.23,6.85,1.7,.12,.95,m.teak,.3);cylinder(root,0,1.95,6.85,.06,.5,m.chrome);
    textPanel(root,'A U R E A',0,1.42,11.81,1.7,.22,'#d9cba7','#eeeade');
    // Upper terrace and wraparound wheelhouse; physical eye stays inside these windows.
    softBox(root,0,3.58,.15,5.05,.16,9.2,m.teak,.65);softBox(root,0,3.83,4.8,3.6,.26,2.2,m.linen,.35);softBox(root,0,4.22,5.8,3.75,.65,.22,m.linen,.1);
    softBox(root,0,6.98,-1.05,5.65,.21,8.5,m.pearl,.8);softBox(root,0,7.1,-1.05,5.1,.08,7.8,m.graphite,.7);
    softBox(root,0,3.85,-1.8,5.03,.5,6.1,m.pearl,.6);softBox(root,0,4.12,-1.4,4.6,.04,6.1,m.carpet,.4);
    for(const side of [-1,1]){
        const glass=box(root,side*2.49,5.49,-1.3,.025,2.54,6.4,m.clearGlass);glass.castShadow=false;
        for(const z of [-4.5,2])box(root,side*2.48,5.55,z,.075,2.72,.095,m.chrome);
        tube(root,[[side*2.5,4.32,2],[side*2.5,4.32,-4.5],[side*1.9,4.32,-5.05],[0,4.32,-5.13]],.045,m.graphite);
        softBox(root,side*2.15,4.45,1.6,.35,.6,1.4,m.linen,.12);
    }
    const windscreen=box(root,0,5.55,-4.82,4.84,2.55,.025,m.clearGlass);windscreen.rotation.x=-.12;windscreen.castShadow=false;
    for(const x of [-2.35,0,2.35]){const frame=box(root,x,5.55,-4.82,.045,2.6,.055,m.graphite);frame.rotation.x=-.12;}
    for(const x of [-1.35,1.35])tube(root,[[x,4.38,-4.62],[x+.12,5.05,-4.65],[x-.2,5.4,-4.65]],.012,m.graphite);
    softBox(root,0,4.31,-2.8,4.25,.57,1.45,m.graphite,.35);softBox(root,0,4.61,-2.72,4.38,.08,1.55,m.leather,.28);box(root,0,4.55,-1.94,4.05,.065,.04,m.brass);
    const screens=[];
    for(const [i,x]of [-1.4,0,1.4].entries()){
        const bezel=softBox(root,x,5.0,-2.96,1.29,.84,.1,m.graphite,.07);bezel.rotation.x=-.10;
        const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.19,.75),new THREE.MeshBasicMaterial({color:0xffffff}));screen.position.set(x,5.0,-2.898);screen.rotation.x=-.10;root.add(screen);screens.push(screen);
        cylinder(root,x,4.67,-2.16,.035,.018,m.chrome,12);if(i!==1)textPanel(root,i===0?'RADAR':'ENGINES',x,4.58,-1.91,.5,.07,'#a2b7bc','#192e35');
    }
    const wheel=new THREE.Group();wheel.position.set(-.4,4.48,-1.15);wheel.rotation.x=-.25;root.add(wheel);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.32,.029,10,48),m.leather);rim.userData.control='rudder';wheel.add(rim);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.10,16),m.chrome);hub.rotation.x=Math.PI/2;wheel.add(hub);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;tube(wheel,[[0,0,0],[Math.sin(a)*.3,Math.cos(a)*.3,0]],.018,m.chrome);}
    const levers=[];softBox(root,1.25,4.35,-.95,.82,.25,.8,m.leather,.15);
    for(const [i,x]of [1.04,1.46].entries()){
        box(root,x,4.49,-.95,.065,.018,.57,m.graphite);const pivot=new THREE.Group();pivot.position.set(x,4.48,-.95);root.add(pivot);cylinder(pivot,0,.18,0,.024,.36,m.chrome,12);
        const handle=softBox(pivot,0,.37,0,.17,.09,.15,i?m.starboard:m.port,.04);handle.userData.control=i?'starboard':'port';levers.push(pivot);
    }
    textPanel(root,'A U R E A  /  2 4',-1.4,4.31,-1.91,1.05,.12,'#d1b98b','#192e35');
    const chair=softBox(root,-.4,4.42,.8,.75,.16,.8,m.leather,.15);softBox(root,-.4,4.88,1.15,.76,.94,.15,m.leather,.06);cylinder(root,-.4,4.2,.8,.07,.4,m.chrome);
    for(const side of [-1,1]){const arch=softBox(root,side*1.9,7.3,1.4,.32,1.45,.65,m.pearl,.12);arch.rotation.z=side*-.18;}
    softBox(root,0,8.0,1.4,4.25,.18,.8,m.pearl,.3);softBox(root,0,8.2,1.4,2.4,.1,.2,m.pearl,.08);
    for(const x of [-1.4,1.4]){const dome=new THREE.Mesh(new THREE.SphereGeometry(.32,16,10),m.pearl);dome.scale.y=1.2;dome.position.set(x,8.3,1.4);root.add(dome);}
    cylinder(root,0,8.8,1.6,.025,1.5,m.chrome,8);
    const led=new THREE.MeshStandardMaterial({color:'#f3dbaf',emissive:'#f3dbaf',emissiveIntensity:.5});box(root,0,6.84,-1.1,2.2,.018,.035,led);
    return {root,wheel,levers,screens,chair};
}
