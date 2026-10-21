import * as THREE from 'three';
// Original loft, transom to fine rising bow, within the collision dimensions.
export const YACHT_STATIONS=[[-.5,.73],[-.46,.86],[-.35,.96],[-.2,1],[0,1],[.16,.97],[.29,.86],[.39,.65],[.46,.34],[.5,.012]];
export function yachtHullGeometry(length=24,beam=6.2){
    const positions=[],uv=[],indices=[];
    for(const [i,[f,w]]of YACHT_STATIONS.entries()){
        const half=w*beam/2,rise=Math.max(0,f-.22)*1.2;
        const ring=[[half,1.6+rise],[half*.96,.55],[half*.77,-.35],[half*.38,-1],[0,-1.3],[-half*.38,-1],[-half*.77,-.35],[-half*.96,.55],[-half,1.6+rise],[0,1.6+rise]];
        ring.forEach(([x,y],j)=>{positions.push(x,y,-f*length);uv.push(j/10,i/(YACHT_STATIONS.length-1));});
    }
    for(let i=0;i<YACHT_STATIONS.length-1;i++)for(let j=0;j<10;j++){const a=i*10+j,b=i*10+(j+1)%10;indices.push(a,b,a+10,b,b+10,a+10);}
    for(let j=1;j<9;j++){indices.push(0,j+1,j);const a=(YACHT_STATIONS.length-1)*10;indices.push(a,a+j,a+j+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function yachtDeckGeometry(length=24,beam=6.2,inset=.08){
    const shape=new THREE.Shape(),outline=YACHT_STATIONS.map(([f,w])=>[Math.max(.015,w*beam/2-inset),f*length]);shape.moveTo(...outline[0]);for(const p of outline.slice(1))shape.lineTo(...p);for(const [x,y]of outline.toReversed())shape.lineTo(-x,y);shape.closePath();const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);return g;
}
export function softBox(parent,x,y,z,w,h,d,mat,r=.15){
    r=Math.min(r,w/2-.001,d/2-.001);const s=new THREE.Shape(),a=-w/2,b=-d/2;
    s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+d-r);s.quadraticCurveTo(a+w,b+d,a+w-r,b+d);s.lineTo(a+r,b+d);s.quadraticCurveTo(a,b+d,a,b+d-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
    const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:5,steps:1});g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);const mesh=new THREE.Mesh(g,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
