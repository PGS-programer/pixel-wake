import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createState,stepPhysics,axes,bodyPoint} from '../src/simulator/physics/vessel.js';
import {PoseInterpolator} from '../src/simulator/render/interpolation.js';
import {dockingCue,dockingMetrics,dockingLimits} from '../src/simulator/missions/berth.js';
import {MISSIONS,createHarbor,PORT} from '../src/simulator/world/harbor.js';
import {playerMoorings,decorativeMoorings} from '../src/simulator/world/moorings.js';
import {DockingMission} from '../src/simulator/missions/docking.js';

test('harbour update: navigation forces, contacts and keyboard controller remain byte-for-byte unchanged',async()=>{
    const expected={'physics/vessel.js':'2dbcd959b074153c6b213552b36fd9465539d96d98aa22e700487dcef747be79','physics/collisions.js':'ec1e43dfb8c6a552d5045bd33ede1d7ecb6ff1f31f93784ae52f9cf39c1946ce','services/controls.js':'e49c0d694df8a8e64aba0206866038a86637de1dbfc4e106a76234220d8adaf2'};
    for(const [file,hash]of Object.entries(expected))assert.equal(createHash('sha256').update(await readFile('src/simulator/'+file)).digest('hex'),hash,file);
});
test('harbour update: the same engine and rudder sequence reproduces the 3.0 trajectory',async()=>{
    const {samples}=JSON.parse(await readFile('tests/fixtures/navigation-baseline.json','utf8')),s=createState({x:0,y:0}),env={wind:{x:2,y:-1},current:{x:.1,y:.05}};
    for(let i=0;i<7200;i++){const t=i/60;s.port.lever=t<20?.5:t<40?.6:t<60?-.35:t<80?0:t<100?-.5:.25;s.starboard.lever=t<20?.5:t<40?-.25:t<60?-.35:t<80?0:t<100?.5:.35;s.rudderOrder=t<30?0:t<60?.3:t<90?-.15:0;stepPhysics(s,env,1/60);if((i+1)%600===0)for(const [key,value]of Object.entries(samples[(i+1)/600-1]))assert.ok(Math.abs(s[key]-value)<1e-9,key);}
});
test('harbour update: interpolation is read-only, bounded, handles heading wrap and resets cleanly',()=>{
    const s=createState({x:2,y:3,heading:Math.PI-.01}),interpolation=new PoseInterpolator();interpolation.capture(s);s.x=4;s.y=5;s.heading=-Math.PI+.01;const before=structuredClone(s),half=interpolation.sample(s,.5);assert.equal(half.x,3);assert.equal(half.y,4);assert.ok(Math.abs(Math.abs(half.heading)-Math.PI)<1e-12);assert.deepEqual(s,before);assert.equal(interpolation.sample(s,-1).x,2);assert.equal(interpolation.sample(s,2).x,4);s.x=90;interpolation.reset(s);assert.equal(interpolation.sample(s,.1).x,90);
});
test('harbour update: red/yellow/green and actual mooring permission use the same live criteria',()=>{
    const m=MISSIONS[0],s=createState({x:m.targetX,y:m.targetY}),h=createHarbor(m),progress=new DockingMission(m,h);
    const cue=()=>dockingCue(dockingMetrics(s,m),progress,m);
    assert.equal(dockingCue(dockingMetrics(createState(h.start),m),progress,m).color,'red');
    progress.entered=true;s.x=54;s.heading=20*Math.PI/180;assert.equal(cue().color,'yellow');assert.equal(cue().ready,false);
    s.x=m.targetX;s.heading=0;s.u=.9;assert.equal(cue().color,'red');s.u=.4;assert.equal(cue().color,'yellow');s.u=0;s.port.lever=.2;assert.equal(cue().color,'yellow');s.port.lever=0;
    progress.update(s,1.5);assert.equal(cue().color,'yellow');assert.equal(progress.requestMooring(s),false);
    progress.update(s,.6);assert.equal(cue().color,'green');assert.equal(cue().ready,true);assert.match(cue().title,/POSICIÓN CORRECTA/);assert.equal(progress.lines.length,0,'green never attaches lines automatically');assert.equal(progress.requestMooring(s),true);assert.equal(cue().ready,false);assert.equal(cue().color,'green');
    s.v=.5;progress.update(s,1/60);assert.equal(cue().ready,false);assert.notEqual(cue().color,'green');assert.equal(progress.lines.length,0);
});
test('harbour update: easy berths are permissive in position but still reject unsafe motion',()=>{
    const m=MISSIONS[0],s=createState({x:53,y:m.targetY+7,heading:12*Math.PI/180});assert.ok(dockingMetrics(s,m).safe);s.u=.5;assert.equal(dockingMetrics(s,m).safe,false);s.u=0;s.r=.03;assert.equal(dockingMetrics(s,m).safe,false);assert.ok(dockingLimits(m).angleDeg>dockingLimits(MISSIONS[3]).angleDeg);
});
test('harbour update: easy approach water remains clear of stationary boats and gangways',()=>{
    for(const m of MISSIONS.slice(0,2)){const h=createHarbor(m);assert.ok(h.start.y>-120);for(const b of h.boxes.filter(b=>b.kind==='boat'||b.kind==='pier')){
        const inY=Math.abs(b.y-m.targetY)<(m.zoneLength/2+b.h/2+3),inX=Math.abs(b.x-m.targetX)<(m.zoneWidth/2+b.w/2+5);assert.equal(inY&&inX,false,b.id);
    }assert.ok(h.boxes.filter(b=>b.kind==='quay').every(b=>b.h<=150));}
});
test('harbour update: player lines start at actual cleats and lead outwards to real shore bollards',()=>{
    for(const m of MISSIONS.slice(0,3))for(const heading of [-.15,0,.15]){
        const s=createState({x:m.side*55,y:m.targetY,heading}),h=createHarbor(m),lines=playerMoorings(s,m,h.bollards),a=axes(heading);assert.equal(lines.length,6);
        for(const line of lines){assert.ok(h.bollards.includes(line.shore));const p=bodyPoint(s,line.forward,line.starboard),dx=line.shore.x-p.x,dy=line.shore.y-p.y;assert.ok((dx*a.sx+dy*a.sy)*m.side>0);assert.ok(Math.abs(line.shore.x)>PORT.quayX);}
    }
});
test('harbour update: decorative moorings terminate on their actual quay/pontoon and avoid other boats',()=>{
    const h=createHarbor(MISSIONS[0]);
    for(const boat of h.boats)for(const line of decorativeMoorings(boat)){
        const p=bodyPoint(boat,line.forward,line.across);
        assert.ok(h.boxes.some(b=>['quay','pier'].includes(b.kind)&&Math.abs(line.shore.x-b.x)<=b.w/2&&Math.abs(line.shore.y-b.y)<=b.h/2));
        for(let k=1;k<=20;k++){const t=k/20,x=p.x+(line.shore.x-p.x)*t,y=p.y+(line.shore.y-p.y)*t;for(const b of h.boxes.filter(b=>b.kind==='boat'&&b.id!==boat.id))assert.ok(!(Math.abs(x-b.x)<b.w/2&&Math.abs(y-b.y)<b.h/2),boat.id+' -> '+b.id);}
    }
});
