import { assetLoader } from './assetLoader.js';

export const EGG_TYPE = {
    NORMAL: 'normal',
    EXPLOSIVE: 'explosive',
    SPLIT: 'split',
    FAST: 'fast',
    HOMING: 'homing'
};

export class Egg {
    constructor() {
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.width = 8; this.height = 10;
        this.active = false;
        this.type = EGG_TYPE.NORMAL;
        this.life = 0;
        this.damage = 1;
        this.homingStrength = 0;
        this.targetX = 0; this.targetY = 0;
        this.splitDone = false;
        this.color = '#ffcc00';
        this.wobble = 0;
    }

    reset(x, y, vx, vy, type = EGG_TYPE.NORMAL) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.active = true;
        this.type = type;
        this.life = 0;
        this.splitDone = false;
        this.wobble = Math.random() * Math.PI * 2;
        switch (type) {
            case EGG_TYPE.NORMAL:
                this.width = 8; this.height = 10;
                this.color = '#ffcc00'; this.damage = 1;
                break;
            case EGG_TYPE.EXPLOSIVE:
                this.width = 10; this.height = 12;
                this.color = '#ff4400'; this.damage = 2;
                break;
            case EGG_TYPE.SPLIT:
                this.width = 8; this.height = 10;
                this.color = '#44ff00'; this.damage = 1;
                break;
            case EGG_TYPE.FAST:
                this.width = 6; this.height = 8;
                this.color = '#ff00ff'; this.damage = 1;
                break;
            case EGG_TYPE.HOMING:
                this.width = 10; this.height = 12;
                this.color = '#00ffff'; this.damage = 1;
                this.homingStrength = 150;
                break;
        }
    }

    update(dt, playerX, playerY) {
        if (!this.active) return;
        this.life += dt;
        this.wobble += dt * 8;

        if (this.type === EGG_TYPE.HOMING && this.life > 0.3) {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.vx += (dx / dist) * this.homingStrength * dt;
                this.vy += (dy / dist) * this.homingStrength * dt;
            }
        }

        if (this.type === EGG_TYPE.FAST) {
            const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (spd < 400) {
                const nx = this.vx / (spd || 1);
                const ny = this.vy / (spd || 1);
                this.vx = nx * 400;
                this.vy = ny * 400;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.y > 830 || this.y < -30 || this.x < -30 || this.x > 630 || this.life > 8) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.wobble) * 0.15);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === EGG_TYPE.EXPLOSIVE) {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(0, -1, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === EGG_TYPE.HOMING) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
    }
}

export class EggPool {
    constructor(maxSize = 300) {
        this.pool = [];
        for (let i = 0; i < maxSize; i++) this.pool.push(new Egg());
    }

    get(x, y, vx, vy, type) {
        for (const e of this.pool) {
            if (!e.active) { e.reset(x, y, vx, vy, type); return e; }
        }
        return null;
    }

    update(dt, playerX, playerY) {
        for (const e of this.pool) if (e.active) e.update(dt, playerX, playerY);
    }

    draw(ctx) { for (const e of this.pool) if (e.active) e.draw(ctx); }
    getActive() { return this.pool.filter(e => e.active); }
    releaseAll() { for (const e of this.pool) e.active = false; }
}
