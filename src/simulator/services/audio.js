// Procedural local audio; two independent engine voices and filtered harbour noise.
export class MarineAudio {
    constructor(enabled=true){this.enabled=enabled;this.voices=[];this.nextBird=18;this.paused=false;}
    unlock(){
        if(this.ctx){this.ctx.resume().catch(()=>{});return;}
        try {
            const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.18:0;this.master.connect(this.ctx.destination);
            for(const pan of [-.4,.4]){const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter(),stereo=this.ctx.createStereoPanner();osc.type='sawtooth';osc.frequency.value=35;filter.type='lowpass';filter.frequency.value=160;stereo.pan.value=pan;gain.gain.value=.15;osc.connect(filter);filter.connect(gain);gain.connect(stereo);stereo.connect(this.master);osc.start();this.voices.push({osc,gain,filter});}
            const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*5;}
            this.noise=this.ctx.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;this.wave=this.ctx.createGain();this.wave.gain.value=.035;this.noise.connect(this.wave);this.wave.connect(this.master);this.noise.start();
        }catch{/* Play without audio when unavailable. */}
    }
    update(s,wind=0){
        if(!this.ctx||!this.master)return;const t=this.ctx.currentTime;
        [s.port,s.starboard].forEach((e,i)=>{const v=this.voices[i];v.osc.frequency.setTargetAtTime(e.rpm/60*3,t,.18);v.filter.frequency.setTargetAtTime(120+Math.abs(e.shaft)*420,t,.2);v.gain.gain.setTargetAtTime(.10+Math.abs(e.shaft)*.18,t,.2);});
        const wash=.025+Math.min(.12,Math.hypot(s.u,s.v)*.02+wind*.004);
        this.wave.gain.setTargetAtTime(wash*(.91+.09*Math.sin(s.time*.7)),t,.4);
        if(this.enabled&&!this.paused&&s.y>-85&&s.time>this.nextBird){this.nextBird=s.time+28+Math.sin(s.time)*7;this.harborBird();}
    }
    harborBird(){
        // A quiet, intermittent synthesized distant gull, with no external audio downloads.
        if(!this.ctx||!this.enabled)return;
        for(let i=0;i<2;i++){const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),pan=this.ctx.createStereoPanner(),t=this.ctx.currentTime+i*.26;osc.type='sine';pan.pan.value=-.55;osc.frequency.setValueAtTime(940,t);osc.frequency.exponentialRampToValueAtTime(1430,t+.1);osc.frequency.exponentialRampToValueAtTime(790,t+.3);gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(.025,t+.08);gain.gain.exponentialRampToValueAtTime(.001,t+.34);osc.connect(gain);gain.connect(pan);pan.connect(this.master);osc.start(t);osc.stop(t+.36);osc.onended=()=>{osc.disconnect();gain.disconnect();pan.disconnect();};}
    }
    setEnabled(value){this.enabled=value;if(this.master)this.master.gain.setTargetAtTime(value?.18:0,this.ctx.currentTime,.1);}
    pause(value){this.paused=value;if(this.master)this.master.gain.setTargetAtTime(value?0:this.enabled?.18:0,this.ctx.currentTime,.1);}
    signal(kind='order'){if(!this.ctx||!this.enabled)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),t=this.ctx.currentTime;osc.type=kind==='contact'?'triangle':'sine';osc.frequency.setValueAtTime(kind==='contact'?70:580,t);gain.gain.setValueAtTime(.2,t);gain.gain.exponentialRampToValueAtTime(.001,t+.22);osc.connect(gain);gain.connect(this.master);osc.start();osc.stop(t+.25);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
    dispose(){this.voices.forEach(v=>v.osc.stop());this.noise?.stop();this.ctx?.close().catch(()=>{});}
}
