import * as THREE from 'three';
import { PORT } from '../world/harbor.js';
import { dockingCue } from '../missions/berth.js';
const COLORS={red:0xe46c5a,yellow:0xf0c965,green:0x63d8a0};
export class BerthMarker {
    constructor(scene,mission) {
        this.mission=mission;this.root=new THREE.Group();scene.add(this.root);
        const width=mission.zoneWidth||10,length=mission.zoneLength||32;
        this.surfaceMaterial=new THREE.MeshBasicMaterial({color:COLORS.red,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
        this.edgeMaterial=new THREE.MeshBasicMaterial({color:COLORS.red,toneMapped:false});
        const cx=mission.side*(PORT.quayX-width/2-.25),cy=mission.targetY;
        const fill=new THREE.Mesh(new THREE.PlaneGeometry(width,length),this.surfaceMaterial);fill.rotation.x=-Math.PI/2;fill.position.set(cx,.09,-cy);this.root.add(fill);
        const boundary=new THREE.EdgesGeometry(new THREE.BoxGeometry(width,.08,length));const outline=new THREE.LineSegments(boundary,new THREE.LineBasicMaterial({color:COLORS.red,toneMapped:false}));outline.position.copy(fill.position);this.root.add(outline);this.outline=outline;
        // Segmented rails remain legible at oblique eye-level angles without covering the water.
        for(const x of [-1,1])for(let k=0;k<7;k++){const dash=new THREE.Mesh(new THREE.BoxGeometry(.14,.10,length/10),this.edgeMaterial);dash.position.set(cx+x*width/2,.12,-cy+(k-3)*length/7);this.root.add(dash);}
        for(const y of [-1,1]){const end=new THREE.Mesh(new THREE.BoxGeometry(width,.12,.14),this.edgeMaterial);end.position.set(cx,.12,-cy+y*length/2);this.root.add(end);}
        const shore=new THREE.Mesh(new THREE.BoxGeometry(1.7,.035,length),this.surfaceMaterial);shore.position.set(mission.side*(PORT.quayX+1),1.14,-cy);this.root.add(shore);
        const pole=new THREE.Mesh(new THREE.CylinderGeometry(.075,.11,6,10),new THREE.MeshStandardMaterial({color:'#697d78',roughness:.5,metalness:.5}));pole.position.set(mission.side*65,4.05,-cy);pole.castShadow=true;this.root.add(pole);
        const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;const c=canvas.getContext('2d');c.fillStyle='#15313b';c.fillRect(0,0,512,192);c.strokeStyle='#d6bd8b';c.lineWidth=6;c.strokeRect(3,3,506,186);c.textAlign='center';c.fillStyle='#f0e8d4';c.font='600 80px sans-serif';c.fillText(mission.side===1?'E–02':'W–02',256,96);c.font='22px monospace';c.fillStyle='#e1c98d';c.fillText(mission.side===1?'ESTRIBOR / DERECHA':'BABOR / IZQUIERDA',256,146);
        this.texture=new THREE.CanvasTexture(canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
        const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:this.texture,toneMapped:false}));sign.position.set(mission.side*65,6.6,-cy);sign.scale.set(4.4,1.65,1);this.root.add(sign);
        this.color='';
    }
    update(metrics,progress,time){const cue=dockingCue(metrics,progress,this.mission);if(cue.color!==this.color){this.color=cue.color;const color=COLORS[cue.color];this.surfaceMaterial.color.setHex(color);this.edgeMaterial.color.setHex(color);this.outline.material.color.setHex(color);}this.surfaceMaterial.opacity=cue.color==='green'?.20:.13+Math.sin(time*1.3)*.015;return cue;}
}
