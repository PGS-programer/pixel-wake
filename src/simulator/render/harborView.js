import * as THREE from 'three';
import {box,cylinder,tube,textPanel} from './primitives.js';
import {softBox} from './yachtGeometry.js';
import {mediterraneanMaterials} from './materials.js';
import {createMooredBoat} from './mooredBoats.js';
import {batchStatic} from './batching.js';
import {PORT} from '../world/harbor.js';

function tile(mesh,scale=2){
    const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=mesh.geometry.attributes.uv;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(Math.abs(n.getY(i))>.5)uv.setXY(i,x/scale,z/scale);else if(Math.abs(n.getX(i))>.5)uv.setXY(i,z/scale,y/scale);else uv.setXY(i,x/scale,y/scale);}return mesh;
}
function palm(parent,x,z,m){
    tube(parent,[[x,1.1,z],[x+.12,3.2,z+.1],[x+.48,6.8,z+.2]],.12,m.wood);
    for(let k=0;k<8;k++){
        const a=k*Math.PI/4,positions=[],uv=[],indices=[];
        for(let j=0;j<=8;j++){const t=j/8,r=t*3.2,w=Math.sin(t*Math.PI)*.37,y=6.9+Math.sin(t*Math.PI)*.7-t*1.1;
            for(const side of [-1,1]){positions.push(x+.48+Math.cos(a)*r+Math.sin(a)*w*side,y,z+.2+Math.sin(a)*r-Math.cos(a)*w*side);uv.push((side+1)/2,t);}
            if(j<8){const b=j*2;indices.push(b,b+1,b+2,b+1,b+3,b+2);}}
        const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const leaf=new THREE.Mesh(g,m.palm);leaf.castShadow=true;parent.add(leaf);
    }
}
function coast(scene,m){
    const g=new THREE.PlaneGeometry(190,230,40,44);g.rotateX(-Math.PI/2);const p=g.attributes.position,colors=[];
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),shore=Math.max(0,(-x+72)/110),ridge=(Math.sin(x*.045+z*.018)*.5+.5)*Math.cos(z*.016)**2;const h=Math.max(-.6,shore*shore*(9+ridge*19)+Math.sin(x*.22+z*.17)*.38);p.setY(i,h);const c=new THREE.Color(h<1.3?'#b5ac91':h<4?'#87937a':'#6f836e');c.multiplyScalar(.96+Math.sin(x*.13+z*.11)*.035);colors.push(c.r,c.g,c.b);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();const terrain=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.position.set(-155,0,-42);terrain.receiveShadow=true;scene.add(terrain);
}
export function createHarborView(scene,harbor,low=false){
    const m=mediterraneanMaterials(),land=new THREE.Group();scene.add(land);coast(scene,m);
    for(const b of harbor.boxes){
        if(b.kind==='boat'||b.kind==='shore')continue;
        if(b.kind==='red'||b.kind==='green'){
            const color=b.kind==='red'?m.red:m.buoyGreen;cylinder(land,b.x,.12,-b.y,.95,.65,color,12);cylinder(land,b.x,1.1,-b.y,.2,1.6,color,10);
            const top=new THREE.Mesh(b.kind==='green'?new THREE.ConeGeometry(.46,.65,12):new THREE.CylinderGeometry(.4,.4,.55,12),color);top.position.set(b.x,2.13,-b.y);land.add(top);continue;
        }
        if(b.kind==='fender'){
            cylinder(land,b.x,.48,-b.y,.33,1.3,m.rubber,12);
            for(const offset of [-.28,.28])tube(land,[[b.x+Math.sign(b.x)*.65,1.22,-b.y+offset],[b.x,.95,-b.y+offset]],.024,m.rope);continue;
        }
        const floating=['pier','finger'].includes(b.kind);
        tile(box(land,b.x,floating?.3:-.15,-b.y,b.w,floating?1:2.25,b.h,b.kind==='breakwater'?m.stone:floating?m.iron:m.concrete));
        tile(box(land,b.x,1.02,-b.y,b.w,.16,b.h,floating?m.wood:m.paving));
        if(floating){
            for(const side of [-1,1])box(land,b.x+side*(b.w/2-.1),.99,-b.y,.1,.32,b.h,m.cream);
            if(b.kind==='finger')for(const y of [b.y-b.h/2+1,b.y+b.h/2-1]){cylinder(land,b.x,1.25,-y,.09,.2,m.metal,10);box(land,b.x,1.38,-y,.35,.07,.12,m.metal);}
            else {const ramp=tile(box(land,-48.1,1.2,-64,4,.2,2.1,m.metal));ramp.rotation.z=.035;for(const z of [-65,-63])tube(land,[[-50,1.95,z],[-46,1.95,z]],.03,m.metal);}
        }
        if(b.kind==='quay'){
            if(b.w<b.h){const inside=b.x-Math.sign(b.x)*b.w/2;box(land,inside,1.11,-b.y,.48,.16,b.h,m.cream);for(let y=-24;y<82;y+=5)box(land,inside+Math.sign(b.x)*.65,1.115,-y,.09,.025,1.5,m.gold);}
            else box(land,b.x,1.12,-(b.y-b.h/2),b.w,.16,.48,m.cream);
        }
    }
    const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),m.rock,low?50:78);rocks.castShadow=!low;rocks.receiveShadow=true;const transform=new THREE.Object3D();
    for(let i=0;i<rocks.count;i++){const side=i%2?1:-1,k=Math.floor(i/2);transform.position.set(side*(25.8+(k%18)*1.8),-.18+(k%4)*.14,-PORT.gateY+(k%3-1)*2.6);transform.scale.set(1+(k%3)*.15,.6+(k%3)*.15,.7+(k%4)*.12);transform.rotation.set(k*.23,k*.73,k*.33);transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix);}land.add(rocks);
    for(const side of [-1,1]){
        tile(box(land,side*42,1.14,-PORT.gateY,31,.15,2.4,m.concrete));
        for(let k=0;k<8;k++)cylinder(land,side*(27+k*4),1.75,-PORT.gateY+3.3,.035,1.2,m.metal,6);
        tube(land,[[side*26,2.3,-PORT.gateY+3.3],[side*57,2.3,-PORT.gateY+3.3]],.035,m.metal);
        const color=side<0?m.red:m.buoyGreen;cylinder(land,side*26.5,2.0,-PORT.gateY,.7,2,m.white,16);cylinder(land,side*26.5,2.9,-PORT.gateY,.73,.4,color,16);cylinder(land,side*26.5,3.45,-PORT.gateY,.38,.7,color,12);
        const roof=new THREE.Mesh(new THREE.ConeGeometry(.58,.38,12),m.iron);roof.position.set(side*26.5,4,-PORT.gateY);land.add(roof);
    }
    for(const p of harbor.bollards){cylinder(land,p.x,1.28,-p.y,.12,.36,m.iron,10);box(land,p.x,1.47,-p.y,.42,.1,.18,m.iron);}
    // Real berth infrastructure, placed on land rather than in the manoeuvring corridor.
    for(const side of [-1,1])for(const y of [-12,25,65]){
        const x=side*(PORT.quayX+2.5);softBox(land,x,1.72,-y,.48,1.2,.38,m.white,.06);box(land,x-side*.25,1.82,-y,.02,.35,.22,m.blue);box(land,x,2.38,-y,.52,.08,.42,m.metal);
        const hose=new THREE.Mesh(new THREE.TorusGeometry(.26,.025,6,20),m.navy);hose.position.set(x+side*.28,1.5,-y);hose.rotation.y=Math.PI/2;land.add(hose);
        if(y!==25){const sign=textPanel(land,`${side>0?'E':'W'} / ${y<0?'01':'03'}`,x,1.16,-y,1.4,.45,'#e4d1a1','#24444a');sign.rotation.x=-Math.PI/2;}
        cylinder(land,side*(PORT.quayX+5.8),2.2,-y,.045,2.2,m.iron,8);const ring=new THREE.Mesh(new THREE.TorusGeometry(.31,.065,8,20),m.red);ring.position.set(side*(PORT.quayX+5.8),2.8,-y);land.add(ring);
    }
    for(const side of [-1,1])for(const y of [-15,61]){
        const x=side*(PORT.quayX-.12);for(const offset of [-.35,.35])tube(land,[[x+side*.5,1.1,-y+offset],[x,1.8,-y+offset],[x-side*.16,-.8,-y+offset]],.03,m.metal);
        for(let h=-.55;h<1.3;h+=.3)tube(land,[[x-side*.12,h,-y-.35],[x-side*.12,h,-y+.35]],.025,m.metal);
    }
    tile(box(land,0,.44,-(PORT.northY+28),130,1.1,44,m.paving));
    // A connected shoreline behind the east quay gives the marina real land context.
    tile(box(land,80,.4,-45,48,1.2,158,m.paving));
    tile(box(land,80,1.035,-45,13,.03,148,m.concrete),3);
    for(const y of [-9,16,45,72,103]){
        softBox(land,60,1.4,-y,2.4,.6,2.4,m.cream,.2);palm(land,60,-y,m);
        softBox(land,66,1.42,-y,2.4,.14,.6,m.wood,.1);for(const dx of [-.8,.8])box(land,66+dx,1.16,-y,.09,.5,.5,m.iron);
        cylinder(land,67.5,3.2,-y,.06,4.2,m.iron,8);box(land,67.5,5.32,-y,.65,.06,1.1,m.white);
    }
    softBox(land,94,3.0,-52,14,3.8,22,m.plaster,.6);softBox(land,94,5.05,-52,15,.25,23,m.cream,.5);
    box(land,86.96,3.0,-52,.06,2.5,18,m.glass);
    for(const z of [-60,-56,-52,-48,-44])box(land,86.8,3.1,z,.15,3.6,.15,m.wood);
    // Yacht club, harbour office and a low waterfront lounge with glazing and timber screens.
    for(const [x,w,d,h,z]of [[0,20,12,5.4,-106],[-28,23,13,4.4,-106],[29,23,12,4.2,-108]]){
        softBox(land,x,1.1+h/2,z,w,h,d,m.plaster,.45);box(land,x,3.0,z+d/2+.03,w-1,3.1,.07,m.glass);
        tile(softBox(land,x,1.35,z+d/2+2,w+1,.22,4.5,m.wood,.12));
        softBox(land,x,1.1+h+.13,z+.3,w+1.5,.26,d+1.5,m.cream,.35);
        const awning=box(land,x,4.8,z+d/2+1.4,w+1,.12,3,m.canopy);awning.rotation.x=.04;
        for(let dx=-w/2+1.3;dx<w/2;dx+=3.5){cylinder(land,x+dx,3.0,z+d/2+.24,.045,3.7,m.metal,8);if(x!==0)tile(box(land,x+dx,3.2,z+d/2+.17,.15,3.8,.2,m.wood));}
    }
    textPanel(land,'M A R I N A   D E   L A   E S T E L A',0,5.9,-99.7,13,.6,'#c7b383','#24444b');
    textPanel(land,'Y A C H T   C L U B',-28,4.1,-96.1,6,.45,'#f0e4c8','#24444b');
    for(const x of [-39,-20,20,40]){
        const z=-94;softBox(land,x,1.45,z,3.2,.7,1.1,m.cream,.2);softBox(land,x,1.83,z,3,.08,.9,m.green,.18);palm(land,x,z,m);
        cylinder(land,x+3.8,3.4,z+5,.055,4.5,m.iron,8);box(land,x+3.8,5.68,z+4.5,.65,.06,1.05,m.white);
    }
    for(const [x,z]of [[-32,-93],[-25,-93],[26,-94],[33,-94]]){
        cylinder(land,x,1.65,z,.08,.9,m.metal,8);cylinder(land,x,2.12,z,.7,.1,m.wood,20);
        for(const side of [-1,1]){softBox(land,x+side*1.2,1.63,z,.62,.12,.6,m.canopy,.12);box(land,x+side*1.2,1.3,z,.08,.6,.08,m.metal);}
        if(!low){cylinder(land,x,2.7,z,.025,3.1,m.metal,8);const parasol=new THREE.Mesh(new THREE.ConeGeometry(1.8,.55,8,1,true),m.canopy);parasol.position.set(x,4.0,z);land.add(parasol);}
    }
    // Shared material batches keep the detailed marina inexpensive to render.
    const vessels=harbor.boats.map(boat=>createMooredBoat(scene,boat,m));batchStatic(land,new Set([rocks]));
    return {materials:m,vessels,update(time){vessels.forEach((v,i)=>v.update(time,i));}};
}
