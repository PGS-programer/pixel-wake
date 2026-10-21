import { decorativeMoorings } from '../world/moorings.js';
import * as THREE from 'three';
import { box, cylinder, tube } from './primitives.js';
import { batchStatic } from './batching.js';
import { bodyPoint } from '../physics/vessel.js';
import { RopeBundle } from './ropes.js';
function hullGeometry(length, beam) {
    const stations = [[-.5,.78],[-.35,.98],[0,1],[.27,.84],[.43,.4],[.5,.015]], vertices = [], uvs = [], indices = [];
    for (let i=0;i<stations.length;i++) {
        const [f,width] = stations[i], w=width*beam/2;
        const ring=[[w,1],[w*.85,.04],[w*.4,-.6],[0,-.76],[-w*.4,-.6],[-w*.85,.04],[-w,1],[0,1.04]];
        ring.forEach(([x,y],j)=>{vertices.push(x,y,-f*length);uvs.push(j/8,i/5);});
    }
    for(let i=0;i<5;i++)for(let j=0;j<8;j++){const a=i*8+j,b=i*8+(j+1)%8,c=a+8,d=b+8;indices.push(a,b,c,b,d,c);}
    for(const i of [0,5])for(let j=1;j<7;j++)indices.push(i*8,i*8+j,i*8+j+1);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function createMooredBoat(scene, boat, m) {
    const root=new THREE.Group();root.position.set(boat.x,0,-boat.y);root.rotation.y=-boat.heading;scene.add(root);
    const {length:l,beam:b}=boat, paint=new THREE.MeshStandardMaterial({color:boat.color,roughness:.4,metalness:.12});
    const hull=new THREE.Mesh(hullGeometry(l,b*.92),paint);hull.castShadow=hull.receiveShadow=true;root.add(hull);
    box(root,0,1.03,0,b*.75,.08,l*.68,m.wood);
    for(const side of [-1,1])tube(root,[[side*b*.36,1.18,l*.43],[side*b*.46,1.24,0],[side*b*.3,1.3,-l*.35],[0,1.35,-l*.48]],.035,m.white);
    if(boat.type==='sail') {
        box(root,0,1.32,-l*.03,b*.65,.56,l*.35,m.white);box(root,0,1.62,-l*.03,b*.54,.12,l*.3,m.glass);
        cylinder(root,0,l*.43+1,-l*.05,.045,l*.86,m.metal,10);
        tube(root,[[0,2.0,-l*.05],[0,2.0,l*.27]],.06,m.metal);
        tube(root,[[0,2.1,-l*.05],[0,2.1,l*.27]],.1,m.canopy);
        for(const side of [-1,1])tube(root,[[side*b*.43,1.1,0],[0,l*.85,-l*.05],[0,1.2,-l*.44]],.012,m.iron);
        box(root,0,1.2,l*.29,b*.63,.12,l*.18,m.navy);
    } else {
        const fishing=boat.type==='fishing',work=boat.type==='work';
        box(root,0,1.58,-l*.11,b*.67,1.1,l*(work?.37:.28),m.cream);
        box(root,0,2.18,-l*.11,b*.75,.14,l*.32,m.white);
        box(root,0,1.78,-l*.26,b*.53,.43,.035,m.glass);
        for(const side of [-1,1])box(root,side*b*.34,1.8,-l*.11,.035,.4,l*.18,m.glass);
        cylinder(root,0,2.6,-l*.12,.035,.9,m.metal,8);
        if(fishing){for(let i=-1;i<=1;i++)box(root,i*.48,1.2,l*.25,.4,.35,.65,m.green);tube(root,[[-b*.35,1.1,l*.34],[-b*.35,2.5,l*.34],[b*.35,2.5,l*.34],[b*.35,1.1,l*.34]],.05,m.metal);}
        else {box(root,0,1.3,l*.25,b*.6,.18,l*.17,m.canopy);if(!work){for(const side of [-1,1])cylinder(root,side*b*.33,1.7,l*.2,.025,1.3,m.metal,6);box(root,0,2.35,l*.2,b*.8,.06,l*.22,m.canopy);}}
    }
    const shoreSide=boat.shore.axis==='y'?-1:1;
    for(const f of [-.32,.05,.32]) {
        cylinder(root,shoreSide*b*.43,.65,-l*f,.12,.68,m.rubber,10);
        tube(root,[[shoreSide*b*.4,1.13,-l*f],[shoreSide*b*.43,.95,-l*f]],.012,m.rope);
    }
    const lines=decorativeMoorings(boat);
    for(const {forward,across,shore}of lines){
        cylinder(root,across,1.18,-forward,.06,.13,m.metal,8);
        cylinder(scene,shore.x,1.25,-shore.y,.11,.35,m.iron,10);box(scene,shore.x,1.43,-shore.y,.33,.08,.15,m.iron);
    }
    batchStatic(root);
    const rope=new RopeBundle(scene,lines.length,m.rope,.025);
    return {root,boat,rope,lines,update(time,index){const heave=Math.sin(time*.55+index*1.7)*.025;root.position.y=heave;root.rotation.z=Math.sin(time*.42+index)*.0018;rope.update(lines.map(line=>{const p=new THREE.Vector3(line.across,1.2,-line.forward);root.localToWorld(p);return{a:p,b:new THREE.Vector3(line.shore.x,1.45,-line.shore.y)};}));}};
}
