export const FORMATION_TYPE = {
    GRID: 'grid',
    V_FORMATION: 'v_formation',
    CIRCLE: 'circle',
    DIAMOND: 'diamond',
    LINE: 'line'
};

export class FormationManager {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.formations = [];
        this.currentFormation = FORMATION_TYPE.GRID;
        this.transitionTimer = 0;
        this.transitionInterval = 15;
    }

    reset() {
        this.formations = [];
        this.currentFormation = FORMATION_TYPE.GRID;
        this.transitionTimer = this.transitionInterval;
    }

    update(dt) {
        this.transitionTimer -= dt;
        if (this.transitionTimer <= 0) {
            this.transitionTimer = this.transitionInterval;
            this.cycleFormation();
        }
    }

    cycleFormation() {
        const types = Object.values(FORMATION_TYPE);
        const idx = types.indexOf(this.currentFormation);
        this.currentFormation = types[(idx + 1) % types.length];
    }

    getPositions(count, formationType = null) {
        const type = formationType || this.currentFormation;
        const positions = [];
        const cols = Math.min(count, 6);
        const rows = Math.ceil(count / cols);
        const spacingX = 50;
        const spacingY = 42;
        const startX = (this.canvasWidth - (cols - 1) * spacingX) / 2;
        const startY = 80;
        const minX = 40;
        const maxX = this.canvasWidth - 40;
        const minY = 50;
        const maxY = 250;

        switch (type) {
            case FORMATION_TYPE.GRID:
                for (let i = 0; i < count; i++) {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    positions.push({ x: startX + col * spacingX, y: startY + row * spacingY });
                }
                break;

            case FORMATION_TYPE.V_FORMATION:
                for (let i = 0; i < count; i++) {
                    const half = Math.floor(count / 2);
                    const offset = i - half;
                    positions.push({
                        x: this.canvasWidth / 2 + offset * spacingX * 0.8,
                        y: startY + Math.abs(offset) * spacingY * 0.6
                    });
                }
                break;

            case FORMATION_TYPE.CIRCLE:
                const radius = 80 + count * 3;
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
                    positions.push({
                        x: this.canvasWidth / 2 + Math.cos(angle) * radius,
                        y: startY + 60 + Math.sin(angle) * radius * 0.6
                    });
                }
                break;

            case FORMATION_TYPE.DIAMOND:
                for (let i = 0; i < count; i++) {
                    const ring = Math.floor(Math.sqrt(i + 1));
                    const pos = i - ring * ring;
                    const angle = (pos / (ring * 2 + 1)) * Math.PI * 2;
                    const r = ring * spacingX * 0.7;
                    positions.push({
                        x: this.canvasWidth / 2 + Math.cos(angle) * r,
                        y: startY + 40 + Math.sin(angle) * r * 0.6
                    });
                }
                break;

            case FORMATION_TYPE.LINE:
                for (let i = 0; i < count; i++) {
                    positions.push({
                        x: startX + i * spacingX,
                        y: startY + 20
                    });
                }
                break;
        }

        for (const pos of positions) {
            pos.x = Math.max(minX, Math.min(maxX, pos.x));
            pos.y = Math.max(minY, Math.min(maxY, pos.y));
        }

        return positions;
    }

    getCurrentFormation() {
        return this.currentFormation;
    }
}
