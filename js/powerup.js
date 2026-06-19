export const POWERUP_TYPE = {
    MULTI_SHOT: 'multi_shot',
    FIRE_RATE: 'fire_rate',
    SHIELD: 'shield',
    DAMAGE: 'damage',
    EXTRA_LIFE: 'extra_life',
    MAGNET: 'magnet',
    BOMB: 'bomb',
    HEAL: 'heal'
};

const POWERUP_COLORS = {
    [POWERUP_TYPE.MULTI_SHOT]: '#00ff00',
    [POWERUP_TYPE.FIRE_RATE]: '#ff6600',
    [POWERUP_TYPE.SHIELD]: '#00ccff',
    [POWERUP_TYPE.DAMAGE]: '#ff0000',
    [POWERUP_TYPE.EXTRA_LIFE]: '#ff00ff',
    [POWERUP_TYPE.MAGNET]: '#ffaa00',
    [POWERUP_TYPE.BOMB]: '#ff4444',
    [POWERUP_TYPE.HEAL]: '#00ff88'
};

const POWERUP_LABELS = {
    [POWERUP_TYPE.MULTI_SHOT]: 'M',
    [POWERUP_TYPE.FIRE_RATE]: 'F',
    [POWERUP_TYPE.SHIELD]: 'S',
    [POWERUP_TYPE.DAMAGE]: 'D',
    [POWERUP_TYPE.EXTRA_LIFE]: '+',
    [POWERUP_TYPE.MAGNET]: 'X',
    [POWERUP_TYPE.BOMB]: 'B',
    [POWERUP_TYPE.HEAL]: 'H'
};

export class Powerup {
    constructor() {
        this.x = 0; this.y = 0;
        this.width = 18; this.height = 18;
        this.type = POWERUP_TYPE.MULTI_SHOT;
        this.active = false;
        this.bobTimer = 0;
        this.vy = 60;
        this.magnetized = false;
    }

    reset(x, y, type) {
        this.x = x; this.y = y;
        this.type = type;
        this.active = true;
        this.bobTimer = Math.random() * Math.PI * 2;
        this.vy = 50 + Math.random() * 30;
        this.magnetized = false;
    }

    update(dt, playerX, playerY, magnetActive) {
        if (!this.active) return;
        this.bobTimer += dt * 4;

        if (magnetActive || this.magnetized) {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                this.magnetized = true;
                const speed = 400;
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
            } else {
                this.y += this.vy * dt;
            }
        } else {
            this.y += this.vy * dt;
        }

        this.x += Math.sin(this.bobTimer) * 25 * dt;

        if (this.y > 830) this.active = false;
    }

    draw(ctx) {
        if (!this.active) return;
        const color = POWERUP_COLORS[this.type];
        const label = POWERUP_LABELS[this.type];
        const bobY = this.y + Math.sin(this.bobTimer * 3) * 4;

        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8 + Math.sin(this.bobTimer * 5) * 0.2;
        ctx.fillRect(this.x - this.width / 2, bobY - this.height / 2, this.width, this.height);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, this.x, bobY);
        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
    }
}

export class PowerupManager {
    constructor() {
        this.powerups = [];
        this.maxPowerups = 15;
    }

    spawn(x, y) {
        if (this.powerups.length >= this.maxPowerups) return;
        const types = Object.values(POWERUP_TYPE);
        const weights = [3, 3, 2, 2, 1, 2, 1, 2];
        const total = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        let type = types[0];
        for (let i = 0; i < types.length; i++) {
            rand -= weights[i];
            if (rand <= 0) { type = types[i]; break; }
        }
        const p = new Powerup();
        p.reset(x, y, type);
        this.powerups.push(p);
    }

    spawnSpecific(x, y, type) {
        const p = new Powerup();
        p.reset(x, y, type);
        this.powerups.push(p);
    }

    update(dt, playerX, playerY, magnetActive) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update(dt, playerX, playerY, magnetActive);
            if (!this.powerups[i].active) this.powerups.splice(i, 1);
        }
    }

    draw(ctx) { for (const p of this.powerups) if (p.active) p.draw(ctx); }
    getActive() { return this.powerups.filter(p => p.active); }
    clear() { this.powerups = []; }
}
