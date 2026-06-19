export class UI {
    constructor(canvasWidth, canvasHeight) {
        this.cw = canvasWidth;
        this.ch = canvasHeight;
    }

    drawHUD(ctx, score, lives, wave, health, maxHealth, bombs, heatPercent, overheated, overheatTimer) {
        ctx.save();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`SCORE: ${score}`, 15, 12);

        ctx.textAlign = 'center';
        ctx.fillText(`WAVE: ${wave}`, this.cw / 2, 12);

        ctx.textAlign = 'right';
        for (let i = 0; i < lives; i++) this.drawMiniShip(ctx, this.cw - 18 - i * 22, 22);
        ctx.font = '13px monospace';
        ctx.fillText('LIVES', this.cw - 10, 12);

        ctx.textAlign = 'left';
        ctx.font = '13px monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('HP', 15, 38);
        const bx = 40, by = 38, bw = 120, bh = 10;
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, by, bw, bh);
        const hp = health / maxHealth;
        ctx.fillStyle = hp > 0.5 ? '#00ff00' : hp > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(bx, by, bw * hp, bh);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);

        const hbx = 40, hby = 52, hbw = 120, hbh = 8;
        ctx.fillStyle = '#222';
        ctx.fillRect(hbx, hby, hbw, hbh);

        let heatColor;
        if (overheated) {
            heatColor = '#ff0000';
            const flashAlpha = 0.5 + Math.sin(Date.now() * 0.015) * 0.5;
            ctx.globalAlpha = flashAlpha;
        } else if (heatPercent > 0.7) {
            heatColor = '#ff4400';
        } else if (heatPercent > 0.4) {
            heatColor = '#ffaa00';
        } else {
            heatColor = '#00aaff';
        }
        ctx.globalAlpha = overheated ? ctx.globalAlpha : 1;
        ctx.fillStyle = heatColor;
        ctx.fillRect(hbx, hby, hbw * Math.min(1, heatPercent), hbh);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(hbx, hby, hbw, hbh);
        ctx.globalAlpha = 1;

        ctx.fillStyle = overheated ? '#ff4444' : '#88aacc';
        ctx.font = '10px monospace';
        ctx.fillText(overheated ? `OVERHEAT ${overheatTimer.toFixed(1)}s` : 'HEAT', 15, 53);

        if (heatPercent > 0.7 && !overheated) {
            ctx.fillStyle = '#ff6600';
            ctx.font = 'bold 10px monospace';
            const warnAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
            ctx.globalAlpha = warnAlpha;
            ctx.fillText('WARNING', hbx + hbw + 8, hby + 1);
            ctx.globalAlpha = 1;
        }

        if (bombs > 0) {
            ctx.fillStyle = '#ff4444';
            ctx.font = '14px monospace';
            ctx.fillText(`BOMB:${bombs}`, 15, 68);
        }

        ctx.restore();
    }

    drawMiniShip(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#3366ff';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(-7, 7);
        ctx.lineTo(7, 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawTitleScreen(ctx) {
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.75;
        ctx.fillRect(0, 0, this.cw, this.ch);
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 52px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CHICKEN', this.cw / 2, this.ch / 3 - 40);
        ctx.fillText('INVADERS', this.cw / 2, this.ch / 3 + 30);

        ctx.fillStyle = '#ff4400';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('V2 - ULTIMATE', this.cw / 2, this.ch / 3 + 75);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) ctx.fillText('TAP / PRESS SPACE TO START', this.cw / 2, this.ch / 2 + 50);

        ctx.fillStyle = '#888';
        ctx.font = '13px monospace';
        ctx.fillText('Desktop: WASD/Arrows + Mouse/Space', this.cw / 2, this.ch / 2 + 100);
        ctx.fillText('Mobile: Drag anywhere to move', this.cw / 2, this.ch / 2 + 125);
        ctx.fillText('Tap FIRE button to shoot', this.cw / 2, this.ch / 2 + 150);
        ctx.fillText('B: Bomb | P: Pause', this.cw / 2, this.ch / 2 + 175);

        ctx.restore();
    }

    drawPauseScreen(ctx) {
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(0, 0, this.cw, this.ch);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', this.cw / 2, this.ch / 2 - 20);
        ctx.font = '18px monospace';
        ctx.fillText('Press P to resume', this.cw / 2, this.ch / 2 + 30);
        ctx.restore();
    }

    drawGameOverScreen(ctx, score) {
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.85;
        ctx.fillRect(0, 0, this.cw, this.ch);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 52px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', this.cw / 2, this.ch / 3);
        ctx.fillStyle = '#ffffff';
        ctx.font = '26px monospace';
        ctx.fillText(`Score: ${score}`, this.cw / 2, this.ch / 2);
        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.font = '18px monospace';
            ctx.fillText('TAP / PRESS SPACE', this.cw / 2, this.ch / 2 + 60);
        }
        ctx.restore();
    }

    drawVictoryScreen(ctx, score) {
        ctx.save();
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.85;
        ctx.fillRect(0, 0, this.cw, this.ch);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 52px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VICTORY!', this.cw / 2, this.ch / 3 - 20);
        ctx.fillStyle = '#ffcc00';
        ctx.font = '24px monospace';
        ctx.fillText('All chickens defeated!', this.cw / 2, this.ch / 3 + 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px monospace';
        ctx.fillText(`Score: ${score}`, this.cw / 2, this.ch / 2 + 20);
        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.font = '18px monospace';
            ctx.fillText('TAP / PRESS SPACE', this.cw / 2, this.ch / 2 + 80);
        }
        ctx.restore();
    }

    drawWaveAnnouncement(ctx, wave, timer, maxTimer) {
        ctx.save();
        const progress = 1 - timer / maxTimer;
        let alpha = 1;
        if (progress < 0.2) alpha = progress / 0.2;
        else if (progress > 0.7) alpha = (1 - progress) / 0.3;

        ctx.globalAlpha = alpha * 0.9;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`WAVE ${wave}`, this.cw / 2, this.ch / 2 - 20);

        ctx.fillStyle = '#ffcc00';
        ctx.font = '18px monospace';
        const subtitle = wave <= 2 ? 'GET READY!' : wave <= 4 ? 'INCOMING!' : 'SURVIVE!';
        ctx.fillText(subtitle, this.cw / 2, this.ch / 2 + 30);

        const lineY = this.ch / 2 + 60;
        const lineW = 200 * Math.min(1, progress * 3);
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.cw / 2 - lineW / 2, lineY);
        ctx.lineTo(this.cw / 2 + lineW / 2, lineY);
        ctx.stroke();

        ctx.restore();
    }

    drawMobileControls(ctx, fireButtonActive) {
        ctx.save();

        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.cw / 2, this.ch / 2, 100, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.25;
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DRAG TO MOVE', this.cw / 2, this.ch / 2);

        const btnX = 70;
        const btnY = this.ch - 80;
        const btnR = 45;

        ctx.globalAlpha = fireButtonActive ? 0.5 : 0.3;
        ctx.fillStyle = fireButtonActive ? '#ff4444' : '#ff6666';
        ctx.beginPath();
        ctx.arc(btnX, btnY, btnR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = fireButtonActive ? 0.8 : 0.5;
        ctx.beginPath();
        ctx.arc(btnX, btnY, btnR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = fireButtonActive ? 1 : 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FIRE', btnX, btnY);

        ctx.restore();
    }
}
