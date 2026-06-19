import { Player, WEAPON_TYPE } from './player.js';
import { EnemyManager } from './enemy.js';
import { Boss } from './boss.js';
import { BulletPool } from './bullet.js';
import { EggPool } from './egg.js';
import { PowerupManager } from './powerup.js';
import { ParticlePool } from './particle.js';
import { WaveManager } from './waveManager.js';
import { UI } from './ui.js';
import { input } from './input.js';
import { assetLoader } from './assetLoader.js';
import { checkCollision, checkCollisions } from './collision.js';

export const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    BOSS_WARNING: 'boss_warning',
    BOSS_FIGHT: 'boss_fight',
    VICTORY: 'victory',
    WAVE_ANNOUNCE: 'wave_announce'
};

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 600;
        this.height = 800;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.state = GAME_STATE.MENU;
        this.score = 0;

        this.bulletPool = new BulletPool(250);
        this.eggPool = new EggPool(300);
        this.particlePool = new ParticlePool(600);
        this.player = new Player(this.width, this.height, this.bulletPool, this.particlePool);
        this.enemyManager = new EnemyManager(this.width, this.height, this.eggPool);
        this.boss = new Boss(this.width, this.height, this.eggPool);
        this.boss.setPlayer(this.player);
        this.powerupManager = new PowerupManager();
        this.waveManager = new WaveManager();
        this.ui = new UI(this.width, this.height);

        this.enemyManager.setPlayer(this.player);

        this.stars = [];
        this.stars2 = [];
        this.speedLines = [];
        this.initStars();

        this.waveAnnounceTimer = 0;
        this.waveAnnounceMaxTimer = 2.5;
        this.screenShake = 0;
        this.shakeIntensity = 0;

        this.waveTransitionParticles = 0;
        this.bossDefeatedCount = 0;

        assetLoader.init();
        this.lastTime = 0;
    }

    resize() {
        const ratio = this.width / this.height;
        let w = window.innerWidth;
        let h = window.innerHeight;
        if (w / h > ratio) w = h * ratio;
        else h = w / ratio;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    initStars() {
        const starColors = ['#ffffff', '#aaccff', '#ffddaa', '#ffaacc', '#aaffee'];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 1.5 + 0.5,
                speed: 30 + Math.random() * 40,
                alpha: 0.3 + Math.random() * 0.7,
                color: starColors[Math.floor(Math.random() * starColors.length)]
            });
        }
        for (let i = 0; i < 40; i++) {
            this.stars2.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speed: 60 + Math.random() * 60,
                alpha: 0.2 + Math.random() * 0.5,
                color: starColors[Math.floor(Math.random() * starColors.length)]
            });
        }
    }

    start() {
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    loop(ts) {
        let dt = (ts - this.lastTime) / 1000;
        this.lastTime = ts;
        dt = Math.min(dt, 0.033);

        this.update(dt);
        this.draw();
        input.update();

        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        this.updateStars(dt);
        this.updateSpeedLines(dt);

        switch (this.state) {
            case GAME_STATE.MENU:
                if (input.isStart()) { assetLoader.resume(); this.startGame(); }
                break;
            case GAME_STATE.PLAYING:
                this.updatePlaying(dt);
                break;
            case GAME_STATE.PAUSED:
                if (input.isPause()) this.state = GAME_STATE.PLAYING;
                break;
            case GAME_STATE.GAME_OVER:
                this.particlePool.update(dt);
                this.bulletPool.update(dt);
                if (input.isStart()) this.startGame();
                break;
            case GAME_STATE.BOSS_WARNING:
                this.boss.update(dt, null);
                this.player.update(dt);
                this.bulletPool.update(dt);
                this.eggPool.update(dt, this.player.x, this.player.y);
                this.particlePool.update(dt);
                if (this.bossWarningTimer !== undefined) {
                    this.bossWarningTimer -= dt;
                    if (this.bossWarningTimer <= 0) this.state = GAME_STATE.BOSS_FIGHT;
                }
                break;
            case GAME_STATE.BOSS_FIGHT:
                this.updateBossFight(dt);
                break;
            case GAME_STATE.VICTORY:
                this.particlePool.update(dt);
                if (input.isStart()) this.startGame();
                break;
            case GAME_STATE.WAVE_ANNOUNCE:
                this.waveAnnounceTimer -= dt;
                this.updateWaveTransition(dt);
                this.player.update(dt);
                this.enemyManager.update(dt);
                this.bulletPool.update(dt);
                this.eggPool.update(dt, this.player.x, this.player.y);
                this.particlePool.update(dt);
                this.powerupManager.update(dt, this.player.x, this.player.y, this.player.magnetActive);
                this.checkCollisions();
                if (this.waveAnnounceTimer <= 0) {
                    this.enemyManager.startWave();
                    this.state = GAME_STATE.PLAYING;
                }
                break;
        }

        this.screenShake = Math.max(0, this.screenShake - dt);
    }

    updateWaveTransition(dt) {
        this.waveTransitionParticles += dt * 30;
        while (this.waveTransitionParticles >= 1) {
            this.waveTransitionParticles -= 1;
            this.particlePool.emit(
                Math.random() * this.width,
                -10,
                1,
                {
                    speed: 100 + Math.random() * 50,
                    life: 1.5,
                    color: '#ffcc00',
                    size: 2 + Math.random() * 2,
                    gravity: 80,
                    friction: 0.99,
                    type: 'rect'
                }
            );
        }

        if (Math.random() < 0.15) {
            this.speedLines.push({
                x: Math.random() * this.width,
                y: -20,
                length: 30 + Math.random() * 50,
                speed: 500 + Math.random() * 300,
                alpha: 0.3 + Math.random() * 0.4
            });
        }
    }

    updatePlaying(dt) {
        if (input.isPause()) { this.state = GAME_STATE.PAUSED; return; }

        if (input.isBomb() && this.player.useBomb()) {
            this.activateBomb();
        }

        this.player.update(dt);
        this.enemyManager.update(dt);
        this.bulletPool.update(dt);
        this.eggPool.update(dt, this.player.x, this.player.y);
        this.particlePool.update(dt);
        this.powerupManager.update(dt, this.player.x, this.player.y, this.player.magnetActive);

        this.checkCollisions();
        this.enemyManager.formationManager.update(dt);

        if (this.enemyManager.isWaveComplete()) {
            const currentWave = this.waveManager.getWave();
            if (currentWave % 3 === 0 && currentWave > 0) {
                this.startBossFight();
            } else {
                this.startNextWave();
            }
        }

        if (!this.player.alive && this.player.lives <= 0) {
            this.state = GAME_STATE.GAME_OVER;
        }
    }

    updateBossFight(dt) {
        if (input.isBomb() && this.player.useBomb()) {
            this.activateBomb();
        }

        this.player.update(dt);
        this.boss.update(dt, null);
        this.bulletPool.update(dt);
        this.eggPool.update(dt, this.player.x, this.player.y);
        this.particlePool.update(dt);
        this.powerupManager.update(dt, this.player.x, this.player.y, this.player.magnetActive);

        this.checkBossCollisions();

        if (this.boss.checkLaserHit(this.player.getBounds())) {
            this.player.takeDamage(1);
        }

        if (this.boss.checkShockwaveHit(this.player.getBounds())) {
            this.player.takeDamage(1);
        }

        if (!this.boss.active && !this.boss.dying) {
            this.score += 10000;
            this.bossDefeatedCount++;
            this.startNextWave();
        }

        if (!this.player.alive && this.player.lives <= 0) {
            this.state = GAME_STATE.GAME_OVER;
        }
    }

    activateBomb() {
        for (const egg of this.eggPool.getActive()) egg.active = false;
        for (const enemy of this.enemyManager.getActive()) {
            enemy.takeDamage(enemy.health);
            this.score += enemy.score;
            this.enemyManager.onEnemyKilled();
            this.particlePool.emitExplosion(enemy.x, enemy.y);
        }
        if (this.boss.active && !this.boss.dying) {
            this.boss.takeDamage(25);
            this.shake(0.6, 12);
        }
        this.particlePool.emitScreenBomb(this.width, this.height);
        this.shake(0.5, 10);
    }

    updateStars(dt) {
        for (const s of this.stars) { s.y += s.speed * dt; if (s.y > this.height) { s.y = 0; s.x = Math.random() * this.width; } }
        for (const s of this.stars2) { s.y += s.speed * dt; if (s.y > this.height) { s.y = 0; s.x = Math.random() * this.width; } }
    }

    updateSpeedLines(dt) {
        for (let i = this.speedLines.length - 1; i >= 0; i--) {
            const line = this.speedLines[i];
            line.y += line.speed * dt;
            line.alpha -= dt * 0.5;
            if (line.y > this.height + 50 || line.alpha <= 0) {
                this.speedLines.splice(i, 1);
            }
        }
    }

    shake(duration, intensity) {
        this.screenShake = duration;
        this.shakeIntensity = intensity;
    }

    startGame() {
        this.score = 0;
        this.bossDefeatedCount = 0;
        this.waveManager.reset();
        this.player.reset();
        this.enemyManager.reset();
        this.boss.active = false;
        this.boss.dying = false;
        this.powerupManager.clear();
        this.bulletPool.releaseAll();
        this.eggPool.releaseAll();
        this.particlePool.releaseAll();
        this.speedLines = [];
        this.startNextWave();
    }

    startNextWave() {
        this.waveManager.nextWave();
        this.waveAnnounceTimer = this.waveAnnounceMaxTimer;
        this.state = GAME_STATE.WAVE_ANNOUNCE;
    }

    startBossFight() {
        this.boss.reset();
        const multiplier = Math.pow(2, this.bossDefeatedCount);
        const bossHP = Math.floor(100 * multiplier);
        this.boss.health = bossHP;
        this.boss.maxHealth = bossHP;
        this.boss.shieldMaxHits = Math.min(10, 3 + this.bossDefeatedCount);
        this.boss.speed = Math.floor(100 * (1 + this.bossDefeatedCount * 0.2));
        this.boss.shootInterval = Math.max(0.3, 1.4 - this.bossDefeatedCount * 0.1);
        this.bossWarningTimer = 3;
        this.state = GAME_STATE.BOSS_WARNING;
        assetLoader.playBossWarning();
    }

    checkCollisions() {
        const pBullets = this.bulletPool.getActive().filter(b => b.type !== 'enemy');
        const enemies = this.enemyManager.getActive();

        for (const [bullet, enemy] of checkCollisions(pBullets, enemies)) {
            bullet.active = false;
            if (enemy.takeDamage(bullet.damage)) {
                this.score += enemy.score;
                this.enemyManager.onEnemyKilled();
                this.particlePool.emitExplosion(enemy.x, enemy.y, 1.2);
                this.shake(0.15, 4);
                if (Math.random() < 0.45) this.powerupManager.spawn(enemy.x, enemy.y);
            } else {
                this.particlePool.emit(enemy.x, enemy.y, 6, { speed: 80, life: 0.25, color: '#ffff00', size: 3 });
                this.particlePool.emit(enemy.x, enemy.y, 4, { speed: 50, life: 0.2, color: '#ffffff', size: 2 });
                this.particlePool.emitFlash(enemy.x - 5, enemy.y - 5, 10, 10);
            }
        }

        const eggs = this.eggPool.getActive();
        const pb = this.player.getBounds();
        for (const egg of eggs) {
            if (egg.active && checkCollision(pb, egg)) {
                egg.active = false;
                if (this.player.takeDamage(egg.damage)) { /* died */ }
                if (egg.type === 'explosive') {
                    this.particlePool.emitExplosion(egg.x, egg.y, 0.8);
                    this.shake(0.15, 4);
                }
            }
        }

        const enemies2 = this.enemyManager.getActive();
        for (const e of enemies2) {
            if (this.player.alive && checkCollision(this.player, e)) {
                this.player.takeDamage(1);
                e.takeDamage(e.health);
                this.score += e.score;
                this.enemyManager.onEnemyKilled();
                this.particlePool.emitExplosion(e.x, e.y);
            }
        }

        for (const pu of this.powerupManager.getActive()) {
            if (this.player.alive && checkCollision(this.player, pu)) {
                pu.active = false;
                this.player.applyPowerup(pu.type);
                this.particlePool.emitSparkle(pu.x, pu.y);
                assetLoader.playCollect();
                if (pu.type === 'extra_life') assetLoader.playLifeUp();
                this.score += 50;
            }
        }
    }

    checkBossCollisions() {
        const pBullets = this.bulletPool.getActive().filter(b => b.type !== 'enemy');

        for (const bullet of pBullets) {
            if (!bullet.active) continue;

            if (this.boss.active && !this.boss.dying && !this.boss.showWarning) {
                if (checkCollision(bullet, this.boss)) {
                    bullet.active = false;
                    if (this.boss.takeDamage(bullet.damage)) {
                        this.particlePool.emitBossExplosion(this.boss.x, this.boss.y);
                        this.shake(1, 15);
                    } else {
                        this.shake(0.05, 2);
                        this.particlePool.emit(this.boss.x + (Math.random() - 0.5) * 60, this.boss.y + (Math.random() - 0.5) * 40, 2, { speed: 50, life: 0.15, color: '#ffffff', size: 2 });
                    }
                }
            }
        }

        const eggs = this.eggPool.getActive();
        const pb = this.player.getBounds();
        for (const egg of eggs) {
            if (egg.active && checkCollision(pb, egg)) {
                egg.active = false;
                this.player.takeDamage(egg.damage);
            }
        }

        if (this.boss.active && !this.boss.dying && !this.boss.showWarning && this.player.alive) {
            if (checkCollision(this.player, this.boss)) {
                this.player.takeDamage(2);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.save();

        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
            const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
            ctx.translate(sx, sy);
        }

        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, this.width, this.height);

        this.drawStars(ctx);
        this.drawSpeedLines(ctx);

        switch (this.state) {
            case GAME_STATE.MENU:
                this.ui.drawTitleScreen(ctx);
                break;
            case GAME_STATE.PLAYING:
                this.drawGameplay(ctx);
                this.ui.drawHUD(ctx, this.score, this.player.lives, this.waveManager.getWave(), this.player.health, this.player.maxHealth, this.player.bombCount, this.player.getHeatPercent(), this.player.isOverheated(), this.player.getOverheatTimer(), this.player.fireRate, input.tapSpeed);

                break;
            case GAME_STATE.PAUSED:
                this.drawGameplay(ctx);
                this.ui.drawHUD(ctx, this.score, this.player.lives, this.waveManager.getWave(), this.player.health, this.player.maxHealth, this.player.bombCount, this.player.getHeatPercent(), this.player.isOverheated(), this.player.getOverheatTimer(), this.player.fireRate, input.tapSpeed);
                this.ui.drawPauseScreen(ctx);
                break;
            case GAME_STATE.GAME_OVER:
                this.drawGameplay(ctx);
                this.ui.drawGameOverScreen(ctx, this.score);
                break;
            case GAME_STATE.BOSS_WARNING:
                this.drawGameplay(ctx);
                this.player.draw(ctx);
                this.boss.draw(ctx);
                this.ui.drawHUD(ctx, this.score, this.player.lives, this.waveManager.getWave(), this.player.health, this.player.maxHealth, this.player.bombCount, this.player.getHeatPercent(), this.player.isOverheated(), this.player.getOverheatTimer(), this.player.fireRate, input.tapSpeed);
                break;
            case GAME_STATE.BOSS_FIGHT:
                this.drawGameplay(ctx);
                this.boss.draw(ctx);
                this.ui.drawHUD(ctx, this.score, this.player.lives, this.waveManager.getWave(), this.player.health, this.player.maxHealth, this.player.bombCount, this.player.getHeatPercent(), this.player.isOverheated(), this.player.getOverheatTimer(), this.player.fireRate, input.tapSpeed);
                break;
            case GAME_STATE.VICTORY:
                this.drawGameplay(ctx);
                this.ui.drawVictoryScreen(ctx, this.score);
                break;
            case GAME_STATE.WAVE_ANNOUNCE:
                this.drawGameplay(ctx);
                this.ui.drawHUD(ctx, this.score, this.player.lives, this.waveManager.getWave(), this.player.health, this.player.maxHealth, this.player.bombCount, this.player.getHeatPercent(), this.player.isOverheated(), this.player.getOverheatTimer(), this.player.fireRate, input.tapSpeed);
                this.ui.drawWaveAnnouncement(ctx, this.waveManager.getWave(), this.waveAnnounceTimer, this.waveAnnounceMaxTimer);
                break;
        }

        ctx.restore();
    }

    drawGameplay(ctx) {
        this.player.draw(ctx);
        this.enemyManager.draw(ctx);
        this.bulletPool.draw(ctx);
        this.eggPool.draw(ctx);
        this.powerupManager.draw(ctx);
        this.particlePool.draw(ctx);
    }

    drawStars(ctx) {
        for (const s of this.stars) {
            ctx.globalAlpha = s.alpha;
            ctx.fillStyle = s.color;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        for (const s of this.stars2) {
            ctx.globalAlpha = s.alpha * 0.5;
            ctx.fillStyle = s.color;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;
    }

    drawSpeedLines(ctx) {
        for (const line of this.speedLines) {
            ctx.globalAlpha = line.alpha;
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x, line.y + line.length);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }
}
