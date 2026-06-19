import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');

function resizeCanvas() {
    const gameWidth = 600;
    const gameHeight = 800;
    const ratio = gameWidth / gameHeight;
    
    let w = window.innerWidth;
    let h = window.innerHeight;
    
    if (w / h > ratio) {
        w = h * ratio;
    } else {
        h = w / ratio;
    }
    
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = gameWidth;
    canvas.height = gameHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const game = new Game(canvas);
game.start();

document.addEventListener('touchstart', function() {}, { passive: true });
