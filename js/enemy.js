import { FormationManager, FORMATION_TYPE } from './formationManager.js';

export const MOVEMENT_PATTERN = {
    LINEAR: 'linear',
    SINE: 'sine',
    ARC: 'arc',
    SPIRAL: 'spiral'
};

export class Enemy {
    constructor() {
        this.x = 0; this.y = 0;
        this.width = 28; this.height = 26;
        this.health = 1; this.maxHealth = 1;
        this.active = false;
        this.speed = 80;
        this.score = 100;
        this.movementPattern = MOVEMENT_PATTERN.LINEAR;
        this.moveDir = 1;
        this.sineTimer = 0;
        this.sineAmplitude = 30;
        this.sineFrequency = 2;
        this.arcStartX = 0; this.arcStartY = 0;
        this.arcTargetX = 0; this.arcTargetY = 0;
        this.arcProgress = 0; this.arcDuration = 2;
        this.spiralAngle = 0; this.spiralRadius = 0;
        this.formationX = 0; this.formationY = 0;
        this.inFormation = false;
        this.shootTimer = 0; this.shootInterval = 2;
        this.hitFlash = 0; this.wingTimer = 0;
        this.variant = 0;
        this.shootPattern = 'single';
        this.lowHealthMode = false;
        this.enemyType = 'normal';
    }

    reset(x, y, health, pattern, variant = 0, enemyType = 'normal') {
        this.x = x; this.y = y;
        this.health = health; this.maxHealth = health;
        this.active = true;
        this.movementPattern = pattern;
        this.variant = variant;
        this.enemyType = enemyType;
        this.moveDir = Math.random() > 0.5 ? 1 : -1;
        this.sineTimer = 0;
        this.shootTimer = Math.random() * this.shootInterval + 1;
        this.hitFlash = 0; this.wingTimer = 0;
        this.inFormation = false;
        this.lowHealthMode = false;
        this.spiralAngle = 0;

        this.score = 100 + (health - 1) * 75;

        if (enemyType === 'tank') {
            this.score = 200 + (health - 1) * 100;
            this.width = 32; this.height = 30;
        } else if (enemyType === 'fast') {
            this.score = 150;
            this.width = 24; this.height = 22;
        } else {
            this.width = 28; this.height = 26;
        }

        if (pattern === MOVEMENT_PATTERN.ARC) {
            this.arcStartX = x; this.arcStartY = y;
            this.arcTargetX = 80 + Math.random() * 440;
            this.arcTargetY = 60 + Math.random() * 100;
            this.arcProgress = 0;
        }
        if (pattern === MOVEMENT_PATTERN.SPIRAL) {
            this.spiralRadius = 30 + Math.random() * 40;
            this.spiralAngle = Math.random() * Math.PI * 2;
        }

        const patterns = ['single', 'single', 'fan', 'aimed', 'burst', 'spiral'];
        this.shootPattern = patterns[Math.floor(Math.random() * patterns.length)];
    }

    setFormation(x, y) {
        this.formationX = x; this.formationY = y;
        this.inFormation = true;
    }

    update(dt, playerX, playerY) {
        if (!this.active) return;
        this.sineTimer += dt;
        this.wingTimer += dt * 10;
        this.hitFlash = Math.max(0, this.hitFlash - dt);
        this.lowHealthMode = this.health <= Math.ceil(this.maxHealth * 0.3) && this.maxHealth > 2;

        const minX = this.width / 2 + 5;
        const maxX = 600 - this.width / 2 - 5;
        const minY = this.height / 2 + 30;
        const maxY = 750;

        switch (this.movementPattern) {
            case MOVEMENT_PATTERN.LINEAR:
                this.x += this.speed * this.moveDir * dt;
                if (this.x >= maxX) { this.x = maxX; this.moveDir = -1; }
                else if (this.x <= minX) { this.x = minX; this.moveDir = 1; }
                break;
            case MOVEMENT_PATTERN.SINE:
                this.x += this.speed * this.moveDir * dt;
                if (this.x >= maxX) { this.x = maxX; this.moveDir = -1; }
                else if (this.x <= minX) { this.x = minX; this.moveDir = 1; }
                this.y = this.formationY + Math.sin(this.sineTimer * this.sineFrequency) * this.sineAmplitude;
                this.y = Math.max(minY, Math.min(maxY, this.y));
                break;
            case MOVEMENT_PATTERN.ARC:
                this.arcProgress += dt / this.arcDuration;
                if (this.arcProgress >= 1) { this.arcProgress = 1; this.inFormation = true; }
                const t = this.arcProgress;
                const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                this.x = this.arcStartX + (this.arcTargetX - this.arcStartX) * ease;
                this.y = this.arcStartY + (this.arcTargetY - this.arcStartY) * ease;
                this.x = Math.max(minX, Math.min(maxX, this.x));
                this.y = Math.max(minY, Math.min(maxY, this.y));
                break;
            case MOVEMENT_PATTERN.SPIRAL:
                this.spiralAngle += dt * 3;
                this.x = this.formationX + Math.cos(this.spiralAngle) * this.spiralRadius;
                this.y = this.formationY + Math.sin(this.spiralAngle) * this.spiralRadius * 0.5;
                this.x = Math.max(minX, Math.min(maxX, this.x));
                this.y = Math.max(minY, Math.min(maxY, this.y));
                break;
        }

        if (this.inFormation && this.movementPattern !== MOVEMENT_PATTERN.ARC && this.movementPattern !== MOVEMENT_PATTERN.SPIRAL) {
            this.x += (this.formationX - this.x) * 2 * dt;
            this.y += (this.formationY - this.y) * 2 * dt;
            this.x = Math.max(minX, Math.min(maxX, this.x));
            this.y = Math.max(minY, Math.min(maxY, this.y));
        }

        this.shootTimer -= dt;
    }

    shouldShoot() {
        if (this.shootTimer > 0 || !this.inFormation) return null;
        this.shootTimer = this.shootInterval * (0.8 + Math.random() * 0.4);
        return this.shootPattern;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 0.12;
        if (this.health <= 0) { this.active = false; return true; }
        return false;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        let baseColor;
        if (this.enemyType === 'tank') {
            baseColor = '#993399';
        } else if (this.enemyType === 'fast') {
            baseColor = '#33cc33';
        } else {
            const colors = ['#ff6633', '#ff9933', '#cc3333', '#ff3366', '#ffaa00', '#ff5577'];
            baseColor = colors[this.variant % colors.length];
        }

        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : baseColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 2, -3);
        ctx.lineTo(this.width / 2 + 8, 0);
        ctx.lineTo(this.width / 2 - 2, 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-3, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        const wingOff = Math.sin(this.wingTimer) * 3;
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#cc4400';
        ctx.beginPath();
        ctx.ellipse(-this.width / 2 - 5, wingOff, 8, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.width / 2 - 5, -wingOff, 8, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-4, this.height / 2 - 2);
        ctx.lineTo(-2, this.height / 2 + 4);
        ctx.lineTo(0, this.height / 2 - 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(2, this.height / 2 - 2);
        ctx.lineTo(4, this.height / 2 + 4);
        ctx.lineTo(6, this.height / 2 - 2);
        ctx.closePath();
        ctx.fill();

        if (this.enemyType === 'tank') {
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2 + 3, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.maxHealth > 1) {
            const barW = this.width;
            const barH = 4;
            const barY = -this.height / 2 - 8;
            ctx.fillStyle = '#333';
            ctx.fillRect(-barW / 2, barY, barW, barH);
            const hpPct = this.health / this.maxHealth;
            ctx.fillStyle = hpPct > 0.5 ? '#00ff00' : hpPct > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(-barW / 2, barY, barW * hpPct, barH);
        }

        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.width / 2, y: this.y - this.height / 2, width: this.width, height: this.height };
    }
}

export class EnemyManager {
    constructor(canvasWidth, canvasHeight, eggPool) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.eggPool = eggPool;
        this.enemies = [];
        this.maxEnemies = 50;
        this.formationManager = new FormationManager(canvasWidth, canvasHeight);
        this.wave = 0;
        this.enemiesPerWave = 5;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 0.5;
        this.playerRef = null;
        this.difficultyMultiplier = 1;
    }

    setPlayer(player) { this.playerRef = player; }

    reset() {
        this.enemies = [];
        this.wave = 0;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
        this.formationManager.reset();
        this.difficultyMultiplier = 1;
    }

    startWave() {
        this.wave++;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.enemiesPerWave = 5 + this.wave * 2;
        this.spawnTimer = 0;
        this.difficultyMultiplier = 1 + (this.wave - 1) * 0.18;
        this.formationManager.transitionTimer = this.formationManager.transitionInterval;
    }

    spawnEnemy() {
        if (this.enemiesSpawned >= this.enemiesPerWave) return;
        const enemy = this.getEnemy();
        if (!enemy) return;

        const positions = this.formationManager.getPositions(this.enemiesPerWave);
        const pos = positions[this.enemiesSpawned] || { x: 300, y: 100 };

        const patterns = Object.values(MOVEMENT_PATTERN);
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        const variant = Math.floor(Math.random() * 6);

        let health;
        let enemyType = 'normal';

        const typeRoll = Math.random();
        if (typeRoll < 0.15 && this.wave >= 2) {
            enemyType = 'tank';
            health = 4 + Math.floor(this.wave / 2);
        } else if (typeRoll < 0.3 && this.wave >= 3) {
            enemyType = 'fast';
            health = 1 + Math.floor(this.wave / 4);
        } else {
            health = 2 + Math.floor(this.wave / 2);
        }

        const startX = Math.random() > 0.5 ? -30 : this.canvasWidth + 30;
        enemy.reset(startX, 50 + Math.random() * 80, health, pattern, variant, enemyType);
        enemy.setFormation(pos.x, pos.y);
        enemy.speed = (60 + this.wave * 6) * this.difficultyMultiplier;
        enemy.shootInterval = Math.max(0.6, (2.5 - this.wave * 0.12) / this.difficultyMultiplier);

        this.enemiesSpawned++;
    }

    getEnemy() {
        for (const e of this.enemies) if (!e.active) return e;
        if (this.enemies.length < this.maxEnemies) {
            const e = new Enemy();
            this.enemies.push(e);
            return e;
        }
        return null;
    }

    isWaveComplete() {
        return this.enemiesSpawned >= this.enemiesPerWave && this.getActiveCount() === 0;
    }

    getActiveCount() { return this.enemies.filter(e => e.active).length; }

    update(dt) {
        this.formationManager.update(dt);
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.enemiesSpawned < this.enemiesPerWave) {
            this.spawnEnemy();
            this.spawnTimer = this.spawnInterval / this.difficultyMultiplier;
        }

        const px = this.playerRef ? this.playerRef.x : 300;
        const py = this.playerRef ? this.playerRef.y : 700;

        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(dt, px, py);
                const pattern = enemy.shouldShoot();
                if (pattern && this.playerRef) {
                    this.shootEgg(enemy, pattern, px, py);
                }
            }
        }
    }

    shootEgg(enemy, pattern, px, py) {
        const ex = enemy.x, ey = enemy.y + enemy.height / 2;
        const speed = (160 + this.wave * 12) * this.difficultyMultiplier;

        switch (pattern) {
            case 'single': {
                const dx = px - ex, dy = py - ey;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                this.eggPool.get(ex, ey, (dx / dist) * speed, (dy / dist) * speed, 'normal');
                break;
            }
            case 'fan': {
                for (let i = -2; i <= 2; i++) {
                    const angle = Math.atan2(py - ey, px - ex) + i * 0.25;
                    this.eggPool.get(ex, ey, Math.cos(angle) * speed, Math.sin(angle) * speed, 'normal');
                }
                break;
            }
            case 'aimed': {
                const dx = px - ex, dy = py - ey;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                this.eggPool.get(ex, ey, (dx / dist) * speed * 1.3, (dy / dist) * speed * 1.3, 'fast');
                break;
            }
            case 'burst': {
                for (let i = 0; i < 3; i++) {
                    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
                    this.eggPool.get(ex, ey, Math.cos(angle) * speed * 0.8, Math.sin(angle) * speed * 0.8, 'normal');
                }
                break;
            }
            case 'spiral': {
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2 + Date.now() * 0.002;
                    this.eggPool.get(ex, ey, Math.cos(angle) * speed * 0.7, Math.sin(angle) * speed * 0.7, 'normal');
                }
                break;
            }
        }

        if (enemy.lowHealthMode && Math.random() < 0.4) {
            for (let i = 0; i < 6; i++) {
                const angle = Math.PI / 2 + (i - 2.5) * 0.35;
                this.eggPool.get(ex, ey, Math.cos(angle) * speed * 0.7, Math.sin(angle) * speed * 0.7, 'normal');
            }
        }

        if (enemy.enemyType === 'tank' && Math.random() < 0.3) {
            this.eggPool.get(ex, ey, 0, speed * 0.9, 'explosive');
        }
    }

    draw(ctx) {
        for (const enemy of this.enemies) if (enemy.active) enemy.draw(ctx);
    }

    getActive() { return this.enemies.filter(e => e.active); }
    onEnemyKilled() { this.enemiesKilled++; }
}
