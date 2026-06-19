export class Input {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        this.mouse = { x: 0, y: 0, down: false, justPressed: false };
        this.touches = [];
        this.touchStick = { active: false, startX: 0, startY: 0, dx: 0, dy: 0 };
        this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.shootRequest = false;
        this.skillRequest = false;

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
        window.addEventListener('blur', () => { this.keys = {}; this.mouse.down = false; });
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
            this.shootRequest = true;
        });
        canvas.addEventListener('mouseup', () => { this.mouse.down = false; });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    _bindTouch() {
        const canvas = document.getElementById('gameCanvas');
        let controlTouchId = null;
        let controlStartX = 0, controlStartY = 0;

        canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const r = canvas.getBoundingClientRect();
                const scaleX = canvas.width / r.width;
                const scaleY = canvas.height / r.height;
                const tx = (touch.clientX - r.left) * scaleX;
                const ty = (touch.clientY - r.top) * scaleY;

                if (controlTouchId === null && tx < canvas.width / 2) {
                    controlTouchId = touch.identifier;
                    controlStartX = tx;
                    controlStartY = ty;
                    this.touchStick.active = true;
                    this.touchStick.startX = tx;
                    this.touchStick.startY = ty;
                } else {
                    this.shootRequest = true;
                    this.skillRequest = true;
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === controlTouchId) {
                    const r = canvas.getBoundingClientRect();
                    const scaleX = canvas.width / r.width;
                    const scaleY = canvas.height / r.height;
                    const tx = (touch.clientX - r.left) * scaleX;
                    const ty = (touch.clientY - r.top) * scaleY;
                    this.touchStick.dx = (tx - this.touchStick.startX) / 40;
                    this.touchStick.dy = (ty - this.touchStick.startY) / 40;
                    this.touchStick.dx = Math.max(-1, Math.min(1, this.touchStick.dx));
                    this.touchStick.dy = Math.max(-1, Math.min(1, this.touchStick.dy));
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchend', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === controlTouchId) {
                    controlTouchId = null;
                    this.touchStick.active = false;
                    this.touchStick.dx = 0;
                    this.touchStick.dy = 0;
                }
            }
        });

        canvas.addEventListener('touchcancel', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === controlTouchId) {
                    controlTouchId = null;
                    this.touchStick.active = false;
                    this.touchStick.dx = 0;
                    this.touchStick.dy = 0;
                }
            }
        });
    }

    update() {
        this.prevKeys = { ...this.keys };
        this.mouse.justPressed = false;
        this.shootRequest = false;
        this.skillRequest = false;
    }

    isKeyDown(code) { return !!this.keys[code]; }
    isKeyJustPressed(code) { return this.keys[code] && !this.prevKeys[code]; }

    isLeft() { return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA') || (this.touchStick.active && this.touchStick.dx < -0.3); }
    isRight() { return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD') || (this.touchStick.active && this.touchStick.dx > 0.3); }
    isUp() { return this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW') || (this.touchStick.active && this.touchStick.dy < -0.3); }
    isDown() { return this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS') || (this.touchStick.active && this.touchStick.dy > 0.3); }

    isShooting() { return this.mouse.down || this.isKeyDown('Space') || this.touchStick.active; }
    isStart() { return this.isKeyJustPressed('Space') || this.mouse.justPressed || this.shootRequest; }
    isPause() { return this.isKeyJustPressed('KeyP'); }
    isBomb() { return this.isKeyJustPressed('KeyB') || this.skillRequest; }
    isSkill() { return this.isKeyJustPressed('KeyE'); }
}

export const input = new Input();
