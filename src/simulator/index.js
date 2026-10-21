import { PoseInterpolator } from './render/interpolation.js';
import { createState, stepPhysics, neutral } from './physics/vessel.js';
import { resolveCollisions } from './physics/collisions.js';
import { FixedClock } from './physics/clock.js';
import { createHarbor } from './world/harbor.js';
import { DockingMission, dockingMetrics } from './missions/docking.js';
import { Tutorial } from './missions/tutorial.js';
import { SimulatorRenderer } from './render/Renderer.js';
import { Controls } from './services/controls.js';
import { MarineAudio } from './services/audio.js';
import { loadSimulator, saveResult, saveOptions } from './services/persistence.js';
import { SimulatorHud } from './ui/Hud.js';
import './ui/simulator.css';
export async function startSimulator(parent,config,onExit,onHome){
    const root=document.createElement('section');root.className='sim-root';root.setAttribute('aria-label','Simulador de atraque');parent.append(root);
    const harbor=createHarbor(config),options={...loadSimulator().options};let view;
    try{view=new SimulatorRenderer(root,harbor,options);}catch(e){root.remove();throw e;}
    const state=createState(harbor.start),clock=new FixedClock(),interpolation=new PoseInterpolator(),audio=new MarineAudio(options.sound);let mission=new DockingMission(config,harbor),tutorial=new Tutorial(),paused=false,disposed=false,frame=0,last=performance.now(),shown=false,hudElapsed=0;
    mission.metrics=dockingMetrics(state,config);interpolation.reset(state);
    const reset=()=>{Object.assign(state,createState(harbor.start));mission=new DockingMission(config,harbor);mission.metrics=dockingMetrics(state,config);interpolation.reset(state);hudElapsed=0;tutorial=new Tutorial();shown=false;paused=false;controls.enabled=true;controls.keys.clear();view.setView('helm');hud.closeDialog();clock.reset();audio.pause(false);};
    const pause=()=>{if(shown||hud.instrumentDialog)return;paused=!paused;controls.enabled=!paused;controls.keys.clear();clock.reset();interpolation.reset(state);audio.pause(paused);if(paused)hud.pause(options);else{hud.closeDialog();last=performance.now();}};
    const moor=()=>{if(paused||shown)return;if(mission.requestMooring(state)){audio.signal();hud.toast('Orden recibida. Tripulación asegurando largos y esprines.');}else hud.toast('Ajusta la posición, reduce arrancada y ordena N. La zona verde confirma cuándo puedes amarrar.');};
    const help=()=>{tutorial.hidden=!tutorial.hidden;};
    const controls=new Controls(view.renderer.domElement,state,view,{pause,moor,help,blur:()=>{if(!paused&&!shown&&!hud.instrumentDialog)pause();}},options.sensitivity);
    const hud=new SimulatorHud(root,config,state,view,{pause,moor,help,running:()=>!paused&&!shown,exit:onExit,retry:reset,sound:value=>{audio.setEnabled(value);saveOptions({sound:value});}},options);
    const unlock=()=>audio.unlock();root.addEventListener('pointerdown',unlock,{once:true});root.addEventListener('keydown',unlock,{once:true});
    const visibility=()=>{if(document.hidden&&!paused&&!shown)pause();};document.addEventListener('visibilitychange',visibility);
    const contextLost=e=>{e.preventDefault();if(!paused&&!shown)pause();hud.toast('Se ha perdido el contexto gráfico. Vuelve a misiones para reiniciar el modo 3D.');};view.renderer.domElement.addEventListener('webglcontextlost',contextLost);
    const updateStep=dt=>{
            interpolation.capture(state);controls.update(dt);stepPhysics(state,config,dt);const impacts=resolveCollisions(state,harbor.boxes);mission.update(state,dt,impacts);tutorial.update(state,controls,mission);
            if(impacts.some(i=>i.speed>.18))audio.signal('contact');
            if(mission.finished&&!shown){shown=true;controls.enabled=false;saveResult(config.id,mission.result);audio.signal();hud.result(mission.result,config,loadSimulator().unlocked);}
    };
    const tick=now=>{
        if(disposed)return;const delta=Math.min(.15,(now-last)/1000);last=now;
        if(!paused&&!shown)clock.advance(delta,updateStep);
        audio.update(state,Math.hypot(config.wind.x,config.wind.y));hudElapsed+=delta;if(hudElapsed>=.1){hud.update(state,mission,tutorial);hudElapsed=0;}view.render(interpolation.sample(state,paused||shown?1:clock.accumulator/clock.step),mission,mission.metrics,delta);frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    // Local inspection only; production exposes no state-changing QA hook.
    if(import.meta.env.DEV)window.__PW_SIM__={state,harbor,get mission(){return mission;},view,controls,reset,moor,pause,clock,stepForTest:updateStep};
    return ()=>{disposed=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);view.renderer.domElement.removeEventListener('webglcontextlost',contextLost);controls.dispose();hud.dispose();audio.dispose();view.dispose();root.remove();if(import.meta.env.DEV)delete window.__PW_SIM__;};
}
