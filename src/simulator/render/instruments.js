import { dockingCue } from '../missions/berth.js';
import * as THREE from 'three';
import { VESSEL, knots, waterVelocity } from '../physics/vessel.js';
// Both the 3D displays and enlarged HUD read these same live canvases.
export class Instruments {
    constructor(meshes) {
        this.displays = meshes.map(mesh => { const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 336; const ctx = canvas.getContext('2d'); const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; mesh.material.map = texture; mesh.material.needsUpdate = true; return { canvas, ctx, texture }; });
    }
    update(s, harbor, mission, metrics, progress) {
        const heading = ((s.heading * 180 / Math.PI) % 360 + 360) % 360;
        this.drawRadar(this.displays[0].ctx, s, harbor);
        this.drawChart(this.displays[1].ctx, s, harbor, mission, progress ? dockingCue(metrics, progress, mission).color : "yellow");
        const c = this.displays[2].ctx; this.background(c, 'PW ENGINE / NAV');
        this.value(c,'SOG',knots(Math.hypot(s.u,s.v)).toFixed(2)+' kn',24,77,'#cce6c9');
        const water = waterVelocity(s, mission); this.value(c,'STW',knots(Math.hypot(water.u,water.v)).toFixed(2)+' kn',272,77,'#9ddbd7');
        this.value(c,'HDG',heading.toFixed(1)+'°',24,149); this.value(c,'PROF. SIM.',harbor.depth.toFixed(1)+' m',272,149);
        this.value(c,'PORT',Math.round(s.port.rpm)+' rpm',24,220,'#dc9986'); this.value(c,'STBD',Math.round(s.starboard.rpm)+' rpm',272,220,'#9fd6b8');
        c.fillStyle='#8ea5a3'; c.font='18px monospace'; c.fillText('TIMÓN '+(s.rudder*180/Math.PI).toFixed(1)+'°',24,286);
        c.fillText('VIENTO '+knots(Math.hypot(mission.wind.x,mission.wind.y)).toFixed(1)+' kn',255,286);
        c.fillText('MUELLE '+Math.max(0,metrics.gap).toFixed(1)+' m',24,316);
        for (const d of this.displays) d.texture.needsUpdate = true;
    }
    background(c, title) { c.fillStyle='#051d24'; c.fillRect(0,0,512,336); c.fillStyle='#9db8b1'; c.font='15px monospace'; c.fillText(title,18,25); c.fillStyle='#22424a'; c.fillRect(16,37,480,1); }
    value(c,label,value,x,y,color='#e3c99b') { c.fillStyle='#729693'; c.font='14px monospace'; c.fillText(label,x,y); c.fillStyle=color; c.font='26px monospace'; c.fillText(value,x,y+32); }
    drawRadar(c,s,harbor) {
        this.background(c,'RADAR DIDÁCTICO / N ARRIBA / 200 m'); const ox=256,oy=188,scale=.64;
        c.strokeStyle='#235948'; c.lineWidth=1; for(const r of [45,90,135]) { c.beginPath(); c.arc(ox,oy,r,0,Math.PI*2); c.stroke(); }
        c.beginPath(); c.moveTo(ox,50); c.lineTo(ox,325); c.moveTo(115,oy); c.lineTo(397,oy); c.stroke();
        const sweep=s.time*.6; c.strokeStyle='#7bd9a880'; c.beginPath(); c.moveTo(ox,oy); c.lineTo(ox+Math.sin(sweep)*135,oy-Math.cos(sweep)*135); c.stroke();
        c.save(); c.beginPath(); c.arc(ox,oy,135,0,Math.PI*2); c.clip();
        // Returns come only from physical harbour objects, with their actual extents.
        for(const b of harbor.boxes.filter(b=>b.kind!=='fender')) { c.fillStyle=b.kind==='boat'?'#d3cb80':'#6bc6a2'; c.fillRect(ox+(b.x-b.w/2-s.x)*scale,oy-(b.y+b.h/2-s.y)*scale,Math.max(2,b.w*scale),Math.max(2,b.h*scale)); }
        c.restore(); c.strokeStyle='#e0e7c6'; c.beginPath(); c.moveTo(ox,oy); c.lineTo(ox+Math.sin(s.heading)*27,oy-Math.cos(s.heading)*27); c.stroke(); c.fillStyle='#eef3d4'; c.fillRect(ox-2,oy-2,4,4);
    }
    drawChart(c,s,harbor,mission,color="yellow") {
        this.background(c,'CARTA LOCAL / PUERTO DE LA ESTELA');
        const scale=2,project=(x,y)=>[256+x*scale,205-(y-28)*scale];
        c.strokeStyle='#274c54'; for(let x=0;x<512;x+=40) {c.beginPath();c.moveTo(x,40);c.lineTo(x,336);c.stroke();} for(let y=50;y<336;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();}
        for(const b of harbor.boxes.filter(b=>b.kind!=='fender')) {const [x,y]=project(b.x-b.w/2,b.y+b.h/2); c.fillStyle=b.kind==='red'?'#d48271':b.kind==='green'?'#69bd92':b.kind==='boat'?'#e4c08e':'#50696b'; c.fillRect(x,y,Math.max(3,b.w*scale),Math.max(3,b.h*scale));}
        const [tx,ty]=project(mission.targetX,mission.targetY); c.strokeStyle={red:'#e46c5a',yellow:'#f0c965',green:'#63d8a0'}[color]; c.lineWidth=2;c.strokeRect(tx-mission.zoneWidth,ty-mission.zoneLength,mission.zoneWidth*scale,mission.zoneLength*scale); c.fillStyle=c.strokeStyle; c.font='13px monospace'; c.fillText(mission.side===1?'E–02':'W–02',tx-50,ty-20);
        const [x,y]=project(s.x,s.y); c.save(); c.translate(x,y); c.rotate(s.heading); c.beginPath();c.moveTo(0,-VESSEL.length);c.lineTo(-VESSEL.beam,VESSEL.length*.7);c.lineTo(VESSEL.beam,VESSEL.length*.7);c.closePath();c.fillStyle='#f1f2db';c.fill();c.restore();
        c.fillStyle='#9bd1c5';c.fillText('N ↑   7.2 m · CARTA SINTÉTICA',18,320);
    }
    dispose() { for(const d of this.displays) d.texture.dispose(); }
}
