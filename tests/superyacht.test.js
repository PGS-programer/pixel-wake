import test from 'node:test';
import assert from 'node:assert/strict';
import {VESSEL,createState,stepPhysics} from '../src/simulator/physics/vessel.js';
import {MISSIONS,createHarbor,PORT} from '../src/simulator/world/harbor.js';
import {overlap} from '../src/simulator/physics/collisions.js';
import {DockingMission} from '../src/simulator/missions/docking.js';
import {dockingCue,dockingMetrics} from '../src/simulator/missions/berth.js';
import {yachtHullGeometry,yachtDeckGeometry} from '../src/simulator/render/yachtGeometry.js';
import {PoseInterpolator} from '../src/simulator/render/interpolation.js';

test('Aurea: sculpted hull fits the real 24m by 6.2m collision envelope',()=>{
    const g=yachtHullGeometry(VESSEL.length,VESSEL.beam);g.computeBoundingBox();const b=g.boundingBox;
    assert.ok(Math.abs((b.max.z-b.min.z)-24)<1e-6);assert.ok(Math.abs((b.max.x-b.min.x)-6.2)<1e-6);
    const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(n.getX(i)+n.getY(i)+n.getZ(i)));assert.ok(Math.abs(p.getX(i))<=VESSEL.beam/2+1e-6);}
    const deck=yachtDeckGeometry(VESSEL.length,VESSEL.beam);deck.computeBoundingBox();assert.ok(deck.boundingBox.max.x<=VESSEL.beam/2);assert.ok(p.count<150);g.dispose();deck.dispose();
});
test('Aurea: all missions start inside clear manoeuvring water within 40m of their berth',()=>{
    for(const m of MISSIONS){const h=createHarbor(m),s=createState(h.start),q=new DockingMission(m,h);assert.ok(q.entered);assert.ok(Math.hypot(s.x-m.targetX,s.y-m.targetY)<40);assert.equal(dockingCue(dockingMetrics(s,m),q,m).ready,false);for(const b of h.boxes)assert.equal(overlap(s,b),null,`${m.id}: ${b.id}`);}
    // First target used to be 128m away, outside the breakwater; now ~32m and immediately angled.
    const m=MISSIONS[0];assert.ok(Math.hypot(m.start.x-m.targetX,m.start.y-m.targetY)<33);assert.ok(Math.abs(m.start.heading)>.3);
});
test('Aurea: northern finger pontoons are physical and do not intersect berthed vessels',()=>{
    const h=createHarbor(MISSIONS[0]),fingers=h.boxes.filter(b=>b.kind==='finger');assert.equal(fingers.length,5);
    for(const f of fingers){assert.ok(f.y-f.h/2>MISSIONS[0].targetY+MISSIONS[0].zoneLength/2+10);for(const boat of h.boxes.filter(b=>b.kind==='boat'))assert.ok(Math.abs(f.x-boat.x)>=(f.w+boat.w)/2||Math.abs(f.y-boat.y)>=(f.h+boat.h)/2);}
    assert.ok(PORT.quayX<62);assert.ok(PORT.northY-PORT.gateY<148);
});
test('Aurea: visible levers interpolate without mutating engine orders, shafts or gears',()=>{
    const s=createState(),q=new PoseInterpolator();q.capture(s);s.port.lever=.4;s.port.shaft=.2;s.port.rpm=920;s.starboard.lever=-.6;s.starboard.gear=-1;const before=structuredClone(s),p=q.sample(s,.5);assert.equal(p.port.lever,.2);assert.equal(p.port.shaft,.1);assert.equal(p.starboard.lever,-.3);assert.equal(p.starboard.gear,-1);assert.deepEqual(s,before);q.reset(s);assert.equal(q.sample(s,0).port.lever,.4);
});
test('Aurea: all five assignments accept a real safe pose and complete the crew sequence under their environment',()=>{
    for(const m of MISSIONS){const h=createHarbor(m),s=createState({x:m.targetX,y:m.targetY}),q=new DockingMission(m,h);for(let i=0;i<15*60&&!q.finished;i++){stepPhysics(s,m,1/60);q.update(s,1/60);q.requestMooring(s);}assert.ok(q.finished,`mission ${m.id}`);assert.equal(q.lines.filter(l=>l.secured).length,6);for(const b of h.boxes)assert.equal(overlap(s,b),null,`${m.id}: ${b.id}`);}
});
