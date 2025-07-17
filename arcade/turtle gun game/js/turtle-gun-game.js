// Preload gunshot sound
const gunshotAudio = new Audio('../audio/gunshot1.mp3'); // Use any available gunshot-like sound in your audio folder
gunshotAudio.volume = 0.4;
let enemiesHit = 0;
let multiShot = false;

// 2D HTML Canvas Turtle Gun Game
// Basic 2D version, no Three.js

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Mouse wheel scroll for teleport and boss menus (must be after canvas is defined)
canvas.addEventListener('wheel', function (e) {
    if (teleportMenuOpen) {
        if (e.deltaY > 0) {
            teleportMenuSelected = (teleportMenuSelected + 1) % teleportMenuLevels.length;
        } else if (e.deltaY < 0) {
            teleportMenuSelected = (teleportMenuSelected - 1 + teleportMenuLevels.length) % teleportMenuLevels.length;
        }
        e.preventDefault();
    } else if (bossMenuOpen) {
        if (e.deltaY > 0) {
            bossMenuSelected = (bossMenuSelected + 1) % bossMenuOptions.length;
        } else if (e.deltaY < 0) {
            bossMenuSelected = (bossMenuSelected - 1 + bossMenuOptions.length) % bossMenuOptions.length;
        }
        e.preventDefault();
    }
});

const PLAYER_SIZE = 40;
const ENEMY_SIZE = 40;
const BULLET_SIZE = 8;
const ENEMY_COUNT = 3;
const WAREHOUSE_W = 900;
const WAREHOUSE_H = 600;

let player = {
    x: WAREHOUSE_W / 2,
    y: WAREHOUSE_H / 2,
    angle: 0,
    color: randomColor(),
    alive: true,
    lives: 3
};


let enemies = [];
let enemyExplosions = [];
let bullets = [];
let keys = {};
let level = 1;
let checkpointLevel = 1; // Level 1 is initial checkpoint, but level 5 becomes checkpoint when reached
let boss = null;

// Spike state for bosses
let bossSpikes = [];
let bossSpikePhase = false;
let bossSpikeTimer = 0;

function spawnEnemies() {
    if (level === 31) {
        // Rock Giant Boss (Stone World)
        boss = {
            x: WAREHOUSE_W / 2,
            y: WAREHOUSE_H / 2,
            angle: 0,
            color: '#888',
            alive: true,
            lastShot: 0,
            lastWall: 0,
            lives: 200,
            bossType: 'rockgiant',
            wallCooldown: 0,
            rocksThrown: 0,
            walls: [] // Array of rock walls
        };
    } else if (level === 29 || level === 30) {
        // No boss for these levels (unicorn removed)
        boss = null;
    } else {
        enemies = [];
        boss = null;
    }
    // Rock Giant Boss (level 31)
    if (boss && boss.bossType === 'rockgiant' && boss.alive) {
        // Throw rocks at player every 1.2s
        if (!boss.lastShot) boss.lastShot = 0;
        if (Date.now() - boss.lastShot > 1200) {
            let angle = Math.atan2(player.y - boss.y, player.x - boss.x);
            bullets.push({
                x: boss.x,
                y: boss.y - 40,
                angle: angle + (Math.random() - 0.5) * 0.2,
                fromPlayer: false,
                shooter: boss,
                rock: true
            });
            boss.lastShot = Date.now();
            boss.rocksThrown = (boss.rocksThrown || 0) + 1;
        }
        // Summon rock walls every 4 seconds, up to 3 at a time
        if (!boss.lastWall) boss.lastWall = 0;
        if (Date.now() - boss.lastWall > 4000 && boss.walls.length < 3) {
            // Place a wall between player and boss
            let dx = player.x - boss.x;
            let dy = player.y - boss.y;
            let dist = Math.hypot(dx, dy);
            let wx = boss.x + dx / dist * 120 + (Math.random() - 0.5) * 60;
            let wy = boss.y + dy / dist * 120 + (Math.random() - 0.5) * 60;
            boss.walls.push({ x: wx, y: wy, created: Date.now() });
            boss.lastWall = Date.now();
        }
        // Remove old walls after 6 seconds
        let nowT = Date.now();
        for (let i = boss.walls.length - 1; i >= 0; i--) {
            if (nowT - boss.walls[i].created > 6000) boss.walls.splice(i, 1);
        }
        // Check player collision with walls
        for (let wall of boss.walls) {
            let dx = player.x - wall.x;
            let dy = player.y - wall.y;
            if (Math.abs(dx) < 38 && Math.abs(dy) < 38 && player.alive) {
                player.lives = Math.max(0, player.lives - 1);
                player.alive = player.lives > 0;
            }
        }
    }
    let spawnRightX = WAREHOUSE_W - ENEMY_SIZE - 30;
    if (level === 20) {
        // Water Dragon Boss (World 2: The Town)
        boss = {
            x: WAREHOUSE_W / 2,
            y: WAREHOUSE_H / 2,
            angle: 0,
            color: '#3ad6ff',
            alive: true,
            lastShot: 0,
            lives: 100,
            bossType: 'waterdragon',
            wellY: WAREHOUSE_H / 2,
            wellX: WAREHOUSE_W / 2,
            appearAnim: 0 // Animation state for rising out of well
        };
    } else if (level === 15) {
        boss = {
            x: spawnRightX,
            y: Math.random() * (WAREHOUSE_H - ENEMY_SIZE),
            angle: Math.random() * Math.PI * 2,
            color: '#0ff',
            alive: true,
            lastShot: 0,
            lives: 100,
            charging: false,
            stunned: false,
            lastCharge: 0,
            stunStart: 0,
            bossType: 3, // Level 15 boss
            chargeHits: 0 // Number of times shot during charge
        };
    } else if (level === 5) {
        boss = {
            x: spawnRightX,
            y: Math.random() * (WAREHOUSE_H - ENEMY_SIZE),
            angle: Math.random() * Math.PI * 2,
            color: '#fff',
            alive: true,
            lastShot: 0,
            lives: 10,
            charging: false,
            stunned: false,
            lastCharge: 0,
            stunStart: 0,
            bossType: 1 // Normal boss
        };
    } else if (level === 10) {
        boss = {
            x: spawnRightX,
            y: Math.random() * (WAREHOUSE_H - ENEMY_SIZE),
            angle: Math.random() * Math.PI * 2,
            color: '#ff0',
            alive: true,
            lastShot: 0,
            lives: 20,
            charging: false,
            stunned: false,
            lastCharge: 0,
            stunStart: 0,
            bossType: 2 // Level 10 boss
        };
    } else if (level < 5) {
        for (let i = 0; i < ENEMY_COUNT; i++) {
            enemies.push({
                x: spawnRightX,
                y: Math.random() * (WAREHOUSE_H - ENEMY_SIZE),
                angle: Math.random() * Math.PI * 2,
                color: randomColor(),
                alive: true,
                lastShot: 0,
                lives: 1
            });
        }
    } else if (level >= 11) {
        // Levels 11 and above: 2 special turtles, 1 life each
        for (let i = 0; i < 2; i++) {
            enemies.push({
                x: spawnRightX,
                y: Math.random() * (WAREHOUSE_H - ENEMY_SIZE),
                angle: Math.random() * Math.PI * 2,
                color: randomColor(),
                alive: true,
                lastShot: 0,
                lives: 1
            });
        }
    } else {
        // Level 6 to 10: 4 normal turtles
        for (let i = 0; i < 4; i++) {
            enemies.push({
                x: spawnRightX,
                y: Math.random() * (WAREHOUSE_H - ENEMY_SIZE),
                angle: Math.random() * Math.PI * 2,
                color: randomColor(),
                alive: true,
                lastShot: 0,
                lives: 1
            });
        }
    }
}

spawnEnemies();

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
canvas.addEventListener('mousedown', shoot);

// Enhanced shooting: Space = shoot right, Q = shoot left, E = shoot right, mouse = aim

let teleportMenuOpen = false;
let teleportMenuLevels = Array.from({ length: 60 }, (_, i) => i + 1);
let teleportMenuSelected = 0;

let bossMenuOpen = false;
let bossMenuOptions = [
    { label: 'Boss 1 (Level 5)', level: 5 },
    { label: 'Boss 2 (Level 10)', level: 10 },
    { label: 'Boss 3 (Level 15)', level: 15 },
    { label: 'Water Dragon (Level 20)', level: 20 },
    { label: 'Rock Giant (Level 31)', level: 31 }
];
let bossMenuSelected = 0;

window.addEventListener('keydown', function (e) {
    // Spacebar or E to shoot right
    if ((e.code === 'Space' || e.key === ' ' || e.key === 'e' || e.key === 'E') && player.alive) {
        shoot({
            clientX: player.x + 100, // right
            clientY: player.y,
            preventDefault: () => { }
        });
        // Play gunshot sound (clone to allow overlapping)
        try {
            const shot = gunshotAudio.cloneNode();
            shot.currentTime = 0;
            shot.play();
        } catch (err) { }
        e.preventDefault();
    }
    // Q to shoot left
    if ((e.key === 'q' || e.key === 'Q') && player.alive) {
        shoot({
            clientX: player.x - 100, // left
            clientY: player.y,
            preventDefault: () => { }
        });
        // Play gunshot sound (clone to allow overlapping)
        try {
            const shot = gunshotAudio.cloneNode();
            shot.currentTime = 0;
            shot.play();
        } catch (err) { }
        e.preventDefault();
    }
    // Shift to respawn if dead and has lives left
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !player.alive && player.lives > 0) {
        player.x = WAREHOUSE_W / 2;
        player.y = WAREHOUSE_H / 2;
        player.alive = true;
        player.color = randomColor();
        bullets = [];
        enemiesHit = 0;
        multiShot = false;
        level = checkpointLevel;
        spawnEnemies();
        e.preventDefault();
    }
    // Tab to teleport to your latest checkpoint (level 5, 6, 10, 11, or 1)
    if ((e.code === 'Tab' || e.key === 'Tab')) {
        player.x = WAREHOUSE_W / 2;
        player.y = WAREHOUSE_H / 2;
        player.alive = true;
        player.color = randomColor();
        player.lives = 3;
        bullets = [];
        enemiesHit = 0;
        multiShot = false;
        level = checkpointLevel;
        spawnEnemies();
        e.preventDefault();
    }
    // Alt key opens boss menu
    if ((e.code === 'AltLeft' || e.code === 'AltRight' || e.key === 'Alt') && !bossMenuOpen && !teleportMenuOpen) {
        bossMenuOpen = true;
        bossMenuSelected = 0;
        e.preventDefault();
        return;
    }
    // If boss menu is open, handle navigation and selection
    if (bossMenuOpen) {
        if (e.code === 'ArrowUp' || e.key === 'ArrowUp' || e.key === 'w') {
            bossMenuSelected = (bossMenuSelected - 1 + bossMenuOptions.length) % bossMenuOptions.length;
            e.preventDefault();
        } else if (e.code === 'ArrowDown' || e.key === 'ArrowDown' || e.key === 's') {
            bossMenuSelected = (bossMenuSelected + 1) % bossMenuOptions.length;
            e.preventDefault();
        } else if (e.code === 'Enter' || e.key === 'Enter' || e.code === 'Space' || e.key === ' ') {
            // Teleport to selected boss level
            let targetLevel = bossMenuOptions[bossMenuSelected].level;
            player.x = WAREHOUSE_W / 2;
            player.y = WAREHOUSE_H / 2;
            player.alive = true;
            player.color = randomColor();
            player.lives = 3;
            bullets = [];
            enemiesHit = 0;
            multiShot = false;
            level = targetLevel;
            spawnEnemies();
            bossMenuOpen = false;
            e.preventDefault();
        } else if (e.code === 'Escape' || e.key === 'Escape') {
            bossMenuOpen = false;
            e.preventDefault();
        }
        return;
    }
    // Enter key opens teleport menu (if not in boss menu)
    if ((e.code === 'Enter' || e.key === 'Enter') && !teleportMenuOpen && !bossMenuOpen) {
        teleportMenuOpen = true;
        teleportMenuSelected = 0;
        e.preventDefault();
        return;
    }
    // If teleport menu is open, handle navigation and selection
    if (teleportMenuOpen) {
        if (e.code === 'ArrowUp' || e.key === 'ArrowUp' || e.key === 'w') {
            teleportMenuSelected = (teleportMenuSelected - 1 + teleportMenuLevels.length) % teleportMenuLevels.length;
            e.preventDefault();
        } else if (e.code === 'ArrowDown' || e.key === 'ArrowDown' || e.key === 's') {
            teleportMenuSelected = (teleportMenuSelected + 1) % teleportMenuLevels.length;
            e.preventDefault();
        } else if (e.code === 'Enter' || e.key === 'Enter' || e.code === 'Space' || e.key === ' ') {
            // Teleport to selected level
            let targetLevel = teleportMenuLevels[teleportMenuSelected];
            player.x = WAREHOUSE_W / 2;
            player.y = WAREHOUSE_H / 2;
            player.alive = true;
            player.color = randomColor();
            player.lives = 3;
            bullets = [];
            enemiesHit = 0;
            multiShot = false;
            level = targetLevel;
            spawnEnemies();
            teleportMenuOpen = false;
            e.preventDefault();
        } else if (e.code === 'Escape' || e.key === 'Escape') {
            teleportMenuOpen = false;
            e.preventDefault();
        }
        return;
    }
});

function randomColor() {
    const colors = ['#0f0', '#f00', '#00f', '#ff0', '#0ff', '#f0f'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function shoot(e) {
    if (!player.alive) return;
    // Mouse angle or spacebar
    let rect = canvas.getBoundingClientRect();
    let mx, my;
    if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
        mx = e.clientX - rect.left;
        my = e.clientY - rect.top;
    } else {
        // Default direction (right)
        mx = player.x + Math.cos(player.angle || 0) * 100;
        my = player.y + Math.sin(player.angle || 0) * 100;
    }
    let angle = Math.atan2(my - player.y, mx - player.x);
    player.angle = angle;
    // Gun block offset (same as in drawTurtle)
    let gunOffsetX = Math.cos(angle) * (PLAYER_SIZE / 3 + PLAYER_SIZE / 5);
    let gunOffsetY = Math.sin(angle) * (PLAYER_SIZE / 5);
    let bulletStartX = player.x + gunOffsetX;
    let bulletStartY = player.y + gunOffsetY;
    if (multiShot) {
        // Fire ten bullets in a spread (36 degrees total, 4 degree increments)
        let numBullets = 10;
        let spreadTotal = Math.PI / 5; // ~36 degrees
        let startAngle = angle - spreadTotal / 2;
        let angleStep = spreadTotal / (numBullets - 1);
        for (let i = 0; i < numBullets; i++) {
            let spreadAngle = startAngle + i * angleStep;
            bullets.push({
                x: bulletStartX,
                y: bulletStartY,
                angle: spreadAngle,
                fromPlayer: true,
                shooter: player
            });
        }
        multiShot = false;
    } else {
        bullets.push({
            x: bulletStartX,
            y: bulletStartY,
            angle: angle,
            fromPlayer: true,
            shooter: player
        });
    }
}

function update() {
    // Sky Dragon Boss (level 29)
    //
    //
    // Player movement
    let speed = 4;
    // Define floor boundaries (inside warehouse walls)
    const FLOOR_LEFT = 30;
    const FLOOR_TOP = 30;
    const FLOOR_RIGHT = WAREHOUSE_W - 30;
    const FLOOR_BOTTOM = WAREHOUSE_H - 30;
    if (keys['w'] || keys['ArrowUp']) player.y -= speed;
    if (keys['s'] || keys['ArrowDown']) player.y += speed;
    if (keys['a'] || keys['ArrowLeft']) player.x -= speed;
    if (keys['d'] || keys['ArrowRight']) player.x += speed;
    // Clamp player to floor area
    player.x = Math.max(FLOOR_LEFT + PLAYER_SIZE / 2, Math.min(FLOOR_RIGHT - PLAYER_SIZE / 2, player.x));
    player.y = Math.max(FLOOR_TOP + PLAYER_SIZE / 2, Math.min(FLOOR_BOTTOM - PLAYER_SIZE / 2, player.y));

    // Player throws with mouse or spacebar (handled in shoot), enemies throw automatically at player only
    let livingEnemies = enemies.filter(e => e.alive);
    const now = Date.now();
    // Move and clamp all enemies to floor area
    for (let enemy of enemies) {
        if (enemy.alive) {
            // Move toward player
            let dx = player.x - enemy.x;
            let dy = player.y - enemy.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 10) {
                let speed = 2.2; // Enemy speed
                enemy.x += (dx / dist) * speed;
                enemy.y += (dy / dist) * speed;
            }
            // Enemy fires bullet at player every 3 seconds
            if (!enemy.lastShot) enemy.lastShot = 0;
            if (now - enemy.lastShot > 3000) {
                let angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                // Gun block offset (same as in drawTurtle)
                let gunOffsetX = Math.cos(angle) * (ENEMY_SIZE / 3 + ENEMY_SIZE / 5);
                let gunOffsetY = Math.sin(angle) * (ENEMY_SIZE / 5);
                let bulletStartX = enemy.x + gunOffsetX;
                let bulletStartY = enemy.y + gunOffsetY;
                bullets.push({
                    x: bulletStartX,
                    y: bulletStartY,
                    angle: angle,
                    fromPlayer: false,
                    shooter: enemy
                });
                enemy.lastShot = now;
            }
        }
        // Clamp to floor area
        enemy.x = Math.max(FLOOR_LEFT + ENEMY_SIZE / 2, Math.min(FLOOR_RIGHT - ENEMY_SIZE / 2, enemy.x));
        enemy.y = Math.max(FLOOR_TOP + ENEMY_SIZE / 2, Math.min(FLOOR_BOTTOM - ENEMY_SIZE / 2, enemy.y));
    }
    // Clamp boss to floor area
    if (boss) {
        boss.x = Math.max(FLOOR_LEFT + ENEMY_SIZE * 0.75, Math.min(FLOOR_RIGHT - ENEMY_SIZE * 0.75, boss.x));
        boss.y = Math.max(FLOOR_TOP + ENEMY_SIZE * 0.75, Math.min(FLOOR_BOTTOM - ENEMY_SIZE * 0.75, boss.y));
    }
    // Level progression: if all enemies and boss are dead, go to next level
    let allEnemiesDead = enemies.every(e => !e.alive);
    let bossDead = !boss || (boss && !boss.alive && !bossSpikePhase);
    if (allEnemiesDead && bossDead) {
        level++;
        if (level > 60) {
            player.alive = false;
            player.lives = 0;
            gameEnded = true;
            return;
        }
        // Set checkpoint if boss level, level 6, level 10, level 11, level 15, level 16, level 20, or level 21 is reached
        if (level === 5 || level === 6 || level === 10 || level === 11 || level === 15 || level === 16 || level === 20 || level === 21) {
            checkpointLevel = level;
            player.lives = 3; // Restore lives at checkpoint
        }
        spawnEnemies();
        // Clear all enemy explosions for new level
        enemyExplosions = [];
        // Clear all bullets after a level is over
        bullets = [];
        return; // Skip rest of update for this frame
    }
    // Boss logic
    if (boss && boss.alive) {
        // Water Dragon Boss (level 20)
        if (boss.bossType === 'waterdragon') {
            // Animate rising out of well for first 60 frames
            if (boss.appearAnim < 60) {
                boss.appearAnim++;
                boss.y = boss.wellY + 32 - boss.appearAnim * 1.2; // Rise up from well
            } else {
                boss.y = boss.wellY - 40;
            }
            // Water Dragon does not move from the well
            boss.x = boss.wellX;
            // Fire water balls at player every 1.2s
            if (!boss.lastShot) boss.lastShot = 0;
            if (Date.now() - boss.lastShot > 1200) {
                let baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                // Fire 3 water balls in a spread
                let numBalls = 3;
                let spreadTotal = Math.PI / 7; // ~25 degrees
                let startAngle = baseAngle - spreadTotal / 2;
                let angleStep = spreadTotal / (numBalls - 1);
                for (let i = 0; i < numBalls; i++) {
                    let spread = startAngle + i * angleStep;
                    bullets.push({
                        x: boss.x,
                        y: boss.y + 20, // from mouth
                        angle: spread,
                        fromPlayer: false,
                        shooter: boss,
                        water: true // Mark as water ball
                    });
                }
                boss.lastShot = Date.now();
            }
        } else if (boss.bossType === 3) {
            if (!boss.charging && !boss.stunned && now - (boss.lastCharge || 0) > 2000) {
                boss.charging = true;
                boss.chargeAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                boss.chargeStart = now;
                boss.chargeHits = 0;
                boss.color = '#f00';
            }
            if (boss.charging) {
                // Move at player speed (speed 4)
                boss.chargeAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                boss.x += Math.cos(boss.chargeAngle) * 4;
                boss.y += Math.sin(boss.chargeAngle) * 4;
                // If boss rams player, kill player instantly
                let dx = player.x - boss.x;
                let dy = player.y - boss.y;
                let dist = Math.hypot(dx, dy);
                if (dist < (PLAYER_SIZE + ENEMY_SIZE * 1.5) / 2) {
                    player.lives = 0;
                    player.alive = false;
                }
                // If shot 3 times, stop charge and stun
                if (boss.chargeHits >= 3) {
                    boss.charging = false;
                    boss.stunned = true;
                    boss.stunStart = now;
                    boss.color = '#0ff';
                    boss.lastCharge = now;
                }
            } else if (boss.stunned) {
                // Stunned for 2 seconds
                if (now - boss.stunStart > 2000) {
                    boss.stunned = false;
                    boss.color = '#0ff';
                }
            }
            // No normal movement or shooting for boss 3
        } else {
            // Boss 1 and 2 logic continues here
            // Boss charge/ram logic
            if (!boss.stunned && now - (boss.lastCharge || 0) > 5000 && !boss.charging) {
                boss.charging = true;
                boss.chargeAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                boss.chargeStart = now;
                boss.color = '#f00'; // Turn red
            }
            if (boss.charging) {
                // All bosses: charge at player speed (speed 4)
                boss.chargeAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                // If boss 1 rams player, kill player instantly
                let dx = player.x - boss.x;
                let dy = player.y - boss.y;
                let dist = Math.hypot(dx, dy);
                if (dist < (PLAYER_SIZE + ENEMY_SIZE * 1.5) / 2 || (boss.bossType === 2 && dist < 50)) {
                    player.lives = 0;
                    player.alive = false;
                }
                boss.x += Math.cos(boss.chargeAngle) * 4;
                boss.y += Math.sin(boss.chargeAngle) * 4;
                // End charge after 3 seconds for boss 1, 1 second for boss 2, or if not shot (boss 3 handled above)
                if ((boss.bossType === 1 && now - boss.chargeStart > 3000) || (boss.bossType === 2 && now - boss.chargeStart > 1000)) {
                    boss.charging = false;
                    boss.stunned = true;
                    boss.stunStart = now;
                    boss.color = '#0ff';
                    boss.lastCharge = now;
                }
            } else if (boss.stunned) {
                // Stunned for 5 seconds
                if (now - boss.stunStart > 5000) {
                    boss.stunned = false;
                    boss.color = '#fff';
                }
            } else {
                // Normal movement toward player (same as player, speed 4)
                let dx = player.x - boss.x;
                let dy = player.y - boss.y;
                let dist = Math.hypot(dx, dy);
                if (dist > 10) {
                    boss.x += (dx / dist) * 4;
                    boss.y += (dy / dist) * 4;
                }
            }
            // Boss shoot (different patterns for different bosses)
            if (!boss.charging && !boss.stunned && now - (boss.lastShot || 0) > 3000) {
                let baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                // Gun block offset for boss
                let bossSize = ENEMY_SIZE * 1.5;
                let gunOffsetX = Math.cos(baseAngle) * (bossSize / 3 + bossSize / 5);
                let gunOffsetY = Math.sin(baseAngle) * (bossSize / 5);
                let bulletStartX = boss.x + gunOffsetX;
                let bulletStartY = boss.y + gunOffsetY;
                if (boss.bossType === 2) {
                    // Level 10 boss: 6 balls, 60 degree spread
                    let numBalls = 6;
                    let spreadTotal = Math.PI / 3; // 60 degrees
                    let startAngle = baseAngle - spreadTotal / 2;
                    let angleStep = spreadTotal / (numBalls - 1);
                    for (let i = 0; i < numBalls; i++) {
                        let spread = startAngle + i * angleStep;
                        bullets.push({
                            x: bulletStartX,
                            y: bulletStartY,
                            angle: spread,
                            fromPlayer: false,
                            shooter: boss
                        });
                    }
                } else if (boss.bossType === 1) {
                    // Normal boss: 3 balls, 20 degree spread
                    for (let i = -1; i <= 1; i++) {
                        let spread = baseAngle + i * (Math.PI / 18); // 10 degree spread
                        bullets.push({
                            x: bulletStartX,
                            y: bulletStartY,
                            angle: spread,
                            fromPlayer: false,
                            shooter: boss
                        });
                    }
                }
                boss.lastShot = now;
            }
        }
        // Boss charge/ram logic
        if (!boss.stunned && now - (boss.lastCharge || 0) > 5000 && !boss.charging) {
            boss.charging = true;
            boss.chargeAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
            boss.chargeStart = now;
            boss.color = '#f00'; // Turn red
        }
        if (boss.charging) {
            // Boss 1: slower charge, ends after 3 seconds or if shot
            if (boss.bossType === 1) {
                boss.chargeAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
                // If boss 1 rams player, kill player instantly
                let dx = player.x - boss.x;
                let dy = player.y - boss.y;
                let dist = Math.hypot(dx, dy);
                if (dist < (PLAYER_SIZE + ENEMY_SIZE * 1.5) / 2) {
                    player.lives = 0;
                    player.alive = false;
                }
                // Move at player speed (speed 4)
                boss.x += Math.cos(boss.chargeAngle) * 4;
                boss.y += Math.sin(boss.chargeAngle) * 4;
                // End charge after 3 seconds if not shot
                if (now - boss.chargeStart > 3000) {
                    boss.charging = false;
                    boss.stunned = true;
                    boss.stunStart = now;
                    boss.color = '#0ff';
                    boss.lastCharge = now;
                }
            } else {
                // Boss 2: fast charge
                boss.x += Math.cos(boss.chargeAngle) * 8;
                boss.y += Math.sin(boss.chargeAngle) * 8;
                let dx = player.x - boss.x;
                let dy = player.y - boss.y;
                let dist = Math.hypot(dx, dy);
                if (dist < 50 || now - boss.chargeStart > 1000) {
                    boss.charging = false;
                    boss.stunned = true;
                    boss.stunStart = now;
                    boss.color = '#0ff'; // Cyan when stunned
                    boss.lastCharge = now;
                }
            }
        } else if (boss.stunned) {
            // Stunned for 5 seconds
            if (now - boss.stunStart > 5000) {
                boss.stunned = false;
                boss.color = '#fff';
            }
        } else {
            // Normal movement toward player
            let dx = player.x - boss.x;
            let dy = player.y - boss.y;
            let dist = Math.hypot(dx, dy);
            if (dist > 10) {
                boss.x += (dx / dist) * 1.2;
                boss.y += (dy / dist) * 1.2;
            }
        }
        // Boss shoot (different patterns for different bosses)
        if (!boss.charging && !boss.stunned && now - (boss.lastShot || 0) > 3000) {
            let baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
            // Gun block offset for boss
            let bossSize = ENEMY_SIZE * 1.5;
            let gunOffsetX = Math.cos(baseAngle) * (bossSize / 3 + bossSize / 5);
            let gunOffsetY = Math.sin(baseAngle) * (bossSize / 5);
            let bulletStartX = boss.x + gunOffsetX;
            let bulletStartY = boss.y + gunOffsetY;
            if (boss.bossType === 2) {
                // Level 10 boss: 6 balls, 60 degree spread
                let numBalls = 6;
                let spreadTotal = Math.PI / 3; // 60 degrees
                let startAngle = baseAngle - spreadTotal / 2;
                let angleStep = spreadTotal / (numBalls - 1);
                for (let i = 0; i < numBalls; i++) {
                    let spread = startAngle + i * angleStep;
                    bullets.push({
                        x: bulletStartX,
                        y: bulletStartY,
                        angle: spread,
                        fromPlayer: false,
                        shooter: boss
                    });
                }
            } else if (boss.bossType === 1) {
                // Normal boss: 3 balls, 20 degree spread
                for (let i = -1; i <= 1; i++) {
                    let spread = baseAngle + i * (Math.PI / 18); // 10 degree spread
                    bullets.push({
                        x: bulletStartX,
                        y: bulletStartY,
                        angle: spread,
                        fromPlayer: false,
                        shooter: boss
                    });
                }
            }
            boss.lastShot = now;
        }
    } else if (boss && !boss.alive) {
        // Boss defeated, next level
        level++;
        if (level > 60) {
            player.alive = false;
            player.lives = 0;
            gameEnded = true;
            return;
        }
        // Set checkpoint if boss level, level 6, level 10, level 11, level 15, level 16, level 20, or level 21 is reached
        if (level === 5 || level === 6 || level === 10 || level === 11 || level === 15 || level === 16 || level === 20 || level === 21) {
            checkpointLevel = level;
            player.lives = 3; // Restore lives at checkpoint
        }
        spawnEnemies();
        // Clear all enemy explosions for new level
        enemyExplosions = [];
        // Clear all bullets after a level is over
        bullets = [];
    }

    // Boss spike phase logic
    if (boss && !boss.alive && !bossSpikePhase && (boss.bossType === 1 || boss.bossType === 2)) {
        // Enter spike phase: revive boss with HP+1, enable spikes
        bossSpikePhase = true;
        boss.alive = true;
        boss.lives = (boss.bossType === 1 ? 10 : 20) + 1;
        boss.color = '#f0f'; // Change color to indicate spike phase
        bossSpikes = [];
        bossSpikeTimer = 0;
    }
    // Spike attack logic (active only in spike phase)
    if (bossSpikePhase && boss && boss.alive) {
        bossSpikeTimer++;
        // Every 60 frames (~1s), spawn a spike at a random floor location
        if (bossSpikeTimer % 60 === 0 && bossSpikes.length < 8) {
            let sx = FLOOR_LEFT + 40 + Math.random() * (FLOOR_RIGHT - FLOOR_LEFT - 80);
            let sy = FLOOR_TOP + 40 + Math.random() * (FLOOR_BOTTOM - FLOOR_TOP - 80);
            bossSpikes.push({ x: sx, y: sy, created: Date.now() });
        }
        // Remove spikes after 2 seconds
        let nowT = Date.now();
        for (let i = bossSpikes.length - 1; i >= 0; i--) {
            if (nowT - bossSpikes[i].created > 2000) bossSpikes.splice(i, 1);
        }
        // Check player collision with spikes
        for (let spike of bossSpikes) {
            let dx = player.x - spike.x;
            let dy = player.y - spike.y;
            if (Math.abs(dx) < 24 && Math.abs(dy) < 24 && player.alive) {
                player.lives = Math.max(0, player.lives - 1);
                player.alive = player.lives > 0;
            }
        }
    }
    // When boss dies in spike phase, end phase and proceed to next level
    if (bossSpikePhase && boss && !boss.alive) {
        bossSpikePhase = false;
        bossSpikes = [];
    }

    // Bullets
    const PLAYER_BULLET_SPEED = 7; // Faster player bullet speed
    const ENEMY_BULLET_SPEED = 4; // Enemy bullet speed is now 4
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        let speed = b.fromPlayer ? PLAYER_BULLET_SPEED : ENEMY_BULLET_SPEED;
        b.x += Math.cos(b.angle) * speed;
        b.y += Math.sin(b.angle) * speed;
        // Remove if out of bounds
        if (b.x < 0 || b.x > WAREHOUSE_W || b.y < 0 || b.y > WAREHOUSE_H) {
            bullets.splice(i, 1);
            continue;
        }
        // Hit enemies (including friendly fire)
        for (let enemy of enemies) {
            if (!enemy.alive) continue;
            if (b.shooter === enemy) continue; // Don't hit self
            if (Math.abs(b.x - enemy.x) < ENEMY_SIZE / 2 && Math.abs(b.y - enemy.y) < ENEMY_SIZE / 2) {
                // Add explosion effect (liquid burst)
                enemyExplosions.push({
                    x: enemy.x,
                    y: enemy.y,
                    created: Date.now()
                });
                if (enemy.lives > 1) {
                    enemy.lives--;
                } else {
                    enemy.alive = false;
                }
                bullets.splice(i, 1);
                // Track hits for multi shot and auto-kill
                if (b.shooter === player) {
                    enemiesHit++;
                    if (enemiesHit % 3 === 0) {
                        multiShot = true;
                    }
                    if (enemiesHit % 10 === 0) {
                        // Auto-kill 10 more turtles
                        let autoKilled = 0;
                        for (let autoEnemy of enemies) {
                            if (autoKilled >= 10) break;
                            if (autoEnemy.alive) {
                                // Add explosion for auto-killed
                                enemyExplosions.push({
                                    x: autoEnemy.x,
                                    y: autoEnemy.y,
                                    created: Date.now()
                                });
                                autoEnemy.alive = false;
                                autoKilled++;
                            }
                        }
                    }
                }
                break;
            }
        }
        // Boss hit (only when stunned, except: boss 1 can be shot to stop charge, boss 3 charge logic, rockgiant always takes damage)
        if (boss && boss.alive && Math.abs(b.x - boss.x) < ENEMY_SIZE / 2 && Math.abs(b.y - boss.y) < ENEMY_SIZE / 2) {
            if (b.shooter === player) {
                if (boss.bossType === 'waterdragon') {
                    boss.lives--;
                    if (boss.lives <= 0) boss.alive = false;
                } else if (boss.bossType === 'rockgiant') {
                    boss.lives--;
                    if (boss.lives <= 0) boss.alive = false;
                } else if (boss.bossType === 1 && boss.charging) {
                    boss.charging = false;
                    boss.stunned = true;
                    boss.stunStart = Date.now();
                    boss.color = '#0ff';
                    boss.lastCharge = Date.now();
                } else if (boss.bossType === 3 && boss.charging) {
                    boss.chargeHits = (boss.chargeHits || 0) + 1;
                    boss.lives--;
                    if (boss.lives <= 0) {
                        boss.alive = false;
                    }
                } else if (boss.stunned) {
                    boss.lives--;
                    if (boss.lives <= 0) {
                        boss.alive = false;
                    }
                }
            }
            bullets.splice(i, 1);
            continue;
        }
        // Draw rock walls for Rock Giant boss
        if (boss && boss.bossType === 'rockgiant' && boss.walls) {
            for (let wall of boss.walls) {
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(wall.x, wall.y, 38, 38, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#888';
                ctx.globalAlpha = 0.92;
                ctx.shadowColor = '#bbb';
                ctx.shadowBlur = 16;
                ctx.fill();
                ctx.restore();
            }
        }
        // Draw rock giant boss (level 31)
        if (boss && boss.alive && boss.bossType === 'rockgiant') {
            ctx.save();
            ctx.translate(boss.x, boss.y);
            // --- Rock Giant Drawing ---
            // Lower body: big jagged boulder base
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-60, 60);
            ctx.lineTo(-70, 20);
            ctx.lineTo(-50, -40);
            ctx.lineTo(-30, -70);
            ctx.lineTo(0, -90);
            ctx.lineTo(30, -70);
            ctx.lineTo(50, -40);
            ctx.lineTo(70, 20);
            ctx.lineTo(60, 60);
            ctx.closePath();
            ctx.fillStyle = '#888';
            ctx.shadowColor = '#bbb';
            ctx.shadowBlur = 30;
            ctx.fill();
            ctx.restore();

            // Torso: rough, blocky rock
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-40, 10);
            ctx.lineTo(-50, -30);
            ctx.lineTo(-20, -60);
            ctx.lineTo(0, -70);
            ctx.lineTo(20, -60);
            ctx.lineTo(50, -30);
            ctx.lineTo(40, 10);
            ctx.closePath();
            ctx.fillStyle = '#aaa';
            ctx.shadowColor = '#eee';
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.restore();

            // Arms: segmented boulders
            for (let i = -1; i <= 1; i += 2) {
                ctx.save();
                ctx.rotate(i * 0.12);
                // Upper arm
                ctx.beginPath();
                ctx.ellipse(i * 55, -20, 18, 32, 0.2 * i, 0, Math.PI * 2);
                ctx.fillStyle = '#bbb';
                ctx.shadowColor = '#888';
                ctx.shadowBlur = 10;
                ctx.fill();
                // Forearm
                ctx.beginPath();
                ctx.ellipse(i * 80, 20, 14, 22, 0.2 * i, 0, Math.PI * 2);
                ctx.fillStyle = '#aaa';
                ctx.shadowColor = '#bbb';
                ctx.shadowBlur = 8;
                ctx.fill();
                // Fist
                ctx.beginPath();
                ctx.ellipse(i * 95, 38, 13, 13, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#888';
                ctx.shadowColor = '#bbb';
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.restore();
            }

            // Head: blocky, with rocky jaw and brow
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-22, -65);
            ctx.lineTo(-28, -90);
            ctx.lineTo(0, -105);
            ctx.lineTo(28, -90);
            ctx.lineTo(22, -65);
            ctx.closePath();
            ctx.fillStyle = '#bbb';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 10;
            ctx.fill();
            // Jaw
            ctx.beginPath();
            ctx.moveTo(-18, -65);
            ctx.lineTo(-10, -55);
            ctx.lineTo(0, -52);
            ctx.lineTo(10, -55);
            ctx.lineTo(18, -65);
            ctx.closePath();
            ctx.fillStyle = '#888';
            ctx.shadowColor = '#bbb';
            ctx.shadowBlur = 4;
            ctx.fill();
            // Eyes
            ctx.beginPath();
            ctx.arc(-8, -85, 5, 0, Math.PI * 2);
            ctx.arc(8, -85, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#222';
            ctx.shadowBlur = 0;
            ctx.fill();
            // Angry brow
            ctx.beginPath();
            ctx.moveTo(-14, -92);
            ctx.lineTo(-2, -88);
            ctx.moveTo(14, -92);
            ctx.lineTo(2, -88);
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();

            // Shoulder boulders
            for (let i = -1; i <= 1; i += 2) {
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(i * 45, -35, 18, 14, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#888';
                ctx.shadowColor = '#bbb';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();
            }

            // HP bar
            ctx.save();
            ctx.fillStyle = '#222';
            ctx.fillRect(-80, -120, 160, 18);
            ctx.fillStyle = '#bbb';
            ctx.fillRect(-80, -120, 160 * (boss.lives / 200), 18);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-80, -120, 160, 18);
            ctx.font = '22px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('ROCK GIANT: ' + boss.lives + ' HP', -90, -130);
            ctx.restore();
            ctx.restore();
            ctx.restore();
        }
        // Hit player
        if (b.shooter !== player && Math.abs(b.x - player.x) < PLAYER_SIZE / 2 && Math.abs(b.y - player.y) < PLAYER_SIZE / 2) {
            // Make unicorn's killing magic (magic: true) dodgable: only kills if player is not dashing (or add a brief warning before hit)
            if (b.magic) {
                // Make the magic bolt only kill if the player is not moving fast (simulate dodge)
                // If player moved more than 18px since last frame, consider it a dodge
                if (!player._lastX) player._lastX = player.x;
                if (!player._lastY) player._lastY = player.y;
                let dx = player.x - player._lastX;
                let dy = player.y - player._lastY;
                let dist = Math.sqrt(dx * dx + dy * dy);
                player._lastX = player.x;
                player._lastY = player.y;
                if (dist > 18) {
                    // Dodged!
                    bullets.splice(i, 1);
                    continue;
                }
            }
            if (player.lives > 1) {
                player.lives--;
                player.alive = false;
            } else {
                player.lives = 0;
                player.alive = false;
            }
            bullets.splice(i, 1);
            continue;
        }
    }
}

// Turtle walking animation state
let turtleAnimTime = 0;

function drawTurtle(x, y, size, color, isPlayer, vx = 0, vy = 0) {
    ctx.save();
    ctx.translate(x, y);
    // Animate legs: swing based on time and movement
    let t = turtleAnimTime;
    let speed = Math.sqrt(vx * vx + vy * vy);
    let swing = speed > 0.5 ? Math.sin(t * 0.15 + (x + y) * 0.01) * 8 : 0;
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(-size / 2, -size / 3, size, size * 2 / 3);
    // Head
    ctx.fillStyle = '#fff';
    ctx.fillRect(-size / 6, -size / 2, size / 3, size / 3);
    // Legs (animated)
    ctx.fillStyle = color;
    // Front left leg
    ctx.save();
    ctx.translate(-size / 2 + size / 12, -size / 3 + size / 12);
    ctx.rotate(-swing * 0.08);
    ctx.fillRect(-size / 12, -size / 12, size / 6, size / 6);
    ctx.restore();
    // Front right leg
    ctx.save();
    ctx.translate(size / 2 - size / 12, -size / 3 + size / 12);
    ctx.rotate(swing * 0.08);
    ctx.fillRect(-size / 12, -size / 12, size / 6, size / 6);
    ctx.restore();
    // Back left leg
    ctx.save();
    ctx.translate(-size / 2 + size / 12, size / 3 + size / 12);
    ctx.rotate(swing * 0.08);
    ctx.fillRect(-size / 12, -size / 12, size / 6, size / 6);
    ctx.restore();
    // Back right leg
    ctx.save();
    ctx.translate(size / 2 - size / 12, size / 3 + size / 12);
    ctx.rotate(-swing * 0.08);
    ctx.fillRect(-size / 12, -size / 12, size / 6, size / 6);
    ctx.restore();
    // Draw gray block (gun) at front of turtle
    ctx.save();
    ctx.rotate(isPlayer ? player.angle : 0);
    ctx.fillStyle = '#888';
    ctx.fillRect(size / 3, -size / 8, size / 2.5, size / 4);
    ctx.restore();
    // Player mark
    if (isPlayer) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-size / 2, -size / 3, size, size * 2 / 3);
    }
    ctx.restore();
}

function draw() {
    if (typeof gameEnded !== 'undefined' && gameEnded) {
        ctx.save();
        ctx.globalAlpha = 0.97;
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 64px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Congratulations!', canvas.width / 2, canvas.height / 2 - 60);
        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = '#ff0';
        ctx.fillText('You have completed all 60 levels!', canvas.width / 2, canvas.height / 2);
        ctx.font = '28px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('Thank you for playing!', canvas.width / 2, canvas.height / 2 + 60);
        ctx.restore();
        return;
    }
    // Boss menu overlay
    if (bossMenuOpen) {
        ctx.save();
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = '#220033';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#ff00ff';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS MENU', canvas.width / 2, canvas.height / 2 - 180);
        ctx.font = '32px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('Use ↑/↓ or W/S to select, Enter/Space to fight, Esc to cancel', canvas.width / 2, canvas.height / 2 - 120);
        for (let i = 0; i < bossMenuOptions.length; i++) {
            let y = canvas.height / 2 - 40 + i * 50;
            ctx.font = bossMenuSelected === i ? 'bold 40px sans-serif' : '32px sans-serif';
            ctx.fillStyle = bossMenuSelected === i ? '#ff0' : '#fff';
            ctx.fillText(bossMenuOptions[i].label, canvas.width / 2, y);
        }
        ctx.textAlign = 'left';
        ctx.restore();
        return;
    }
    // Teleport menu overlay
    if (teleportMenuOpen) {
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        ctx.font = 'bold 48px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('TELEPORT MENU', canvas.width / 2, canvas.height / 2 - 180);
        ctx.font = '32px sans-serif';
        ctx.fillText('Use ↑/↓ or W/S to select, Enter/Space to teleport, Esc to cancel', canvas.width / 2, canvas.height / 2 - 120);
        for (let i = 0; i < teleportMenuLevels.length; i++) {
            let y = canvas.height / 2 - 40 + i * 50;
            ctx.font = teleportMenuSelected === i ? 'bold 40px sans-serif' : '32px sans-serif';
            ctx.fillStyle = teleportMenuSelected === i ? '#ff0' : '#fff';
            ctx.fillText('Level ' + teleportMenuLevels[i], canvas.width / 2, y);
        }
        ctx.textAlign = 'left';
        ctx.restore();
        return;
    }
    // Draw unicorn deadly beams
    if (window.unicornBeams) {
        for (let b of window.unicornBeams) {
            if (!b.active) continue;
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.strokeStyle = '#ff00ff';
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 30;
            ctx.lineWidth = 18;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + Math.cos(b.angle) * 1200, b.y + Math.sin(b.angle) * 1200);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#fff';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + Math.cos(b.angle) * 1200, b.y + Math.sin(b.angle) * 1200);
            ctx.stroke();
            ctx.restore();
        }
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background: warehouse, village, or crystal caverns depending on world
    if (level >= 1 && level <= 15) {
        // ...existing code for warehouse background...
        ctx.fillStyle = '#e0d7c3';
        ctx.fillRect(0, 0, WAREHOUSE_W, WAREHOUSE_H);
        ctx.save();
        ctx.strokeStyle = '#d2c6a6';
        ctx.lineWidth = 2;
        for (let x = 0; x < WAREHOUSE_W; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, WAREHOUSE_H);
            ctx.stroke();
        }
        for (let y = 0; y < WAREHOUSE_H; y += 60) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WAREHOUSE_W, y);
            ctx.stroke();
        }
        ctx.restore();
        ctx.fillStyle = '#b0b0b0';
        ctx.fillRect(0, 0, WAREHOUSE_W, 30);
        ctx.fillRect(0, WAREHOUSE_H - 30, WAREHOUSE_W, 30);
        ctx.fillRect(0, 0, 30, WAREHOUSE_H);
        ctx.fillRect(WAREHOUSE_W - 30, 0, 30, WAREHOUSE_H);
        for (let i = 0; i < 6; i++) {
            let cx = 80 + i * 120;
            let cy = 120 + ((i % 2) * 180);
            ctx.save();
            ctx.fillStyle = '#a97c50';
            ctx.strokeStyle = '#6b4a2b';
            ctx.lineWidth = 4;
            ctx.fillRect(cx, cy, 60, 60);
            ctx.strokeRect(cx, cy, 60, 60);
            ctx.beginPath();
            ctx.moveTo(cx, cy + 20);
            ctx.lineTo(cx + 60, cy + 20);
            ctx.moveTo(cx, cy + 40);
            ctx.lineTo(cx + 60, cy + 40);
            ctx.moveTo(cx + 20, cy);
            ctx.lineTo(cx + 20, cy + 60);
            ctx.moveTo(cx + 40, cy);
            ctx.lineTo(cx + 40, cy + 60);
            ctx.stroke();
            ctx.restore();
        }
        for (let i = 0; i < 2; i++) {
            let sx = 200 + i * 300;
            ctx.save();
            ctx.fillStyle = '#888';
            ctx.fillRect(sx, 60, 20, WAREHOUSE_H - 120);
            ctx.restore();
        }
        ctx.save();
        ctx.fillStyle = '#666';
        ctx.fillRect(WAREHOUSE_W - 60, WAREHOUSE_H / 2 - 60, 50, 120);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 6;
        ctx.strokeRect(WAREHOUSE_W - 60, WAREHOUSE_H / 2 - 60, 50, 120);
        ctx.restore();
    } else if (level >= 16 && level <= 30) {
        // ...existing code for village background...
        ctx.fillStyle = '#b7e3a8';
        ctx.fillRect(0, 0, WAREHOUSE_W, WAREHOUSE_H);
        ctx.save();
        ctx.strokeStyle = '#c2a16b';
        ctx.lineWidth = 32;
        ctx.beginPath();
        ctx.moveTo(0, WAREHOUSE_H / 2);
        ctx.lineTo(WAREHOUSE_W, WAREHOUSE_H / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(WAREHOUSE_W / 2, 0);
        ctx.lineTo(WAREHOUSE_W / 2, WAREHOUSE_H);
        ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 5; i++) {
            let hx = 100 + i * 150;
            let hy = 100 + ((i % 2) * 200);
            ctx.save();
            ctx.fillStyle = '#e6cfa7';
            ctx.fillRect(hx, hy, 70, 60);
            ctx.beginPath();
            ctx.moveTo(hx - 10, hy);
            ctx.lineTo(hx + 35, hy - 40);
            ctx.lineTo(hx + 80, hy);
            ctx.closePath();
            ctx.fillStyle = '#b55b2a';
            ctx.fill();
            ctx.fillStyle = '#7a4a1c';
            ctx.fillRect(hx + 28, hy + 30, 14, 30);
            ctx.fillStyle = '#aee6f7';
            ctx.fillRect(hx + 10, hy + 15, 14, 14);
            ctx.fillRect(hx + 46, hy + 15, 14, 14);
            ctx.restore();
        }
        for (let i = 0; i < 6; i++) {
            let tx = 60 + i * 140;
            let ty = (i % 2 === 0) ? 60 : 420;
            ctx.save();
            ctx.fillStyle = '#8b5c2a';
            ctx.fillRect(tx + 18, ty + 40, 14, 30);
            ctx.beginPath();
            ctx.arc(tx + 25, ty + 40, 28, Math.PI, Math.PI * 2);
            ctx.fillStyle = '#3a7d2c';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tx + 25, ty + 30, 22, 0, Math.PI * 2);
            ctx.fillStyle = '#4fc14f';
            ctx.fill();
            ctx.restore();
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(WAREHOUSE_W / 2, WAREHOUSE_H / 2, 32, 0, Math.PI * 2);
        ctx.fillStyle = '#b0b0b0';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(WAREHOUSE_W / 2, WAREHOUSE_H / 2, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#7ec6e6';
        ctx.fill();
        ctx.restore();
    } else if (level >= 31 && level <= 60) {
        // Stone World background (World 3): Rocky mountains
        ctx.fillStyle = '#bfc6c7'; // light gray for rocky ground
        ctx.fillRect(0, 0, WAREHOUSE_W, WAREHOUSE_H);
        // Draw distant mountains (layered)
        for (let layer = 0; layer < 3; layer++) {
            let baseY = WAREHOUSE_H - 180 + layer * 40;
            let color = ['#7a7a7a', '#a0a0a0', '#d0d0d0'][layer];
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, baseY + 80);
            let peaks = 6 + layer * 2;
            for (let i = 0; i <= peaks; i++) {
                let px = (WAREHOUSE_W / peaks) * i;
                let py = baseY - Math.sin(i + layer) * (60 - layer * 18) - Math.random() * (30 - layer * 10);
                ctx.lineTo(px, py);
            }
            ctx.lineTo(WAREHOUSE_W, baseY + 80);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.7 - layer * 0.18;
            ctx.shadowColor = color;
            ctx.shadowBlur = 18 - layer * 6;
            ctx.fill();
            ctx.restore();
        }
        // Foreground boulders
        for (let i = 0; i < 8; i++) {
            let bx = 40 + Math.random() * (WAREHOUSE_W - 80);
            let by = WAREHOUSE_H - 60 - Math.random() * 80;
            let r = 32 + Math.random() * 24;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(bx, by, r, r * (0.7 + Math.random() * 0.3), Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fillStyle = '#888';
            ctx.globalAlpha = 0.85;
            ctx.shadowColor = '#bbb';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
        }
        // Rocky border
        ctx.save();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 40;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(0, 0, WAREHOUSE_W, WAREHOUSE_H);
        ctx.restore();
    }

    // Animate time
    turtleAnimTime += 1;
    // Player velocity for animation
    let pvx = 0, pvy = 0;
    if (player.alive) {
        // Estimate velocity from keys (not perfect, but simple)
        if (keys['w'] || keys['ArrowUp']) pvy -= 1;
        if (keys['s'] || keys['ArrowDown']) pvy += 1;
        if (keys['a'] || keys['ArrowLeft']) pvx -= 1;
        if (keys['d'] || keys['ArrowRight']) pvx += 1;
        drawTurtle(player.x, player.y, PLAYER_SIZE, player.color, true, pvx, pvy);
    }
    // Enemies
    for (let enemy of enemies) {
        if (enemy.alive) {
            // Estimate enemy velocity (direction to player)
            let dx = player.x - enemy.x;
            let dy = player.y - enemy.y;
            let dist = Math.hypot(dx, dy);
            let evx = dist > 10 ? dx / dist : 0;
            let evy = dist > 10 ? dy / dist : 0;
            drawTurtle(enemy.x, enemy.y, ENEMY_SIZE, enemy.color, false, evx, evy);
        }
    }
    // Blood effect for dead enemies (puddle effect)
    for (let explosion of enemyExplosions) {
        let age = Date.now() - explosion.created;
        if (age < 1000) { // Show for 1 second
            let alpha = 1 - age / 1000;
            ctx.save();
            ctx.globalAlpha = alpha * 0.7;
            ctx.beginPath();
            // Draw a red irregular puddle
            let r = ENEMY_SIZE * 0.7 + Math.sin(age * 0.01) * 4;
            ctx.ellipse(explosion.x, explosion.y + 10, r, r * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fillStyle = '#a00';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.restore();
        }
    }
    // Boss
    if (boss && boss.alive) {
        if (boss.bossType === 'waterdragon') {
            // Draw Scary Water Dragon coming out of well
            ctx.save();
            ctx.translate(boss.x, boss.y);
            // Body (serpentine, blue, with spikes)
            ctx.save();
            ctx.rotate(-Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let i = 0; i < 7; i++) {
                let dx = Math.sin(turtleAnimTime * 0.08 + i) * 22;
                ctx.lineTo(i * 32, dx);
            }
            ctx.strokeStyle = '#1a5a8a';
            ctx.lineWidth = 34;
            ctx.shadowColor = '#0af';
            ctx.shadowBlur = 24;
            ctx.stroke();
            // Spikes along the back
            for (let i = 1; i < 7; i++) {
                let px = i * 32;
                let py = Math.sin(turtleAnimTime * 0.08 + i) * 22;
                ctx.save();
                ctx.translate(px, py - 20);
                ctx.rotate(Math.sin(turtleAnimTime * 0.1 + i) * 0.3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-8, -22);
                ctx.lineTo(8, -22);
                ctx.closePath();
                ctx.fillStyle = '#b0e0ff';
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.restore();
            }
            ctx.restore();
            // Head (scary dragon)
            ctx.save();
            // Jaw (open, with fangs)
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(0, 18, 28, 16, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#1a5a8a';
            ctx.shadowColor = '#0af';
            ctx.shadowBlur = 10;
            ctx.fill();
            // Fangs
            ctx.beginPath();
            ctx.moveTo(-10, 28);
            ctx.lineTo(-13, 38);
            ctx.lineTo(-7, 32);
            ctx.closePath();
            ctx.moveTo(10, 28);
            ctx.lineTo(13, 38);
            ctx.lineTo(7, 32);
            ctx.closePath();
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.restore();
            // Main head
            ctx.beginPath();
            ctx.ellipse(0, 0, 38, 28, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#3ad6ff';
            ctx.shadowColor = '#7ec6e6';
            ctx.shadowBlur = 18;
            ctx.fill();
            // Eyes (angry, glowing red)
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(14, -10, 7, 5, 0.2, 0, Math.PI * 2);
            ctx.ellipse(14, 10, 7, 5, -0.2, 0, Math.PI * 2);
            ctx.fillStyle = '#f00';
            ctx.shadowColor = '#f00';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.restore();
            // Pupils
            ctx.beginPath();
            ctx.arc(16, -10, 2, 0, Math.PI * 2);
            ctx.arc(16, 10, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            // Horns (longer, jagged)
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-18, -18);
            ctx.lineTo(-38, -38);
            ctx.lineTo(-28, -48);
            ctx.moveTo(-18, 18);
            ctx.lineTo(-38, 38);
            ctx.lineTo(-28, 48);
            ctx.stroke();
            // Nostrils (smoke effect)
            ctx.save();
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(turtleAnimTime * 0.2);
            ctx.beginPath();
            ctx.arc(20, -6, 3, 0, Math.PI * 2);
            ctx.arc(20, 6, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#aaa';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
            // Mouth (snarl, blue)
            ctx.beginPath();
            ctx.moveTo(24, 0);
            ctx.bezierCurveTo(32, 8, 32, -8, 24, 0);
            ctx.strokeStyle = '#0af';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
            ctx.restore();
            // HP bar
            ctx.save();
            ctx.fillStyle = '#222';
            ctx.fillRect(boss.x - 60, boss.y - 60, 120, 16);
            ctx.fillStyle = '#3ad6ff';
            ctx.fillRect(boss.x - 60, boss.y - 60, 120 * (boss.lives / 100), 16);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(boss.x - 60, boss.y - 60, 120, 16);
            ctx.font = '22px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('WATER DRAGON: ' + boss.lives + ' HP', boss.x - 70, boss.y - 70);
            ctx.restore();
        } else {
            // ...existing code for other bosses...
            // Estimate boss velocity (direction to player or charge)
            let dx = player.x - boss.x;
            let dy = player.y - boss.y;
            let dist = Math.hypot(dx, dy);
            let bvx = 0, bvy = 0;
            if (boss.charging) {
                bvx = Math.cos(boss.chargeAngle);
                bvy = Math.sin(boss.chargeAngle);
            } else if (dist > 10) {
                bvx = dx / dist;
                bvy = dy / dist;
            }
            drawTurtle(boss.x, boss.y, ENEMY_SIZE * 1.5, boss.color, false, bvx, bvy);
            ctx.font = '24px sans-serif';
            if (boss.bossType === 3) {
                ctx.fillStyle = '#0ff';
                ctx.fillText('BOSS 3: ' + boss.lives + ' HP', boss.x - 60, boss.y - ENEMY_SIZE);
                if (boss.charging) {
                    ctx.fillStyle = '#f00';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.fillText('CHARGING! (' + (3 - (boss.chargeHits || 0)) + ' hits left)', boss.x - 80, boss.y - ENEMY_SIZE - 30);
                } else if (boss.stunned) {
                    ctx.fillStyle = '#0ff';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.fillText('STUNNED!', boss.x - 40, boss.y - ENEMY_SIZE - 30);
                }
            } else {
                ctx.fillStyle = boss.bossType === 2 ? '#ff0' : '#f00';
                ctx.fillText((boss.bossType === 2 ? 'BOSS 2: ' : 'BOSS: ') + boss.lives + ' HP', boss.x - 60, boss.y - ENEMY_SIZE);
                if (boss.charging) {
                    ctx.fillStyle = '#f00';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.fillText('CHARGING!', boss.x - 40, boss.y - ENEMY_SIZE - 30);
                } else if (boss.stunned) {
                    ctx.fillStyle = '#0ff';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.fillText('STUNNED!', boss.x - 40, boss.y - ENEMY_SIZE - 30);
                }
            }
        }
    }
    // Bullets
    for (let b of bullets) {
        if (b.water) {
            // Water ball: blue, with white highlight
            ctx.save();
            ctx.beginPath();
            ctx.arc(b.x, b.y, BULLET_SIZE + 2, 0, Math.PI * 2);
            ctx.fillStyle = '#3ad6ff';
            ctx.shadowColor = '#7ec6e6';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(b.x + 3, b.y - 2, BULLET_SIZE / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.restore();
        } else if (b.rock) {
            // Rock: gray, chunky
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(b.x, b.y, BULLET_SIZE + 6, BULLET_SIZE + 2, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fillStyle = '#888';
            ctx.shadowColor = '#bbb';
            ctx.shadowBlur = 8;
            ctx.globalAlpha = 0.95;
            ctx.fill();
            ctx.restore();
        } else if (b.fire) {
            // Fireball: orange/red, glowing
            ctx.save();
            ctx.beginPath();
            ctx.arc(b.x, b.y, BULLET_SIZE + 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6a00';
            ctx.shadowColor = '#ff0';
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(b.x - 2, b.y - 2, BULLET_SIZE / 2, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = b.fromPlayer ? '#000' : '#a00';
            ctx.beginPath();
            ctx.arc(b.x, b.y, BULLET_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    // Level and world display
    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    let worldLabel = '';
    if (level >= 1 && level <= 15) {
        worldLabel = 'World 1: The Warehouse';
    } else if (level >= 16 && level <= 30) {
        worldLabel = 'World 2: The Town';
    } else if (level >= 31 && level <= 60) {
        worldLabel = 'World 3: The Stone World';
    }
    ctx.fillText('Level: ' + level, 30, 60);
    if (worldLabel) {
        ctx.font = '28px sans-serif';
        ctx.fillStyle = '#ff0';
        ctx.fillText(worldLabel, 30, 95);
        ctx.fillStyle = '#fff';
        ctx.font = '32px sans-serif';
    }
    // Player lives display
    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    // Move lives and enemies killed down if world label is present
    let livesY = worldLabel ? 130 : 90;
    let killedY = worldLabel ? 160 : 120;
    ctx.fillText('Lives: ' + player.lives, 30, livesY);
    // Enemies killed display
    ctx.fillText('Enemies Killed: ' + enemiesHit, 30, killedY);
    // Game over
    if (!player.alive && player.lives === 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.fillText('Game Over', WAREHOUSE_W / 2 - 120, WAREHOUSE_H / 2);
    }
    // Multi shot indicator
    if (multiShot && player.alive) {
        ctx.fillStyle = '#0f0';
        ctx.font = '32px sans-serif';
        ctx.fillText('MULTI SHOT!', 30, 50);
    }

    // Draw spikes if in spike phase
    if (bossSpikePhase && boss && boss.alive) {
        for (let spike of bossSpikes) {
            ctx.save();
            ctx.translate(spike.x, spike.y);
            ctx.rotate(Math.random() * Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, 30);
            ctx.lineTo(0, 24);
            ctx.lineTo(10, 30);
            ctx.closePath();
            ctx.fillStyle = '#b0e';
            ctx.shadowColor = '#fff';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
