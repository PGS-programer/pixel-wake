import { VESSEL, clamp, neutral, setLever } from '../physics/vessel.js';
export class Controls {
    constructor(canvas, state, view, callbacks, sensitivity = 1) {
        this.keys=new Set();this.s=state;this.view=view;this.enabled=true;this.looked=false;this.sensitivity=sensitivity;this.abort=new AbortController();const signal=this.abort.signal;
        window.addEventListener('keydown',e=>{
            if(e.target.closest?.('input,select,textarea'))return;
            if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();
            this.keys.add(e.code);if(e.repeat)return;
            if(e.code==='Escape'||e.code==='KeyP')callbacks.pause();
            if(!this.enabled)return;
            if(e.code==='KeyN')neutral(state);
            if(e.code==='KeyM')callbacks.moor();
            if(e.code==='Digit1')view.setView('helm');if(e.code==='Digit2')view.setView('port');if(e.code==='Digit3')view.setView('starboard');if(e.code==='Digit4')view.setView('external');
            if(e.code==='KeyZ')view.zoom=!view.zoom;if(e.code==='KeyH')callbacks.help();
        },{signal});
        window.addEventListener('keyup',e=>this.keys.delete(e.code),{signal});window.addEventListener('blur',()=>{this.keys.clear();callbacks.blur();},{signal});
        canvas.addEventListener('pointerdown',e=>{
            if(!this.enabled||e.button>0)return;
            const control=view.pickControl(e.clientX,e.clientY);this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,control,value:control==='rudder'?state.rudderOrder:state[control]?.lever};
            canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
        },{signal});
        canvas.addEventListener('pointermove',e=>{
            const p=this.pointer;if(!p||p.id!==e.pointerId||!this.enabled)return;
            const dx=e.clientX-p.x,dy=e.clientY-p.y;
            if(p.control==='port'||p.control==='starboard')setLever(state,p.control,p.value-dy/140);
            else if(p.control==='rudder')state.rudderOrder=clamp(p.value+dx*.005,-VESSEL.rudderLimit,VESSEL.rudderLimit);
            else {view.look.yaw=clamp(view.look.yaw-dx*.004*this.sensitivity,-2.6,2.6);view.look.pitch=clamp(view.look.pitch-dy*.003*this.sensitivity,-.9,.65);p.x=e.clientX;p.y=e.clientY;if(Math.abs(dx)+Math.abs(dy)>2)this.looked=true;}
        },{signal});
        for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{this.pointer=null;},{signal});
        canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=e.deltaY<0;},{signal,passive:false});
    }
    update(dt) {
        if(!this.enabled)return;const k=this.keys,s=this.s;
        setLever(s,'port',s.port.lever+((k.has('KeyW')?1:0)-(k.has('KeyS')?1:0))*VESSEL.leverRate*dt);
        setLever(s,'starboard',s.starboard.lever+((k.has('KeyO')?1:0)-(k.has('KeyL')?1:0))*VESSEL.leverRate*dt);
        if(k.has('ArrowUp'))s.rudderOrder=0;
        else s.rudderOrder=clamp(s.rudderOrder+((k.has('ArrowRight')?1:0)-(k.has('ArrowLeft')?1:0))*.28*dt,-VESSEL.rudderLimit,VESSEL.rudderLimit);
    }
    dispose(){this.abort.abort();this.keys.clear();}
}
