import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { createVessel } from './bridge.js';
import { createHarborView } from './harborView.js';
import { Instruments } from './instruments.js';
import { bodyPoint } from '../physics/vessel.js';
export class SimulatorRenderer {
    constructor(parent, harbor, options) {
        this.parent=parent; this.harbor=harbor; this.low=options.quality==='low'||(options.quality==='auto'&&(matchMedia('(pointer:coarse)').matches||navigator.hardwareConcurrency<=4));
        this.renderer=new THREE.WebGLRenderer({antialias:!this.low,powerPreference:'high-performance'});
        this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.low?1:1.6)); this.renderer.setClearColor('#b7ced0');
        this.renderer.shadowMap.enabled=!this.low;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.65;
        this.renderer.domElement.setAttribute('aria-label','Puente de mando tridimensional y puerto navegable'); this.renderer.domElement.setAttribute('tabindex','0'); parent.append(this.renderer.domElement);
        this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2('#b5ccce',.0017);this.camera=new THREE.PerspectiveCamera(65,1,.05,1800);this.camera.rotation.order='YXZ';
        this.scene.add(new THREE.HemisphereLight('#c8e3f2','#5b675d',1.2)); const sun=new THREE.DirectionalLight('#fff0d3',2.4);sun.position.set(-100,180,-110);sun.castShadow=!this.low;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-110;sun.shadow.camera.right=110;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-220;sun.shadow.camera.far=600;sun.shadow.bias=-.0005;this.scene.add(sun);
        const sky=new THREE.Mesh(new THREE.SphereGeometry(800,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{sun:{value:sun.position.clone().normalize()}},vertexShader:'varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 direction; uniform vec3 sun; void main(){vec3 d=normalize(direction); float h=pow(max(0.0,d.y),0.45);vec3 color=mix(vec3(0.50,0.65,0.70),vec3(0.10,0.31,0.53),h);float glow=pow(max(0.0,dot(d,sun)),64.0);float disc=pow(max(0.0,dot(d,sun)),1800.0);color+=vec3(0.5,0.39,0.22)*glow+vec3(3.0,2.6,1.9)*disc;gl_FragColor=vec4(color,1.0);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}'}));this.scene.add(sky);this.sky=sky;
        const environment=new THREE.PMREMGenerator(this.renderer);this.environment=environment.fromScene(sky,.04);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.22;environment.dispose();
        const size=128, data=new Uint8Array(size*size*4);
        for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,nx=Math.sin(x*.29+y*.17)*.16+Math.cos(y*.5)*.06,ny=Math.cos(x*.23-y*.28)*.15;data[i]=128+nx*127;data[i+1]=128+ny*127;data[i+2]=250;data[i+3]=255;}
        this.normals=new THREE.DataTexture(data,size,size);this.normals.wrapS=this.normals.wrapT=THREE.RepeatWrapping;this.normals.needsUpdate=true;
        if(!this.low) this.water=new Water(new THREE.PlaneGeometry(1800,1800),{textureWidth:512,textureHeight:512,waterNormals:this.normals,sunDirection:sun.position.clone().normalize(),sunColor:'#fff1d0',waterColor:'#1d707b',distortionScale:1.9,fog:true});
        else this.water=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800,32,32),new THREE.MeshStandardMaterial({color:'#246d78',roughness:.25,metalness:.45,normalMap:this.normals,normalScale:new THREE.Vector2(.3,.3)}));
        this.water.rotation.x=-Math.PI/2;this.water.position.y=-.03;this.scene.add(this.water);
        createHarborView(this.scene,harbor);this.vessel=createVessel(this.scene);this.instruments=new Instruments(this.vessel.screens);
        this.ropeGroup=new THREE.Group();this.scene.add(this.ropeGroup);this.ropeMaterial=new THREE.MeshStandardMaterial({color:'#d4b987',roughness:1});this.ropeSegments=[];
        this.view='helm';this.look={yaw:0,pitch:-.08};this.zoom=false;this.elapsed=0;
        this.resize=()=>{const b=parent.getBoundingClientRect();this.renderer.setSize(b.width,b.height,false);this.camera.aspect=b.width/b.height;this.camera.updateProjectionMatrix();};this.observer=new ResizeObserver(this.resize);this.observer.observe(parent);this.resize();
    }
    setView(view) {this.view=view;this.look.yaw=view==='port'?1.05:view==='starboard'?-1.05:0;this.look.pitch=-.08;}
    pickControl(x,y) {const b=this.renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-b.x)/b.width*2-1,-(y-b.y)/b.height*2+1),this.camera);return ray.intersectObject(this.vessel.root,true).find(hit=>hit.object.userData.control)?.object.userData.control||null;}
    render(s,mission,metrics,dt) {
        this.elapsed+=dt; const ship=this.vessel.root;ship.position.set(s.x,Math.sin(s.time*.7)*.025,-s.y);ship.rotation.y=-s.heading;
        this.vessel.wheel.rotation.z=-s.rudder*3.8;this.vessel.levers[0].rotation.x=-s.port.lever*.75;this.vessel.levers[1].rotation.x=-s.starboard.lever*.75;
        if(this.water.material.uniforms?.time) this.water.material.uniforms.time.value=s.time*.55; else this.normals.offset.x+=dt*.005;
        if(this.elapsed>.1){this.instruments.update(s,this.harbor,mission.config,metrics);this.elapsed=0;}
        let pos;
        if(this.view==='external') {
            pos=bodyPoint(s,-29,-24);this.camera.position.set(pos.x,19,-pos.y);this.camera.lookAt(s.x,1,-s.y);
        } else {
            const local=new THREE.Vector3(this.view==='port'?-1.85:this.view==='starboard'?1.85:0,4.55,this.zoom?-.25:2.35);ship.localToWorld(local);this.camera.position.copy(local);this.camera.rotation.set(this.look.pitch,-s.heading+this.look.yaw,0,'YXZ');
            const wanted=this.zoom?42:65;if(this.camera.fov!==wanted){this.camera.fov=wanted;this.camera.updateProjectionMatrix();}
        }
        this.updateRopes(s,mission.lines);this.renderer.render(this.scene,this.camera);
    }
    updateRopes(s,lines) {
        while(this.ropeSegments.length<lines.length){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1,6),this.ropeMaterial);this.ropeGroup.add(mesh);this.ropeSegments.push(mesh);}
        this.ropeSegments.forEach((m,i)=>{const l=lines[i];m.visible=!!l?.secured;if(!m.visible)return;const p=bodyPoint(s,l.forward,l.starboard),a=new THREE.Vector3(p.x,1.6,-p.y),b=new THREE.Vector3(l.shore.x,1.55,-l.shore.y);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());});
    }
    dispose() {
        this.observer.disconnect();this.instruments.dispose();const textures=new Set(),geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.normals.dispose();this.environment.dispose();this.water.dispose?.();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();
    }
}
