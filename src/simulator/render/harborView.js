import * as THREE from 'three';
import { box, cylinder, tube, textPanel } from './primitives.js';
import { mediterraneanMaterials } from './materials.js';
import { createMooredBoat } from './mooredBoats.js';
import { batchStatic } from './batching.js';
export function createHarborView(scene, harbor, low=false) {
    const m=mediterraneanMaterials(),land=new THREE.Group();scene.add(land);
    for(const b of harbor.boxes) {
        if(b.kind==='boat')continue;
        if(b.kind==='red'||b.kind==='green'){
            const color=b.kind==='red'?m.red:m.buoyGreen;
            cylinder(land,b.x,.12,-b.y,.95,.65,color,12);cylinder(land,b.x,1.1,-b.y,.2,1.6,color,10);
            const top=new THREE.Mesh(b.kind==='green'?new THREE.ConeGeometry(.46,.65,12):new THREE.CylinderGeometry(.4,.4,.55,12),color);top.position.set(b.x,2.13,-b.y);land.add(top);
            continue;
        }
        if(b.kind==='fender'){box(land,b.x,.48,-b.y,b.w,1.15,b.h,m.rubber);for(const offset of [-.35,.35])tube(land,[[b.x,1.22,-b.y+offset],[b.x-Math.sign(b.x)*.25,.9,-b.y+offset]],.025,m.metal);continue;}
        box(land,b.x,-.15,-b.y,b.w,2.25,b.h,b.kind==='breakwater'?m.stone:m.concrete);
        const top=box(land,b.x,1.02,-b.y,b.w,.16,b.h,b.kind==='pier'?m.wood:m.paving);
        if(b.kind==='quay'){
            if(b.w<b.h){const inside=b.x-Math.sign(b.x)*b.w/2;box(land,inside,1.11,-b.y,.6,.17,b.h,m.cream);for(let y=-38;y<96;y+=5)box(land,inside+Math.sign(b.x)*.7,1.115,-y,.12,.025,1.8,m.gold);}
            else box(land,b.x,1.12,-(b.y-b.h/2),b.w,.16,.55,m.cream);
        }
        if(b.kind==='pier'){
            for(let x=b.x-b.w/2+1;x<b.x+b.w/2;x+=3)for(const side of [-1,1])cylinder(land,x,-.7,-b.y+side*(b.h/2-.3),.16,3.3,m.iron,8);
            const ramp=box(land,-60,1.23,-68,5,.2,2.2,m.metal);ramp.rotation.z=.035;
            for(const z of [-69,-67])tube(land,[[-62,2.0,z],[-57,2.0,z]],.035,m.metal);
        }
    }
    // Rubble stones lie entirely in the breakwater's conservative collision envelope.
    const rockGeometry=new THREE.IcosahedronGeometry(1,0),rockCount=low?66:106;
    const rocks=new THREE.InstancedMesh(rockGeometry,m.rock,rockCount);rocks.castShadow=!low;rocks.receiveShadow=true;const transform=new THREE.Object3D();
    for(let i=0;i<rockCount;i++){const side=i%2?1:-1,k=Math.floor(i/2),x=side*(31.2+(k%22)*1.75),z=48+(k%3-1)*3.2;transform.position.set(x,-.15+(k%5)*.11,z);transform.scale.set(1.0+(k%4)*.17,.65+(k%3)*.16,.7+(k%4)*.17);transform.rotation.set(k*.27,k*.71,k*.37);transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix);}land.add(rocks);
    for(const side of [-1,1]) {
        box(land,side*50,1.14,48,35,.15,3.2,m.concrete);
        for(let k=0;k<9;k++){const x=side*(34+k*3.8);cylinder(land,x,1.75,51,.035,1.2,m.metal,6);}
        tube(land,[[side*33,2.3,51],[side*69,2.3,51]],.035,m.metal);
        const color=side===-1?m.red:m.buoyGreen;
        cylinder(land,side*32.5,2.2,48,.76,2.25,m.white,16);cylinder(land,side*32.5,3.1,48,.79,.45,color,16);cylinder(land,side*32.5,3.7,48,.42,.75,color,12);
        const roof=new THREE.Mesh(new THREE.ConeGeometry(.66,.42,12),m.iron);roof.position.set(side*32.5,4.3,48);land.add(roof);
        box(land,side*32.5,3.65,47.57,.25,.32,.04,m.glass);
    }
    for(const p of harbor.bollards){cylinder(land,p.x,1.28,-p.y,.12,.36,m.iron,10);box(land,p.x,1.47,-p.y,.4,.1,.2,m.iron);}
    // Quayside ladders and life rings stay clear of the assigned berths.
    for(const side of [-1,1])for(const y of [-24,61,88]){
        const x=side*61.85;
        for(const offset of [-.38,.38])tube(land,[[x+side*.5,1.1,-y+offset],[x,1.9,-y+offset],[x-side*.18,-.8,-y+offset]],.035,m.metal);
        for(let h=-.55;h<1.3;h+=.3)tube(land,[[x-side*.13,h,-y-.38],[x-side*.13,h,-y+.38]],.03,m.metal);
        cylinder(land,side*66,2.1,-y,.045,2,m.iron,8);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.32,.075,8,18),m.red);ring.position.set(side*66,2.8,-y);land.add(ring);
    }
    // Compact promenade, warm stucco, tiled roofs and blue shutters.
    box(land,0,.45,-124,152,1.1,26,m.paving);
    for(const [x,z,w,d,h]of [[-42,-119,17,12,5.2],[-18,-123,15,10,4.4],[10,-121,16,13,5.5],[37,-123,20,12,4.8]]){
        box(land,x,1.1+h/2,z,w,h,d,m.plaster);box(land,x,1.3,z+d/2+.1,w,.28,.35,m.concrete);
        // Two sloped roof planes, not flat blocks.
        for(const side of [-1,1]){const roof=box(land,x,1.1+h+.9,z+side*d/4,w+1,.16,d*.57,m.terracotta);roof.rotation.x=side*.28;}
        for(let dx=-w/2+2;dx<w/2-1;dx+=3.7){box(land,x+dx,3.2,z+d/2+.04,1.15,1.6,.09,m.blue);box(land,x+dx,2.3,z+d/2+.15,1.35,.09,.25,m.cream);}
        box(land,x,2.1,z+d/2+.10,1.35,2.2,.12,m.wood);
        const awning=box(land,x,3.55,z+d/2+1.1,w*.72,.07,2.1,m.canopy);awning.rotation.x=.13;
    }
    textPanel(land,'LLOTJA / PORT DE LA ESTELA',-42,5.0,-112.9,9,.7,'#35574f','#e4ddc2');
    for(const x of [-57,-32,-5,23,52]){
        cylinder(land,x,3.8,-103,.07,5.4,m.iron,8);tube(land,[[x,6.5,-103],[x,6.7,-101.5]],.07,m.iron);
        const lamp=new THREE.Mesh(new THREE.SphereGeometry(.24,10,6),new THREE.MeshStandardMaterial({color:'#ead4a2',emissive:'#cba96a',emissiveIntensity:.25}));lamp.position.set(x,6.55,-101.5);land.add(lamp);
        box(land,x+1.8,1.4,-104,2.4,.12,.65,m.wood);for(const offset of [-.85,.85])box(land,x+1.8+offset,1.1,-104,.1,.65,.5,m.iron);
    }
    // Distant rounded headland and a few Mediterranean pines frame the inlet.
    for(let i=0;i<10;i++){
        const hill=new THREE.Mesh(new THREE.SphereGeometry(1,14,7),i%2?m.vegetation:m.green);hill.position.set(-105-i*12,3,-120-i*9);hill.scale.set(23+i%3*7,12+i%4*3,30);land.add(hill);
    }
    for(const [x,y]of [[-80,91],[-84,113],[-68,117],[65,122],[78,110]]){cylinder(land,x,3.1,-y,.2,4.2,m.wood,8);const canopy=new THREE.Mesh(new THREE.SphereGeometry(1,12,7),m.pine);canopy.position.set(x,5.4,-y);canopy.scale.set(3.5,1.4,3);land.add(canopy);}
    const vessels=harbor.boats.map(boat=>createMooredBoat(scene,boat,m));
    batchStatic(land,new Set([rocks]));
    return {materials:m,vessels,update(time){vessels.forEach((v,i)=>v.update(time,i));}};
}
