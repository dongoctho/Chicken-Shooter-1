export class AssetLoader {
    constructor() {
        this.ctx = null;
        this.audioCtx = null;
        this.masterGain = null;
    }

    init() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioCtx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    _osc(type, freq, dur, vol = 0.15) {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t);
        osc.stop(t + dur);
    }

    playShoot() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    playLaser() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    playRocket() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const bufSize = this.audioCtx.sampleRate * 0.2;
        const buf = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
        const src = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        src.buffer = buf;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        src.start(t);
    }

    playExplosion() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const bufSize = this.audioCtx.sampleRate * 0.3;
        const buf = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 2);
        const src = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        src.buffer = buf;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        src.start(t);
    }

    playBigExplosion() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const bufSize = this.audioCtx.sampleRate * 0.8;
        const buf = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
        const src = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        src.buffer = buf;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(30, t + 0.8);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        src.start(t);
    }

    playPowerup() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        [523, 659, 784].forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t + i * 0.06);
            gain.gain.setValueAtTime(0.12, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.12);
            osc.start(t + i * 0.06);
            osc.stop(t + i * 0.06 + 0.12);
        });
    }

    playHit() {
        this._osc('triangle', 120, 0.1, 0.2);
    }

    playShieldHit() {
        this._osc('sine', 400, 0.15, 0.15);
    }

    playBossWarning() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'sawtooth';
            const st = t + i * 0.35;
            osc.frequency.setValueAtTime(80, st);
            osc.frequency.linearRampToValueAtTime(200, st + 0.175);
            osc.frequency.linearRampToValueAtTime(80, st + 0.35);
            gain.gain.setValueAtTime(0.12, st);
            gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
            osc.start(st);
            osc.stop(st + 0.35);
        }
    }

    playBossDeath() {
        for (let i = 0; i < 6; i++) setTimeout(() => this.playBigExplosion(), i * 120);
    }

    playCollect() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.setValueAtTime(900, t + 0.04);
        osc.frequency.setValueAtTime(1200, t + 0.08);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    playBomb() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        const bufSize = this.audioCtx.sampleRate * 1.5;
        const buf = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.5);
        const src = this.audioCtx.createBufferSource();
        const gain = this.audioCtx.createGain();
        src.buffer = buf;
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        src.connect(gain);
        gain.connect(this.masterGain);
        src.start(t);
    }

    playLifeUp() {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t + i * 0.08);
            gain.gain.setValueAtTime(0.12, t + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
            osc.start(t + i * 0.08);
            osc.stop(t + i * 0.08 + 0.12);
        });
    }

    playEggShoot() {
        this._osc('sine', 300, 0.08, 0.08);
    }
}

export const assetLoader = new AssetLoader();
