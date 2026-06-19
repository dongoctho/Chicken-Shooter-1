export class Input {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.mouse = { x: 0, y: 0, down: false, justPressed: false };
        this.touchStart = false;
        this.touchStick = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.fireButton = { active: false, x: 0, y: 0, radius: 45 };
        this.moveTouchId = null;
        this.moveStartX = 0;
        this.moveStartY = 0;

        this._bindKeyboard();
        this._bindMouse();
        if (this.isMobile) this._bindTouch();
    }

    _bindKeyboard() {
        window.addEventListener('keydown', e => {
            if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS','KeyP','KeyB','KeyE'].includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });
        window.addEventListener('blur', () => { this.keys = {}; this.mouse.down = false; this.touchStick.active = false; this.fireButton.active = false; });
    }

    _bindMouse() {
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', e => {
            const r = canvas.getBoundingClientRect();
            const scaleX = canvas.width / r.width;
            const scaleY = canvas.height / r.height;
            this.mouse.x = (e.clientX - r.left) * scaleX;
            this.mouse.y = (e.clientY - r.top) * scaleY;
        });
        canvas.addEventListener('mousedown', e => {
            e.preventDefault();
            this.mouse.down = true;
            this.mouse.justPressed = true;
        });
        canvas.addEventListener('mouseup', () => { this.mouse.down = false; });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
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

            for (const touch of e.changedTouches) {
                const r = canvas.getBoundingClientRect();
                const scaleX = canvas.width / r.width;
                const scaleY = canvas.height / r.height;
                const tx = (touch.clientX - r.left) * scaleX;
                const ty = (touch.clientY - r.top) * scaleY;

                const dxBtn = tx - this.fireButton.x;
                const dyBtn = ty - this.fireButton.y;
                if (Math.sqrt(dxBtn * dxBtn + dyBtn * dyBtn) < this.fireButton.radius + 20) {
                    this.fireButton.active = true;
                    continue;
                }

                if (this.moveTouchId === null) {
                    this.moveTouchId = touch.identifier;
                    this.moveStartX = tx;
                    this.moveStartY = ty;
                    this.touchStick.active = true;
                    this.touchStick.startX = tx;
                    this.touchStick.startY = ty;
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
                    this.touchStick.dx = (tx - this.touchStick.startX) / 25;
                    this.touchStick.dy = (ty - this.touchStick.startY) / 25;
                    this.touchStick.dx = Math.max(-1, Math.min(1, this.touchStick.dx));
                    this.touchStick.dy = Math.max(-1, Math.min(1, this.touchStick.dy));
                    this.touchStick.startX = tx;
                    this.touchStick.startY = ty;
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchend', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.moveTouchId) {
                    this.moveTouchId = null;
                    this.touchStick.active = false;
                    this.touchStick.dx = 0;
                    this.touchStick.dy = 0;
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
                if (Math.sqrt(dxBtn * dxBtn + dyBtn * dyBtn) < this.fireButton.radius + 20) {
                    fireStillActive = true;
                }
            }
            if (!fireStillActive) this.fireButton.active = false;
        });

        canvas.addEventListener('touchcancel', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.moveTouchId) {
                    this.moveTouchId = null;
                    this.touchStick.active = false;
                    this.touchStick.dx = 0;
                    this.touchStick.dy = 0;
                }
            }
            this.fireButton.active = false;
        });
    }

    update() {
        this.prevKeys = { ...this.keys };
        this.mouse.justPressed = false;
        this.touchStart = false;
    }

    isKeyDown(code) { return !!this.keys[code]; }
    isKeyJustPressed(code) { return this.keys[code] && !this.prevKeys[code]; }

    isLeft() { return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA') || (this.touchStick.active && this.touchStick.dx < -0.2); }
    isRight() { return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD') || (this.touchStick.active && this.touchStick.dx > 0.2); }
    isUp() { return this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW') || (this.touchStick.active && this.touchStick.dy < -0.2); }
    isDown() { return this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS') || (this.touchStick.active && this.touchStick.dy > 0.2); }

    isShooting() { return this.mouse.down || this.isKeyDown('Space') || this.fireButton.active; }
    isStart() { return this.isKeyJustPressed('Space') || this.mouse.justPressed || this.touchStart; }
    isPause() { return this.isKeyJustPressed('KeyP'); }
    isBomb() { return this.isKeyJustPressed('KeyB'); }
    isSkill() { return this.isKeyJustPressed('KeyE'); }
}

export const input = new Input();
