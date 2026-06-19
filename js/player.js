import { input } from './input.js';
import { BULLET_TYPE } from './bullet.js';
import { assetLoader } from './assetLoader.js';

export const WEAPON_TYPE = {
    NORMAL: 'normal',
    DOUBLE: 'double',
    TRIPLE: 'triple',
    SPREAD: 'spread',
    LASER: 'laser',
    ROCKET: 'rocket',
    PLASMA: 'plasma'
};

const HEAT_TAP = {
    [WEAPON_TYPE.NORMAL]: 1.5,
    [WEAPON_TYPE.DOUBLE]: 2,
    [WEAPON_TYPE.TRIPLE]: 2,
    [WEAPON_TYPE.SPREAD]: 2.5,
    [WEAPON_TYPE.LASER]: 3,
    [WEAPON_TYPE.ROCKET]: 3.5,
    [WEAPON_TYPE.PLASMA]: 2.5
};

const HEAT_HOLD = {
    [WEAPON_TYPE.NORMAL]: 3,
    [WEAPON_TYPE.DOUBLE]: 4,
    [WEAPON_TYPE.TRIPLE]: 4,
    [WEAPON_TYPE.SPREAD]: 5,
    [WEAPON_TYPE.LASER]: 6,
    [WEAPON_TYPE.ROCKET]: 7,
    [WEAPON_TYPE.PLASMA]: 5
};

const OVERHEAT_COOLDOWN = 1.5;
const HEAT_DECAY_RATE = 25;
const MAX_HEAT = 150;
const OVERHEAT_THRESHOLD = 130;
const HOLD_FIRE_RATE = 0.08;

export class Player {
    constructor(canvasWidth, canvasHeight, bulletPool, particlePool) {
        this.cw = canvasWidth;
        this.ch = canvasHeight;
        this.bulletPool = bulletPool;
        this.particlePool = particlePool;

        this.width = 36; this.height = 36;
        this.x = canvasWidth / 2;
        this.y = canvasHeight - 100;
        this.speed = 350;
        this.health = 5; this.maxHealth = 5;
        this.lives = 3;

        this.weapon = WEAPON_TYPE.NORMAL;
        this.weaponLevel = 1;
        this.fireRate = 0.15;
        this.fireTimer = 0;
        this.damageLevel = 1;
        this.baseDamage = 1;

        this.shieldActive = false;
        this.shieldHits = 0;
        this.magnetActive = false;
        this.magnetTimer = 0;

        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.flashTimer = 0;

        this.alive = true;
        this.respawnTimer = 0;
        this.bombCount = 1;

        this.tilt = 0;

        this.heat = 0;
        this.overheated = false;
        this.overheatTimer = 0;
        this.heatWarning = false;
        this.overheatFlash = 0;
    }

    reset() {
        this.x = this.cw / 2;
        this.y = this.ch - 100;
        this.health = this.maxHealth;
        this.lives = 3;
        this.weapon = WEAPON_TYPE.NORMAL;
        this.weaponLevel = 1;
        this.fireRate = 0.15;
        this.fireTimer = 0;
        this.damageLevel = 1;
        this.shieldActive = false;
        this.shieldHits = 0;
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.flashTimer = 0;
        this.alive = true;
        this.respawnTimer = 0;
        this.bombCount = 1;
        this.tilt = 0;
        this.heat = 0;
        this.overheated = false;
        this.overheatTimer = 0;
        this.heatWarning = false;
        this.overheatFlash = 0;
    }

    respawn() {
        this.x = this.cw / 2;
        this.y = this.ch - 100;
        this.health = this.maxHealth;
        this.invulnerable = true;
        this.invulnerableTimer = 2.5;
        this.alive = true;
        this.respawnTimer = 0;
        this.heat = 0;
        this.overheated = false;
        this.overheatTimer = 0;
    }

    update(dt) {
        if (!this.alive) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0 && this.lives > 0) this.respawn();
            return;
        }

        if (this.invulnerable) {
            this.invulnerableTimer -= dt;
            if (this.invulnerableTimer <= 0) this.invulnerable = false;
        }
        if (this.flashTimer > 0) this.flashTimer -= dt;
        if (this.overheatFlash > 0) this.overheatFlash -= dt;
        if (this.magnetActive) {
            this.magnetTimer -= dt;
            if (this.magnetTimer <= 0) this.magnetActive = false;
        }

        if (this.overheated) {
            this.overheatTimer -= dt;
            this.heat = Math.max(0, this.heat - HEAT_DECAY_RATE * 1.5 * dt);
            if (this.overheatTimer <= 0) {
                this.overheated = false;
                this.heat = 0;
            }
        } else {
            if (!input.isShooting() || this.fireTimer > 0) {
                this.heat = Math.max(0, this.heat - HEAT_DECAY_RATE * dt);
            }
        }

        this.heatWarning = this.heat >= OVERHEAT_THRESHOLD && !this.overheated;

        let moveX = 0, moveY = 0;

        if (input.isLeft()) moveX -= 1;
        if (input.isRight()) moveX += 1;
        if (input.isUp()) moveY -= 1;
        if (input.isDown()) moveY += 1;

        if (input.touchMove.active) {
            const dx = input.touchMove.targetX - this.x;
            const dy = input.touchMove.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                moveX = dx / dist;
                moveY = dy / dist;
                const speedMult = Math.min(1, dist / 50);
                moveX *= speedMult;
                moveY *= speedMult;
            }
        } else if (input.mouse.active) {
            const dx = input.mouse.x - this.x;
            const dy = input.mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                moveX = dx / dist;
                moveY = dy / dist;
                const speedMult = Math.min(1, dist / 40);
                moveX *= speedMult;
                moveY *= speedMult;
            }
        }

        if (moveX !== 0 && moveY !== 0) {
            const len = Math.sqrt(moveX * moveX + moveY * moveY);
            if (len > 1) { moveX /= len; moveY /= len; }
        }

        const isTouchOrMouse = input.touchMove.active || input.mouse.active;
        const moveSpeed = isTouchOrMouse ? this.speed * 1.5 : this.speed;

        this.x += moveX * moveSpeed * dt;
        this.y += moveY * moveSpeed * dt;

        this.tilt += (moveX * 0.3 - this.tilt) * 8 * dt;

        this.x = Math.max(this.width / 2, Math.min(this.cw - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(this.ch - this.height / 2, this.y));

        this.fireTimer -= dt;

        if (input.isShootJustPressed() && !this.overheated) {
            this.shoot(false);
            this.fireTimer = this.fireRate;
        } else if (input.isHolding && input.isShooting() && this.fireTimer <= 0 && !this.overheated) {
            this.shoot(true);
            this.fireTimer = HOLD_FIRE_RATE;
        } else if (!input.isShooting() && !input.touchMove.active) {
            this.shootRequested = false;
        }

        if (this.overheated && Math.random() < 0.3) {
            this.particlePool.emit(this.x + (Math.random() - 0.5) * 20, this.y - this.height / 2, 1, {
                speed: 40, life: 0.3, color: '#ff4400', size: 3, gravity: -30
            });
        }
    }

    shoot(isHold) {
        const dmg = this.baseDamage * this.damageLevel;
        const heatTable = isHold ? HEAT_HOLD : HEAT_TAP;
        const heatIncrease = heatTable[this.weapon] || 3;

        this.heat += heatIncrease;

        if (this.heat >= MAX_HEAT) {
            this.overheated = true;
            this.overheatTimer = OVERHEAT_COOLDOWN;
            this.overheatFlash = 0.5;
            assetLoader.playHit();
            return;
        }

        assetLoader.playShoot();

        switch (this.weapon) {
            case WEAPON_TYPE.NORMAL:
                this.bulletPool.get(this.x, this.y - this.height / 2, 0, -450, dmg, BULLET_TYPE.PLAYER);
                break;
            case WEAPON_TYPE.DOUBLE:
                this.bulletPool.get(this.x - 7, this.y - this.height / 2, 0, -450, dmg, BULLET_TYPE.PLAYER);
                this.bulletPool.get(this.x + 7, this.y - this.height / 2, 0, -450, dmg, BULLET_TYPE.PLAYER);
                break;
            case WEAPON_TYPE.TRIPLE:
                this.bulletPool.get(this.x, this.y - this.height / 2, 0, -450, dmg, BULLET_TYPE.PLAYER);
                this.bulletPool.get(this.x - 10, this.y - this.height / 2 + 5, -30, -430, dmg, BULLET_TYPE.PLAYER);
                this.bulletPool.get(this.x + 10, this.y - this.height / 2 + 5, 30, -430, dmg, BULLET_TYPE.PLAYER);
                break;
            case WEAPON_TYPE.SPREAD:
                for (let i = -2; i <= 2; i++) {
                    const angle = -Math.PI / 2 + i * 0.2;
                    this.bulletPool.get(this.x, this.y - this.height / 2, Math.cos(angle) * 380, Math.sin(angle) * 380, dmg, BULLET_TYPE.PLAYER);
                }
                break;
            case WEAPON_TYPE.LASER:
                assetLoader.playLaser();
                this.bulletPool.get(this.x, this.y - this.height / 2, 0, -600, dmg * 1.5, BULLET_TYPE.LASER);
                break;
            case WEAPON_TYPE.ROCKET:
                assetLoader.playRocket();
                this.bulletPool.get(this.x, this.y - this.height / 2, 0, -300, dmg * 2, BULLET_TYPE.ROCKET);
                break;
            case WEAPON_TYPE.PLASMA:
                this.bulletPool.get(this.x - 12, this.y, -15, -380, dmg, BULLET_TYPE.PLASMA);
                this.bulletPool.get(this.x + 12, this.y, 15, -380, dmg, BULLET_TYPE.PLASMA);
                this.bulletPool.get(this.x, this.y - this.height / 2, 0, -400, dmg, BULLET_TYPE.PLASMA);
                break;
        }
    }

    useBomb() {
        if (this.bombCount <= 0) return false;
        this.bombCount--;
        assetLoader.playBomb();
        return true;
    }

    takeDamage(amount) {
        if (this.invulnerable || !this.alive) return false;

        if (this.shieldActive) {
            this.shieldHits -= amount;
            if (this.shieldHits <= 0) { this.shieldActive = false; this.shieldHits = 0; }
            this.flashTimer = 0.1;
            assetLoader.playShieldHit();
            return false;
        }

        this.health -= amount;
        this.flashTimer = 0.15;
        this.invulnerable = true;
        this.invulnerableTimer = 1.5;
        assetLoader.playHit();
        this.particlePool.emitFlash(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        if (this.health <= 0) { this.health = 0; this.die(); return true; }
        return false;
    }

    die() {
        this.alive = false;
        this.lives--;
        this.respawnTimer = 1.5;
        this.particlePool.emitExplosion(this.x, this.y, 1.5);
        assetLoader.playExplosion();
    }

    draw(ctx) {
        if (!this.alive) return;
        if (this.invulnerable && Math.floor(this.invulnerableTimer * 10) % 2 === 0) return;

        ctx.save();

        if (this.overheatFlash > 0) {
            ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.02) * 0.3;
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (this.flashTimer > 0) ctx.globalAlpha = 0.6;

        ctx.translate(this.x, this.y);
        ctx.rotate(this.tilt);

        ctx.shadowBlur = 12;
        ctx.shadowColor = '#4488ff';

        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.lineTo(-this.width / 4, this.height / 3);
        ctx.lineTo(this.width / 4, this.height / 3);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        gradient.addColorStop(0, '#66aaff');
        gradient.addColorStop(0.5, '#3366dd');
        gradient.addColorStop(1, '#2244aa');
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width / 3, -this.height / 4, this.width / 3 * 2, this.height / 2);

        ctx.fillStyle = '#88ccff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#88ccff';
        ctx.beginPath();
        ctx.arc(0, -this.height / 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ff6633';
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ff4400';
        ctx.fillRect(-2, this.height / 2 - 2, 4, 8);
        ctx.fillRect(-6, this.height / 2, 3, 4);
        ctx.fillRect(4, this.height / 2, 3, 4);
        ctx.shadowBlur = 0;

        if (this.heat > 30) {
            const heatAlpha = (this.heat - 30) / 70;
            ctx.globalAlpha = heatAlpha * 0.4;
            ctx.fillStyle = this.overheated ? '#ff0000' : '#ff6600';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.shieldActive) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.008) * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 12, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.magnetActive) {
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
    }

    applyPowerup(type) {
        switch (type) {
            case 'multi_shot':
                const weapons = [WEAPON_TYPE.DOUBLE, WEAPON_TYPE.TRIPLE, WEAPON_TYPE.SPREAD, WEAPON_TYPE.PLASMA];
                const idx = weapons.indexOf(this.weapon);
                if (idx < weapons.length - 1) this.weapon = weapons[idx + 1];
                break;
            case 'fire_rate':
                this.fireRate = Math.max(0.04, this.fireRate - 0.015);
                break;
            case 'shield':
                this.shieldActive = true;
                this.shieldHits = 4;
                break;
            case 'damage':
                this.damageLevel = Math.min(4, this.damageLevel + 1);
                break;
            case 'extra_life':
                this.lives = Math.min(5, this.lives + 1);
                break;
            case 'magnet':
                this.magnetActive = true;
                this.magnetTimer = 15;
                break;
            case 'bomb':
                this.bombCount = Math.min(3, this.bombCount + 1);
                break;
            case 'heal':
                this.health = Math.min(this.maxHealth, this.health + 2);
                break;
        }
    }

    getHeatPercent() { return this.heat / MAX_HEAT; }
    isOverheated() { return this.overheated; }
    getOverheatTimer() { return this.overheatTimer; }
}
