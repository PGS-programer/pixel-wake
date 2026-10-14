import { getSettings } from './preferences.js';

// Local synthesized sound: no downloads and no playback before a user gesture.
class ArcadeAudio {
    constructor() { this.context = null; this.voices = 0; this.last = {}; }
    unlock() {
        try {
            const Context = window.AudioContext || window.webkitAudioContext;
            if (!Context) return;
            this.context ??= new Context();
            if (this.context.state === 'suspended') this.context.resume().catch(() => {});
        } catch { /* Audio is optional. */ }
    }
    play(kind, pitch = 0) {
        const settings = getSettings();
        const ctx = this.context;
        if (!ctx || ctx.state !== 'running' || settings.muted || settings.volume === 0 || this.voices > 10) return;
        if (ctx.currentTime - (this.last[kind] ?? -10) < 0.065) return;
        this.last[kind] = ctx.currentTime;
        const notes = {
            tap: [440], coin: [880, 1320], near: [660 + Math.min(pitch, 10) * 55, 990 + Math.min(pitch, 10) * 55],
            level: [440, 554, 660], crash: [120, 65, 40], reward: [523, 659, 784, 1046], start: [330, 440, 660]
        }[kind] || [440];
        notes.forEach((hz, i) => {
            const start = ctx.currentTime + i * 0.075;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = kind === 'crash' ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(hz, start);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(settings.volume * 0.11, start + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
            osc.connect(gain); gain.connect(ctx.destination);
            this.voices++;
            osc.onended = () => { osc.disconnect(); gain.disconnect(); this.voices--; };
            osc.start(start); osc.stop(start + 0.18);
        });
    }
    suspend() { this.context?.suspend().catch(() => {}); }
}
export const audio = new ArcadeAudio();
