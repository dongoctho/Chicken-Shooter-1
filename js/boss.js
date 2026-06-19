import { BULLET_TYPE } from './bullet.js';
import { EGG_TYPE } from './egg.js';
import { assetLoader } from './assetLoader.js';

export const BOSS_PHASE = { PHASE_1: 1, PHASE_2: 2, PHASE_3: 3, PHASE_4: 4 };

export class Boss {
    constructor(canvasWidth, canvasHeight, eggPool) {
        this.cw = canvasWidth;
        this.ch = canvasHeight;
        this.eggPool = eggPool;

        this.width = 140; this.height = 120;
        this.x = canvasWidth / 2;
        this.y = -150;
        this.health = 50; this.maxHealth = 50;
        this.active = false;
        this.phase = BOSS_PHASE.PHASE_1;
        this.speed = 100;
        this.targetX = canvasWidth / 2;
        this.moveTimer = 0;
        this.shootTimer = 0; this.shootInterval = 1.5;
        this.attackPattern = 0;
        this.entering = true;
        this.enterY = 90;
        this.hitFlash = 0;
        this.deathTimer = 0;
        this.dying = false;
        this.wingTimer = 0;
        this.warningTimer = 0;
        this.showWarning = false;
        this.spawnTimer = 0;
        this.spawnInterval = 8;
        this.laserActive = false;
        this.laserTimer = 0;
        this.laserWidth = 24;
        this.playerRef = null;

        this.shockwaveActive = false;
        this.shockwaveTimer = 0;
        this.shockwaveRadius = 0;
        this.shockwaveMaxRadius = 300;

        this.chargeActive = false;
        this.chargeTargetX = 0;
        this.chargeTargetY = 0;
        this.chargeSpeed = 400;

        this.shieldActive = false;
        this.shieldHits = 0;
        this.shieldMaxHits = 3;
        this.shieldBrokenThisPhase = false;

        this.specialAttackTimer = 0;
        this.rageMode = false;
    }

    setPlayer(p) { this.playerRef = p; }

    reset() {
        this.x = this.cw / 2;
        this.y = -150;
        this.health = this.maxHealth;
        this.active = true;
        this.phase = BOSS_PHASE.PHASE_1;
        this.speed = 100;
        this.targetX = this.cw / 2;
        this.moveTimer = 0;
        this.shootTimer = 2;
        this.shootInterval = 1.4;
        this.attackPattern = 0;
        this.entering = true;
        this.enterY = 90;
        this.hitFlash = 0;
        this.deathTimer = 0;
        this.dying = false;
        this.warningTimer = 3;
        this.showWarning = true;
        this.spawnTimer = this.spawnInterval;
        this.laserActive = false;
        this.laserTimer = 0;
        this.shockwaveActive = false;
        this.shockwaveRadius = 0;
        this.chargeActive = false;
        this.shieldActive = false;
        this.shieldHits = 0;
        this.specialAttackTimer = 5;
        this.rageMode = false;
    }

    update(dt, enemies) {
        if (!this.active) return;
        this.wingTimer += dt * 5;
        this.hitFlash = Math.max(0, this.hitFlash - dt);

        if (this.showWarning) {
            this.warningTimer -= dt;
            if (this.warningTimer <= 0) this.showWarning = false;
            return;
        }

        if (this.dying) {
            this.deathTimer -= dt;
            if (this.deathTimer <= 0) {
                this.active = false;
                this.dying = false;
                return;
            }
            if (Math.random() < 0.5) {
                this.x += (Math.random() - 0.5) * 40;
                this.y += (Math.random() - 0.5) * 20;
            }
            return;
        }

        if (this.entering) {
            this.y += (this.enterY - this.y) * 2 * dt;
            if (Math.abs(this.y - this.enterY) < 1) {
                this.y = this.enterY;
                this.entering = false;
                this.shieldActive = this.phase >= 2;
                this.shieldHits = this.shieldMaxHits;
            }
            return;
        }

        if (this.shockwaveActive) {
            this.shockwaveRadius += 350 * dt;
            if (this.shockwaveRadius >= this.shockwaveMaxRadius) {
                this.shockwaveActive = false;
                this.shockwaveRadius = 0;
            }
        }

        if (this.chargeActive) {
            const dx = this.chargeTargetX - this.x;
            const dy = this.chargeTargetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 20) {
                this.chargeActive = false;
                this.shockwaveActive = true;
                this.shockwaveRadius = 0;
            } else {
                this.x += (dx / dist) * this.chargeSpeed * dt;
                this.y += (dy / dist) * this.chargeSpeed * dt;
            }
            const bossMinX2 = this.width / 2 + 10;
            const bossMaxX2 = this.cw - this.width / 2 - 10;
            this.x = Math.max(bossMinX2, Math.min(bossMaxX2, this.x));
            this.y = Math.max(this.height / 2 + 10, Math.min(this.ch * 0.6, this.y));
            return;
        }

        this.moveTimer += dt;
        const moveInterval = this.phase >= 3 ? 1.2 : this.phase >= 2 ? 1.8 : 2.5;
        if (this.moveTimer > moveInterval) {
            this.moveTimer = 0;
            this.targetX = 80 + Math.random() * (this.cw - 160);
        }

        const dx = this.targetX - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), this.speed * dt);

        const bossMinX = this.width / 2 + 10;
        const bossMaxX = this.cw - this.width / 2 - 10;
        this.x = Math.max(bossMinX, Math.min(bossMaxX, this.x));
        this.y = Math.max(this.height / 2 + 10, Math.min(this.ch * 0.6, this.y));

        this.updatePhase();

        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            this.attack();
            this.shootTimer = this.shootInterval;
        }

        this.specialAttackTimer -= dt;
        if (this.specialAttackTimer <= 0) {
            this.specialAttack();
            this.specialAttackTimer = 6 - this.phase;
        }

        if (this.phase >= 3) {
            this.laserTimer += dt;
            if (this.laserTimer > (5 - this.phase * 0.5) && !this.laserActive) {
                this.laserActive = true;
                this.laserTimer = 0;
            }
            if (this.laserActive) {
                this.laserTimer += dt;
                if (this.laserTimer > 2.5) {
                    this.laserActive = false;
                    this.laserTimer = 0;
                }
            }
        }

        if (this.health / this.maxHealth < 0.2 && !this.rageMode) {
            this.rageMode = true;
            this.speed *= 1.3;
            this.shootInterval *= 0.7;
        }
    }

    updatePhase() {
        const hp = this.health / this.maxHealth;
        let newPhase;

        if (hp > 0.75) {
            newPhase = BOSS_PHASE.PHASE_1;
            this.speed = 100; this.shootInterval = 1.4;
        } else if (hp > 0.5) {
            newPhase = BOSS_PHASE.PHASE_2;
            this.speed = 140; this.shootInterval = 1.0;
        } else if (hp > 0.25) {
            newPhase = BOSS_PHASE.PHASE_3;
            this.speed = 180; this.shootInterval = 0.65;
        } else {
            newPhase = BOSS_PHASE.PHASE_4;
            this.speed = 220; this.shootInterval = 0.4;
        }

        if (newPhase !== this.phase) {
            this.phase = newPhase;
            this.shieldBrokenThisPhase = false;
            if (this.phase >= 2) {
                this.shieldActive = true;
                this.shieldHits = this.shieldMaxHits;
            }
        }
    }

    specialAttack() {
        const ex = this.x, ey = this.y + this.height / 2;
        switch (this.phase) {
            case BOSS_PHASE.PHASE_2:
                this.shockwaveActive = true;
                this.shockwaveRadius = 0;
                break;
            case BOSS_PHASE.PHASE_3:
                if (this.playerRef) {
                    this.chargeActive = true;
                    this.chargeTargetX = this.playerRef.x;
                    this.chargeTargetY = Math.min(this.playerRef.y - 50, this.ch / 2);
                }
                break;
            case BOSS_PHASE.PHASE_4:
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        if (!this.active || this.dying) return;
                        for (let j = 0; j < 16; j++) {
                            const a = (j / 16) * Math.PI * 2 + i * 0.3;
                            this.eggPool.get(this.x, this.y, Math.cos(a) * 200, Math.sin(a) * 200, EGG_TYPE.HOMING);
                        }
                    }, i * 400);
                }
                break;
        }
    }

    attack() {
        this.attackPattern = (this.attackPattern + 1) % 6;
        const speed = 230 + this.phase * 35;
        const ex = this.x, ey = this.y + this.height / 2;

        switch (this.phase) {
            case BOSS_PHASE.PHASE_1:
                this.singleShot(ex, ey, speed);
                if (this.attackPattern % 3 === 0) this.spreadShot(ex, ey, speed * 0.9);
                break;
            case BOSS_PHASE.PHASE_2:
                if (this.attackPattern % 2 === 0) this.spreadShot(ex, ey, speed);
                else this.circleShot(ex, ey, speed * 0.8);
                break;
            case BOSS_PHASE.PHASE_3:
                if (this.attackPattern === 0) this.circleShot(ex, ey, speed);
                else if (this.attackPattern === 1) this.spiralShot(ex, ey, speed);
                else if (this.attackPattern === 2) this.rainShot(ex, ey, speed);
                else this.spreadShot(ex, ey, speed);
                break;
            case BOSS_PHASE.PHASE_4:
                if (this.attackPattern === 0) this.circleShot(ex, ey, speed);
                else if (this.attackPattern === 1) this.spiralShot(ex, ey, speed);
                else if (this.attackPattern === 2) this.doubleCircleShot(ex, ey, speed);
                else if (this.attackPattern === 3) this.rainShot(ex, ey, speed);
                else this.aimedBurst(ex, ey, speed);
                break;
        }
    }

    singleShot(ex, ey, speed) {
        const px = this.playerRef?.x || this.cw / 2;
        const py = this.playerRef?.y || this.ch;
        const dx = px - ex, dy = py - ey;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        this.eggPool.get(ex, ey, (dx / d) * speed, (dy / d) * speed, EGG_TYPE.NORMAL);
    }

    spreadShot(ex, ey, speed) {
        const px = this.playerRef?.x || this.cw / 2;
        const py = this.playerRef?.y || this.ch;
        const baseAngle = Math.atan2(py - ey, px - ex);
        for (let i = -3; i <= 3; i++) {
            const a = baseAngle + i * 0.18;
            this.eggPool.get(ex, ey, Math.cos(a) * speed, Math.sin(a) * speed, EGG_TYPE.NORMAL);
        }
    }

    circleShot(ex, ey, speed) {
        const count = 14 + this.phase * 2;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            this.eggPool.get(ex, ey, Math.cos(a) * speed, Math.sin(a) * speed, EGG_TYPE.NORMAL);
        }
    }

    doubleCircleShot(ex, ey, speed) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            this.eggPool.get(ex, ey, Math.cos(a) * speed, Math.sin(a) * speed, EGG_TYPE.NORMAL);
            this.eggPool.get(ex, ey, Math.cos(a + 0.15) * speed * 0.8, Math.sin(a + 0.15) * speed * 0.8, EGG_TYPE.FAST);
        }
    }

    spiralShot(ex, ey, speed) {
        const count = 10;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + Date.now() * 0.004;
            this.eggPool.get(ex, ey, Math.cos(a) * speed * 0.8, Math.sin(a) * speed * 0.8, EGG_TYPE.HOMING);
        }
    }

    rainShot(ex, ey, speed) {
        for (let i = -5; i <= 5; i++) {
            this.eggPool.get(ex + i * 18, ey, i * 8, speed, EGG_TYPE.FAST);
        }
    }

    aimedBurst(ex, ey, speed) {
        const px = this.playerRef?.x || this.cw / 2;
        const py = this.playerRef?.y || this.ch;
        const dx = px - ex, dy = py - ey;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                if (!this.active || this.dying) return;
                const ndx = (this.playerRef?.x || this.cw / 2) - this.x;
                const ndy = (this.playerRef?.y || this.ch) - this.y;
                const nd = Math.sqrt(ndx * ndx + ndy * ndy) || 1;
                this.eggPool.get(this.x, this.y + this.height / 2, (ndx / nd) * speed * 1.2, (ndy / nd) * speed * 1.2, EGG_TYPE.HOMING);
            }, i * 150);
        }
    }

    spawnMinions(enemies) {
        const count = 2 + this.phase;
        for (let i = 0; i < count; i++) {
            const e = enemies.getEnemy();
            if (e) {
                e.reset(this.x + (Math.random() - 0.5) * 120, this.y + 40, 2 + this.phase, 'linear', Math.floor(Math.random() * 4), 'normal');
                e.setFormation(this.x + (Math.random() - 0.5) * 200, 100 + Math.random() * 80);
                e.speed = 90 + this.phase * 10;
                e.shootInterval = 1.8;
            }
        }
    }

    checkShockwaveHit(playerBounds) {
        if (!this.shockwaveActive || !this.active || this.dying) return false;
        const dx = playerBounds.x + playerBounds.width / 2 - this.x;
        const dy = playerBounds.y + playerBounds.height / 2 - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return Math.abs(dist - this.shockwaveRadius) < 30;
    }

    checkLaserHit(playerBounds) {
        if (!this.laserActive || !this.active || this.dying) return false;
        const laserX = this.x - this.laserWidth / 2;
        const laserY = this.y + this.height / 2;
        const laserH = this.ch - laserY;
        return (
            playerBounds.x < laserX + this.laserWidth &&
            playerBounds.x + playerBounds.width > laserX &&
            playerBounds.y < laserY + laserH &&
            playerBounds.y + playerBounds.height > laserY
        );
    }

    takeDamage(amount) {
        if (this.dying || !this.active) return false;

        if (this.shieldActive && this.shieldHits > 0) {
            this.shieldHits -= amount;
            this.hitFlash = 0.15;
            if (this.shieldHits <= 0) {
                this.shieldActive = false;
                this.shieldBrokenThisPhase = true;
                this.hitFlash = 0.5;
            }
            return false;
        }

        this.health -= amount;
        this.hitFlash = 0.12;
        if (this.health <= 0) { this.health = 0; this.die(); return true; }
        return false;
    }

    die() {
        this.dying = true;
        this.deathTimer = 2.5;
        assetLoader.playBossDeath();
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();

        if (this.showWarning) {
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 56px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('WARNING!', this.cw / 2, this.ch / 2 - 30);
            ctx.font = '26px monospace';
            ctx.fillText('BOSS INCOMING', this.cw / 2, this.ch / 2 + 30);
            ctx.restore();
            return;
        }

        if (this.laserActive) {
            const gradient = ctx.createLinearGradient(this.x, this.y + this.height / 2, this.x, this.ch);
            gradient.addColorStop(0, 'rgba(255, 0, 100, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 100, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 0, 100, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(this.x - this.laserWidth / 2, this.y + this.height / 2, this.laserWidth, this.ch);
            ctx.fillStyle = '#ff0066';
            ctx.fillRect(this.x - 4, this.y + this.height / 2, 8, this.ch);
        }

        if (this.shockwaveActive) {
            ctx.strokeStyle = `rgba(255, 100, 0, ${1 - this.shockwaveRadius / this.shockwaveMaxRadius})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.chargeActive) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.translate(this.x, this.y);

        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : (this.rageMode ? '#aa0000' : '#883388');
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.rageMode ? '#cc2222' : '#aa44aa';
        ctx.beginPath();
        ctx.ellipse(0, 5, this.width / 2 - 10, this.height / 2 - 15, 0, 0, Math.PI * 2);
        ctx.fill();

        const wingOff = Math.sin(this.wingTimer) * 7;
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : (this.rageMode ? '#880000' : '#662266');
        ctx.beginPath();
        ctx.ellipse(-this.width / 2 - 20, wingOff, 24, 12, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.width / 2 + 20, -wingOff, 24, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 5, -6);
        ctx.lineTo(this.width / 2 + 25, 0);
        ctx.lineTo(this.width / 2 - 5, 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(-24, -18, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(-26, -20, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(-27, -20, 2.5, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(14, -18, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(12, -20, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(11, -20, 2.5, 0, Math.PI * 2); ctx.fill();

        if (this.shieldActive && this.shieldHits > 0) {
            const shieldPct = this.shieldHits / this.shieldMaxHits;
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + shieldPct * 0.4})`;
            ctx.lineWidth = 2 + shieldPct * 2;
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.008) * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 0.15 + shieldPct * 0.15;
            ctx.fillStyle = '#00ffff';
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        const phaseColors = ['', '#00ff00', '#ffff00', '#ff8800', '#ff0000'];
        ctx.fillStyle = phaseColors[this.phase] || '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`P${this.phase}`, 0, 25);

        ctx.restore();
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        if (!this.active || this.showWarning) return;
        const bw = 340, bh = 18;
        const bx = (this.cw - bw) / 2, by = 16;
        ctx.fillStyle = '#222';
        ctx.fillRect(bx, by, bw, bh);
        const pct = this.health / this.maxHealth;
        const c = pct > 0.5 ? '#00ff00' : pct > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = c;
        ctx.fillRect(bx, by, bw * pct, bh);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        if (this.shieldActive && this.shieldHits > 0) {
            const shieldPct = this.shieldHits / this.shieldMaxHits;
            ctx.fillStyle = '#333';
            ctx.fillRect(bx, by + bh + 3, bw, 8);
            ctx.fillStyle = '#00ccff';
            ctx.fillRect(bx, by + bh + 3, bw * shieldPct, 8);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, by + bh + 3, bw, 8);
        }

        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        const shieldText = this.shieldActive && this.shieldHits > 0 ? ' [SHIELD]' : '';
        ctx.fillText(`BOSS - Phase ${this.phase}${this.rageMode ? ' [RAGE]' : ''}${shieldText}`, this.cw / 2, by + bh / 2 + 1);
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
    }
}
