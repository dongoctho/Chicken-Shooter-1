export class Input {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.mouse = { x: 0, y: 0, down: false, justPressed: false, active: false };
        this.touchStart = false;
        this.touchMove = { active: false, x: 0, y: 0, targetX: 0, targetY: 0 };
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.fireButton = { active: false, x: 0, y: 0, radius: 45 };
        this.moveTouchId = null;
        this.touchActive = false;
        this.prevTouchX = 0;
        this.prevTouchY = 0;

        this._bindKeyboard();
        this._bindMouse();
        this._bindTouch();
    }

    _bindKeyboard() {
        window.addEventListener('keydown', e => {
            if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS','KeyP','KeyB','KeyE'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });
        window.addEventListener('blur', () => {
            this.keys = {};
            this.mouse.down = false;
            this.touchMove.active = false;
            this.fireButton.active = false;
        });
    }

    _bindMouse() {
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', e => {
            const r = canvas.getBoundingClientRect();
            const scaleX = canvas.width / r.width;
            const scaleY = canvas.height / r.height;
            this.mouse.x = (e.clientX - r.left) * scaleX;
            this.mouse.y = (e.clientY - r.top) * scaleY;
            this.mouse.active = true;
        });
        canvas.addEventListener('mousedown', e => {
            e.preventDefault();
            this.mouse.down = true;
            this.mouse.justPressed = true;
        });
        canvas.addEventListener('mouseup', () => { this.mouse.down = false; });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
        canvas.addEventListener('mouseleave', () => { this.mouse.active = false; });
    }

    _bindTouch() {
        const canvas = document.getElementById('gameCanvas');
        const ch = 800;

        this.fireButton.x = 70;
        this.fireButton.y = ch - 80;
        this.fireButton.radius = 45;

        canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            this.touchStart = true;
            this.touchActive = true;

            for (const touch of e.changedTouches) {
                const r = canvas.getBoundingClientRect();
                const scaleX = canvas.width / r.width;
                const scaleY = canvas.height / r.height;
                const tx = (touch.clientX - r.left) * scaleX;
                const ty = (touch.clientY - r.top) * scaleY;

                const dxBtn = tx - this.fireButton.x;
                const dyBtn = ty - this.fireButton.y;
                if (Math.sqrt(dxBtn * dxBtn + dyBtn * dyBtn) < this.fireButton.radius + 25) {
                    this.fireButton.active = true;
                    continue;
                }

                if (this.moveTouchId === null) {
                    this.moveTouchId = touch.identifier;
                    this.touchMove.active = true;
                    this.touchMove.x = tx;
                    this.touchMove.y = ty;
                    this.touchMove.targetX = tx;
                    this.touchMove.targetY = ty;
                    this.prevTouchX = tx;
                    this.prevTouchY = ty;
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.moveTouchId) {
                    const r = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / r.width;
                    const scaleY = canvas.height / r.height;
                    const tx = (touch.clientX - r.left) * scaleX;
                    const ty = (touch.clientY - r.top) * scaleY;
                    this.touchMove.targetX = tx;
                    this.touchMove.targetY = ty;
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchend', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.moveTouchId) {
                    this.moveTouchId = null;
                    this.touchMove.active = false;
                }
            }
            let fireStillActive = false;
            for (const touch of e.touches) {
                const r = canvas.getBoundingClientRect();
                const scaleX = canvas.width / r.width;
                const scaleY = canvas.height / r.height;
                const tx = (touch.clientX - r.left) * scaleX;
                const ty = (touch.clientY - r.top) * scaleY;
                const dxBtn = tx - this.fireButton.x;
                const dyBtn = ty - this.fireButton.y;
                if (Math.sqrt(dxBtn * dxBtn + dyBtn * dyBtn) < this.fireButton.radius + 25) {
                    fireStillActive = true;
                }
            }
            if (!fireStillActive) this.fireButton.active = false;
            if (e.touches.length === 0) this.touchActive = false;
        });

        canvas.addEventListener('touchcancel', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.moveTouchId) {
                    this.moveTouchId = null;
                    this.touchMove.active = false;
                }
            }
            this.fireButton.active = false;
            this.touchActive = false;
        });
    }

    update() {
        this.prevKeys = { ...this.keys };
        this.mouse.justPressed = false;
        this.touchStart = false;
        this.prevTouchX = this.touchMove.x;
        this.prevTouchY = this.touchMove.y;
        if (this.touchMove.active) {
            this.touchMove.x += (this.touchMove.targetX - this.touchMove.x) * 0.4;
            this.touchMove.y += (this.touchMove.targetY - this.touchMove.y) * 0.4;
        }
    }

    isKeyDown(code) { return !!this.keys[code]; }
    isKeyJustPressed(code) { return this.keys[code] && !this.prevKeys[code]; }

    isLeft() { return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA'); }
    isRight() { return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD'); }
    isUp() { return this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW'); }
    isDown() { return this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS'); }

    getMoveDirection(playerX, playerY) {
        let dx = 0, dy = 0;

        if (this.isLeft()) dx -= 1;
        if (this.isRight()) dx += 1;
        if (this.isUp()) dy -= 1;
        if (this.isDown()) dy += 1;

        if (this.touchMove.active) {
            const tdx = this.touchMove.x - playerX;
            const tdy = this.touchMove.y - playerY;
            const dist = Math.sqrt(tdx * tdx + tdy * tdy);
            if (dist > 8) {
                dx = tdx / dist;
                dy = tdy / dist;
                const speed = Math.min(1, dist / 80);
                dx *= speed;
                dy *= speed;
            }
        } else if (this.mouse.active) {
            const mdx = this.mouse.x - playerX;
            const mdy = this.mouse.y - playerY;
            const dist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (dist > 8) {
                dx = mdx / dist;
                dy = mdy / dist;
                const speed = Math.min(1, dist / 60);
                dx *= speed;
                dy *= speed;
            }
        }

        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 1) { dx /= len; dy /= len; }
        }

        return { dx, dy };
    }

    isShooting() { return this.mouse.down || this.isKeyDown('Space') || this.fireButton.active; }
    isStart() { return this.isKeyJustPressed('Space') || this.mouse.justPressed || this.touchStart; }
    isPause() { return this.isKeyJustPressed('KeyP'); }
    isBomb() { return this.isKeyJustPressed('KeyB'); }
    isSkill() { return this.isKeyJustPressed('KeyE'); }
}

export const input = new Input();
