export class Particle {
    constructor() {
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.life = 0; this.maxLife = 0;
        this.color = '#fff'; this.size = 2;
        this.active = false;
        this.gravity = 0; this.friction = 0.98;
        this.type = 'circle';
    }

    reset(x, y, vx, vy, life, color, size, gravity = 0, friction = 0.98, type = 'circle') {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.color = color; this.size = size;
        this.active = true;
        this.gravity = gravity; this.friction = friction;
        this.type = type;
    }

    update(dt) {
        if (!this.active) return;
        this.life -= dt;
        if (this.life <= 0) { this.active = false; return; }
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        if (!this.active) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        if (this.type === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
        ctx.restore();
    }
}

export class ParticlePool {
    constructor(maxSize = 500) {
        this.pool = [];
        for (let i = 0; i < maxSize; i++) this.pool.push(new Particle());
    }

    get() {
        for (const p of this.pool) if (!p.active) return p;
        return null;
    }

    emit(x, y, count, config = {}) {
        const { speed = 150, life = 0.5, color = '#ff6600', size = 3, gravity = 0, friction = 0.98, spread = Math.PI * 2, type = 'circle' } = config;
        for (let i = 0; i < count; i++) {
            const p = this.get();
            if (!p) break;
            const angle = Math.random() * spread - spread / 2;
            const spd = speed * (0.5 + Math.random() * 0.5);
            p.reset(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, life * (0.5 + Math.random() * 0.5), color, size * (0.5 + Math.random() * 0.5), gravity, friction, type);
        }
    }

    emitExplosion(x, y, intensity = 1) {
        const colors = ['#ff5533', '#ff8844', '#ffcc33', '#ff3322', '#ffee55', '#ffffff', '#ffaa66'];
        for (let i = 0; i < 30 * intensity; i++) {
            this.emit(x, y, 1, {
                speed: 280 * intensity, life: 0.8, color: colors[i % colors.length],
                size: 3 + Math.random() * 4, gravity: 60, friction: 0.93
            });
        }
    }

    emitSparkle(x, y) {
        const colors = ['#ffff66', '#ff66ff', '#66ffff', '#ffffff', '#66ff66', '#ffaa88'];
        for (let i = 0; i < 15; i++) {
            this.emit(x, y, 1, { speed: 140, life: 0.6, color: colors[i % colors.length], size: 3, gravity: -50 });
        }
    }

    emitFlash(x, y, w, h) {
        for (let i = 0; i < 6; i++) {
            this.emit(x + Math.random() * w, y + Math.random() * h, 1, { speed: 40, life: 0.12, color: '#ffffff', size: 8 });
        }
    }

    emitBossExplosion(x, y) {
        const colors = ['#ff0000', '#ff4400', '#ff8800', '#ffcc00', '#ffffff', '#ff00ff'];
        for (let i = 0; i < 40; i++) {
            this.emit(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 60, 1, {
                speed: 350, life: 1.2, color: colors[i % colors.length], size: 4 + Math.random() * 6, gravity: 40, friction: 0.97
            });
        }
    }

    emitScreenBomb(w, h) {
        for (let i = 0; i < 80; i++) {
            this.emit(Math.random() * w, Math.random() * h, 1, {
                speed: 200, life: 1.5, color: '#ffffff', size: 5 + Math.random() * 5, gravity: 30
            });
        }
    }

    update(dt) { for (const p of this.pool) if (p.active) p.update(dt); }
    draw(ctx) { for (const p of this.pool) if (p.active) p.draw(ctx); }
    releaseAll() { for (const p of this.pool) p.active = false; }
}
