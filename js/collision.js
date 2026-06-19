export function checkCollision(a, b) {
    const aB = a.getBounds ? a.getBounds() : a;
    const bB = b.getBounds ? b.getBounds() : b;
    return aB.x < bB.x + bB.width && aB.x + aB.width > bB.x &&
           aB.y < bB.y + bB.height && aB.y + aB.height > bB.y;
}

export function checkCollisions(listA, listB) {
    const hits = [];
    for (const a of listA) {
        if (!a.active) continue;
        for (const b of listB) {
            if (!b.active) continue;
            if (checkCollision(a, b)) hits.push([a, b]);
        }
    }
    return hits;
}

export function circleCollision(ax, ay, ar, bx, by, br) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy < (ar + br) * (ar + br);
}
