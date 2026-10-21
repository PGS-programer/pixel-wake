import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { createVessel } from './bridge.js';
import { createHarborView } from './harborView.js';
import { Instruments } from './instruments.js';
import { bodyPoint } from '../physics/vessel.js';
import { BerthMarker } from './berthMarker.js';
import { batchStatic } from './batching.js';
import { RopeBundle } from './ropes.js';
const skyVertex='varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const skyFragment=`
    varying vec3 direction; uniform vec3 sun; uniform float time;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){
        vec3 d=normalize(direction);float h=pow(max(0.0,d.y),0.45);
        vec3 color=mix(vec3(0.54,0.66,0.68),vec3(0.10,0.34,0.59),h);
        vec2 p=d.xz/(max(.02,d.y)+.3)*3.0+vec2(time*.0015,0);
        float clouds=noise(p)*.6+noise(p*2.05)*.27+noise(p*4.1)*.13;
        float alpha=smoothstep(.57,.78,clouds)*smoothstep(.04,.32,d.y)*.7;
        color=mix(color,vec3(.88,.85,.76),alpha);
        float glow=pow(max(0.0,dot(d,sun)),90.0),disc=pow(max(0.0,dot(d,sun)),1800.0);
        color+=vec3(.5,.36,.18)*glow+vec3(3.0,2.6,1.9)*disc;
        gl_FragColor=vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }`;
export class SimulatorRenderer {
    constructor(parent, harbor, options) {
        this.parent=parent;this.harbor=harbor;
        this.low=options.quality==='low'||(options.quality==='auto'&&(matchMedia('(pointer:coarse)').matches||navigator.hardwareConcurrency<=4));
        this.renderer=new THREE.WebGLRenderer({antialias:!this.low,powerPreference:'high-performance'});
        this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.low?1:1.6));this.renderer.setClearColor('#b9cfce');
        this.renderer.shadowMap.enabled=!this.low;this.renderer.shadowMap.type=THREE.PCFShadowMap;
        this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.9;
        this.renderer.domElement.setAttribute('aria-label','Puente de mando tridimensional y puerto navegable');this.renderer.domElement.setAttribute('tabindex','0');parent.append(this.renderer.domElement);
        this.scene=new THREE.Scene();this.scene.fog=new THREE.FogExp2('#b9cecb',.0014);
        this.camera=new THREE.PerspectiveCamera(65,1,.05,1400);this.camera.rotation.order='YXZ';
        this.scene.add(new THREE.HemisphereLight('#d3e6ef','#a28c6b',1.5));
        const sun=new THREE.DirectionalLight('#ffe2b7',3.0);sun.position.set(-85,150,-90);sun.castShadow=!this.low;
        sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-90,right:90,top:140,bottom:-140,far:460});sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;sun.shadow.radius=2;this.scene.add(sun);
        this.sky=new THREE.Mesh(new THREE.SphereGeometry(650,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{sun:{value:sun.position.clone().normalize()},time:{value:0}},vertexShader:skyVertex,fragmentShader:skyFragment}));this.scene.add(this.sky);
        const environment=new THREE.PMREMGenerator(this.renderer);this.environment=environment.fromScene(this.sky,.05);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.32;environment.dispose();
        const size=128,data=new Uint8Array(size*size*4);
        for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,nx=Math.sin(x*.31+y*.13)*.12+Math.cos(y*.49+x*.1)*.07,ny=Math.cos(x*.19-y*.37)*.13+Math.sin(x*.51+y*.29)*.04;data[i]=128+nx*127;data[i+1]=128+ny*127;data[i+2]=251;data[i+3]=255;}
        this.normals=new THREE.DataTexture(data,size,size);this.normals.wrapS=this.normals.wrapT=THREE.RepeatWrapping;this.normals.needsUpdate=true;
        if(!this.low){
            this.water=new Water(new THREE.PlaneGeometry(1400,1400),{textureWidth:512,textureHeight:512,waterNormals:this.normals,sunDirection:sun.position.clone().normalize(),sunColor:'#ffebce',waterColor:'#258387',distortionScale:.75,fog:true});
            this.water.material.uniforms.size.value=2.7;
            this.water.material.fragmentShader=this.water.material.fragmentShader.replace('vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;', 'float variation=sin(worldPosition.x*.032+worldPosition.z*.043)*.035; vec3 localWater=waterColor+vec3(variation*.15,variation*.55,variation*.45); vec3 scatter=max(0.0,dot(surfaceNormal,eyeDirection))*localWater;');
        }else this.water=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),new THREE.MeshStandardMaterial({color:'#3b8a90',roughness:.3,metalness:.2,normalMap:this.normals,normalScale:new THREE.Vector2(.2,.2)}));
        this.water.rotation.x=-Math.PI/2;this.water.position.y=-.03;this.scene.add(this.water);
        this.harborView=createHarborView(this.scene,harbor,this.low);this.berth=new BerthMarker(this.scene,harbor.mission);
        this.vessel=createVessel(this.scene);this.instruments=new Instruments(this.vessel.screens);
        batchStatic(this.vessel.root,new Set([this.vessel.wheel,...this.vessel.levers,...this.vessel.screens]));
        this.ropeGroup=new THREE.Group();this.scene.add(this.ropeGroup);this.playerRopes=new RopeBundle(this.ropeGroup,6,this.harborView.materials.rope,.032);
        this.view='helm';this.look={yaw:0,pitch:-.08};this.zoom=false;this.elapsed=0;this.navigation={bearing:0,distance:0};
        this.framePeriods=[];this.renderTimes=[];this.statsFrame=0;this.stats={fps:0,p95ms:0,cpuMs:0,calls:0,triangles:0,samples:0};
        this.resize=()=>{const b=parent.getBoundingClientRect();this.renderer.setSize(b.width,b.height,false);this.camera.aspect=b.width/b.height;this.camera.updateProjectionMatrix();};this.observer=new ResizeObserver(this.resize);this.observer.observe(parent);this.resize();
    }
    setView(view){this.view=view;this.look.yaw=view==='port'?1.05:view==='starboard'?-1.05:0;this.look.pitch=-.08;}
    pickControl(x,y){const b=this.renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-b.x)/b.width*2-1,-(y-b.y)/b.height*2+1),this.camera);return ray.intersectObject(this.vessel.root,true).find(hit=>hit.object.userData.control)?.object.userData.control||null;}
    render(s,mission,metrics,dt){
        const start=performance.now();this.elapsed+=dt;const ship=this.vessel.root,t=s.time;
        // Very small wave response is exclusively visual; the planar hull state never changes.
        const swell=(.35+Math.min(1,Math.hypot(mission.config.wind.x,mission.config.wind.y)/10))*(s.moored?.15:1);
        ship.position.set(s.x,Math.sin(t*.72)*.04*swell,-s.y);ship.rotation.set(Math.sin(t*.53)*.0014*swell,-s.heading,Math.sin(t*.67+.7)*.002*swell,'YXZ');
        this.vessel.wheel.rotation.z=-s.rudder*3.8;this.vessel.levers[0].rotation.x=-s.port.lever*.75;this.vessel.levers[1].rotation.x=-s.starboard.lever*.75;
        this.sky.material.uniforms.time.value=t;
        if(this.water.material.uniforms?.time)this.water.material.uniforms.time.value=t*.36;else {this.normals.offset.x=t*.0018;this.normals.offset.y=t*.0011;}
        this.harborView.update(t);this.berth.update(metrics,mission,t);
        if(this.elapsed>.1){this.instruments.update(s,this.harbor,mission.config,metrics,mission);this.elapsed=0;}
        if(this.view==='external'){const pos=bodyPoint(s,-26,-23);this.camera.position.set(pos.x,18,-pos.y);this.camera.lookAt(s.x,1,-s.y);}
        else{
            const local=new THREE.Vector3(this.view==='port'?-1.85:this.view==='starboard'?1.85:0,4.65,this.zoom?-.25:2.35);ship.localToWorld(local);this.camera.position.copy(local);
            // The eye follows the interpolated hull; roll/pitch are mostly compensated like a stable head.
            this.camera.rotation.set(this.look.pitch+ship.rotation.x*.2,-s.heading+this.look.yaw,ship.rotation.z*.15,'YXZ');
            const wanted=this.zoom?42:65;if(this.camera.fov!==wanted){this.camera.fov=wanted;this.camera.updateProjectionMatrix();}
        }
        this.camera.updateMatrixWorld();const target=new THREE.Vector3(mission.config.targetX,2,-mission.config.targetY);const relative=target.clone().applyMatrix4(this.camera.matrixWorldInverse);
        this.navigation.bearing=Math.atan2(relative.x,-relative.z);this.navigation.distance=Math.hypot(s.x-mission.config.targetX,s.y-mission.config.targetY);
        this.updateRopes(mission.lines);this.renderer.render(this.scene,this.camera);
        if(dt>0&&dt<.15)this.framePeriods.push(dt*1000);this.renderTimes.push(performance.now()-start);if(this.framePeriods.length>180)this.framePeriods.shift();if(this.renderTimes.length>180)this.renderTimes.shift();
        if(++this.statsFrame%15===0){const sorted=[...this.framePeriods].sort((a,b)=>a-b);this.stats={fps:1000/(this.framePeriods.reduce((a,b)=>a+b,0)/(this.framePeriods.length||1)),p95ms:sorted[Math.floor(sorted.length*.95)]||0,cpuMs:this.renderTimes.reduce((a,b)=>a+b,0)/this.renderTimes.length,calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,samples:this.framePeriods.length};}
    }
    updateRopes(lines){this.playerRopes.update(Array.from({length:6},(_,i)=>{const l=lines[i];if(!l?.secured)return null;const point=new THREE.Vector3(l.starboard,1.6,-l.forward);this.vessel.root.localToWorld(point);return{a:point,b:new THREE.Vector3(l.shore.x,1.47,-l.shore.y)};}));}
    dispose(){
        this.observer.disconnect();this.instruments.dispose();const textures=new Set(),geometries=new Set(),materials=new Set();this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.normals.dispose();this.environment.dispose();this.renderer.dispose();this.renderer.forceContextLoss();this.renderer.domElement.remove();
    }
}
