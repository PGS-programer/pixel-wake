import * as THREE from 'three';
import { box, cylinder, tube, textPanel, material } from './primitives.js';
export function createHarborView(scene, harbor) {
    const concrete=material('#a1a698',.94), stone=material('#6b7775',1), edge=material('#d7d3b9',.8), iron=material('#283940',.55,.35), gold=material('#b49d62'), red=material('#b44d40'), green=material('#2b906c');
    for(const b of harbor.boxes) {
        if(b.kind==='red'||b.kind==='green') {
            const m=b.kind==='red'?red:green; cylinder(scene,b.x,.15,-b.y,1.1,.7,m);
            cylinder(scene,b.x,1.3,-b.y,.32,2.0,m); const cone = new THREE.Mesh(b.kind==='green'?new THREE.ConeGeometry(.55,.7,16):new THREE.CylinderGeometry(.48,.48,.65,16),m); cone.position.set(b.x,2.4,-b.y); scene.add(cone);
            const glow=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),new THREE.MeshBasicMaterial({color:b.kind==='red'?'#ff7054':'#6be39b'}));glow.position.set(b.x,2.9,-b.y);scene.add(glow); continue;
        }
        if(b.kind==='fender') { box(scene,b.x,.6,-b.y,b.w,1.3,b.h,iron); continue; }
        if(b.kind==='boat') {
            box(scene,b.x,.4,-b.y,b.w*.9,1.4,b.h,material('#254652')); box(scene,b.x,1.5,-b.y,b.w*.7,.7,b.h*.55,edge); box(scene,b.x,2.2,-b.y,b.w*.6,.7,b.h*.3,material('#546f78')); continue;
        }
        box(scene,b.x,.25,-b.y,b.w,1.7,b.h,b.kind==='breakwater'?stone:concrete);
        if(b.kind==='quay') {
            const vertical=b.w<b.h;
            if(vertical) { box(scene,b.x-Math.sign(b.x)*b.w/2,1.14,-b.y,.5,.16,b.h,edge); for(let y=b.y-b.h/2+4;y<b.y+b.h/2;y+=8) box(scene,b.x-Math.sign(b.x)*(b.w/2-.7),1.15,-y,.4,.04,1.5,gold); }
        }
    }
    for(const p of harbor.bollards) { cylinder(scene,p.x,1.3,-p.y,.19,.55,iron); box(scene,p.x,1.55,-p.y,.6,.13,.25,iron); }
    for(let i=0;i<8;i++) {
        const x=-145+i*40, height=7+(i%3)*3;
        box(scene,x,height/2,-171,25,height,24,material(i%2?'#bfc4b5':'#89999b'));
        box(scene,x,height+.25,-171,26,.5,25,iron);
        for(let j=-2;j<=2;j++) {box(scene,x+j*4,height*.6,-158.9,2,1.8,.05,material('#42616c',.3,.2));box(scene,x+j*4,2,-158.9,2,2,.05,material('#627b7e'));}
    }
    // Port office and warehousing flank the basin, away from the navigable water.
    box(scene,110,4,-40,22,8,55,material('#b8b6a5'));box(scene,110,8.3,-40,24,.6,57,iron);
    for(let y=-20;y<100;y+=20) { cylinder(scene,92,5,-y,.1,9,iron,8); box(scene,89,9.4,-y,6,.2,.3,iron); }
    for(let i=0;i<12;i++) { const x=-115-i*18; const m=new THREE.Mesh(new THREE.ConeGeometry(35+(i%3)*9,45+(i%4)*8,7),material('#809995',1)); m.position.set(x,5,-290-(i%3)*20);scene.add(m); }
    const marker = new THREE.Group(); scene.add(marker); const side=harbor.mission.side;
    const outline=new THREE.EdgesGeometry(new THREE.BoxGeometry(5.5,.05,24));const wire=new THREE.LineSegments(outline,new THREE.LineBasicMaterial({color:'#e1c18b',transparent:true,opacity:.8}));wire.position.set(harbor.mission.targetX,.12,-harbor.mission.targetY);marker.add(wire);
    textPanel(scene,side===1?'E–02 / PW–20':'W–02 / PW–20',side*77,2.3,-57,6,1,'#183d42','#ddc18a').rotation.y=side===1?-Math.PI/2:Math.PI/2;
    return marker;
}
