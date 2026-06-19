export class WaveManager {
    constructor() {
        this.wave = 0;
        this.maxWaves = 3;
        this.waveTimer = 0;
        this.bossWave = false;
    }

    reset() {
        this.wave = 0;
        this.waveTimer = 0;
        this.bossWave = false;
    }

    nextWave() {
        this.wave++;
        this.bossWave = this.wave > this.maxWaves;
        return this.wave;
    }

    isBossWave() {
        return this.bossWave;
    }

    getWave() {
        return this.wave;
    }

    getDifficulty() {
        return 1 + (this.wave - 1) * 0.12;
    }
}
