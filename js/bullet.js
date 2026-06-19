export const BULLET_TYPE = {
    PLAYER: 'player',
    LASER: 'laser',
    ROCKET: 'rocket',
    PLASMA: 'plasma'
};

export class Bullet {
    constructor() {
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.width = 4; this.height = 12;
        this.damage = 1;
        this.active = false;
        this.type = BULLET_TYPE.PLAYER;
        this.color = '#00ff00';
        this.life = 0;
        this.trail = [];
    }

    reset(x, y, vx, vy, damage, type) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.damage = damage;
        this.type = type;
        this.active = true;
        this.life = 0;
        this.trail = [];
        switch (type) {
            case BULLET_TYPE.LASER:
                this.width = 3; this.height = 30;
                this.color = '#ff00ff';
                break;
            case BULLET_TYPE.ROCKET:
                this.width = 6; this.height = 14;
                this.color = '#ff6600';
                break;
            case BULLET_TYPE.PLASMA:
                this.width = 8; this.height = 8;
                this.color = '#00ffff';
                break;
            default:
                this.width = 4; this.height = 12;
                this.color = '#00ff00';
        }
    }

    update(dt) {
        if (!this.active) return;
        this.life += dt;
        this.trail.push({ x: this.x, y: this.y, life: 0.1 });
        if (this.trail.length > 5) this.trail.shift();
        for (const t of this.trail) t.life -= dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.type === BULLET_TYPE.ROCKET && this.life > 0.5) {
            this.vy -= 400 * dt;
        }

        if (this.y < -30 || this.y > 830 || this.x < -30 || this.x > 630 || this.life > 3) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        for (const t of this.trail) {
            if (t.life > 0) {
                ctx.globalAlpha = t.life * 3;
                ctx.fillStyle = this.color;
                ctx.fillRect(t.x - this.width / 4, t.y, this.width / 2, 4);
            }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;

        if (this.type === BULLET_TYPE.LASER) {
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x - 1, this.y - this.height / 2, 2, this.height);
        } else if (this.type === BULLET_TYPE.ROCKET) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.height / 2);
            ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === BULLET_TYPE.PLASMA) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
    }
}

export class BulletPool {
    constructor(maxSize = 200) {
        this.pool = [];
        for (let i = 0; i < maxSize; i++) this.pool.push(new Bullet());
    }

    get(x, y, vx, vy, damage, type) {
        for (const b of this.pool) {
            if (!b.active) { b.reset(x, y, vx, vy, damage, type); return b; }
        }
        return null;
    }

    update(dt) { for (const b of this.pool) if (b.active) b.update(dt); }
    draw(ctx) { for (const b of this.pool) if (b.active) b.draw(ctx); }
    getActive() { return this.pool.filter(b => b.active); }
    releaseAll() { for (const b of this.pool) b.active = false; }
}
