// SMG4 Meme Quest 2D Platformer (no Three.js)
// Uses HTML5 Canvas

const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 400;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Game objects
const player = {
    x: 50,
    y: 300,
    w: 32,
    h: 32,
    color: '#00f',
    vy: 0,
    onGround: false,
    memeLevel: 1,
    memeXP: 0,
    memeXPToLevel: 3
};

const groundY = 350;


// Level system
let currentLevel = 1;
const maxLevel = 20;
let enemies = [];
let boss = null;
let walmart = null;

function setupLevel(level) {
    // Each level has a unique layout, enemy pattern, and challenge
    enemies = [];
    let numEnemies, spacing, enemyPattern, bossHere = false;
    let yVariants = [groundY - 32, groundY - 64, groundY - 96];
    switch (level) {
        case 1:
            numEnemies = 3; spacing = 120; enemyPattern = [0, 0, 0]; break;
        case 2:
            numEnemies = 4; spacing = 100; enemyPattern = [0, 1, 0, 1]; break;
        case 3:
            numEnemies = 5; spacing = 90; enemyPattern = [0, 1, 2, 1, 0]; break;
        case 4:
            numEnemies = 6; spacing = 80; enemyPattern = [0, 2, 1, 2, 0, 1]; break;
        case 5:
            numEnemies = 7; spacing = 75; enemyPattern = [0, 1, 2, 1, 2, 1, 0]; bossHere = true; break;
        case 6:
            numEnemies = 8; spacing = 70; enemyPattern = [2, 1, 0, 1, 2, 0, 1, 2]; break;
        case 7:
            numEnemies = 9; spacing = 65; enemyPattern = [1, 2, 0, 2, 1, 0, 2, 1, 0]; break;
        case 8:
            numEnemies = 10; spacing = 60; enemyPattern = [2, 2, 1, 0, 1, 2, 0, 1, 2, 0]; break;
        case 9:
            numEnemies = 11; spacing = 58; enemyPattern = [0, 1, 2, 1, 0, 2, 1, 2, 0, 1, 2]; break;
        case 10:
            numEnemies = 12; spacing = 56; enemyPattern = [2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0]; bossHere = true; break;
        case 11:
            numEnemies = 13; spacing = 54; enemyPattern = [1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1]; break;
        case 12:
            numEnemies = 14; spacing = 52; enemyPattern = [2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]; break;
        case 13:
            numEnemies = 15; spacing = 50; enemyPattern = [0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1]; break;
        case 14:
            numEnemies = 16; spacing = 48; enemyPattern = [2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2]; break;
        case 15:
            numEnemies = 17; spacing = 46; enemyPattern = [1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0]; bossHere = true; break;
        case 16:
            numEnemies = 18; spacing = 44; enemyPattern = [2, 2, 1, 1, 0, 0, 2, 2, 1, 1, 0, 0, 2, 2, 1, 1, 0, 0]; break;
        case 17:
            numEnemies = 19; spacing = 42; enemyPattern = [0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]; break;
        case 18:
            numEnemies = 20; spacing = 40; enemyPattern = [2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]; break;
        case 19:
            numEnemies = 21; spacing = 38; enemyPattern = [1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0]; break;
        case 20:
            numEnemies = 22; spacing = 36; enemyPattern = [2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2]; bossHere = true; break;
        default:
            numEnemies = 3; spacing = 120; enemyPattern = [0, 0, 0];
    }
    for (let i = 0; i < numEnemies; i++) {
        let ex = 150 + i * spacing + Math.floor(Math.random() * 20);
        let ey = yVariants[enemyPattern[i % enemyPattern.length]];
        enemies.push({ x: ex, y: ey, w: 32, h: 32, alive: true, speed: 0.5 + level * 0.1 });
    }
    // Boss on some levels
    if (bossHere) {
        boss = { x: 700, y: groundY - 48, w: 32, h: 48, alive: true, speed: 1 + level * 0.15 };
    } else {
        boss = null;
    }
    // Walmart goal moves up/down for variety
    let wy = groundY - 64 - ((level % 3) * 32);
    walmart = { x: 750, y: wy, w: 32, h: 64 };
}

setupLevel(currentLevel);

let keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

function resetPlayer() {
    player.x = 50;
    player.y = 300;
    player.vy = 0;
    for (const key in keys) {
        keys[key] = false; // Reset all keys
    }
    setupLevel(currentLevel); // <-- Add this line to respawn enemies
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > maxLevel) {
        alert('You beat all 20 levels! You are the Meme King!');
        currentLevel = 1;
    } else {
        alert('Level ' + currentLevel + '!');
    }
    setupLevel(currentLevel);
    resetPlayer();
}

function drawRect(obj, color) {
    ctx.fillStyle = color;
    ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Ground
    ctx.fillStyle = '#0f0';
    ctx.fillRect(0, groundY, canvas.width, 50);
    // Walmart
    drawRect(walmart, '#fff');
    // Boss
    if (boss && boss.alive) drawRect(boss, '#222');
    // Enemies
    enemies.forEach(e => { if (e.alive) drawRect(e, '#f00'); });
    // Player
    drawRect(player, player.color);
    // Meme level and level info
    ctx.fillStyle = '#000';
    ctx.fillText('Meme Level: ' + player.memeLevel, 10, 20);
    ctx.fillText('XP: ' + player.memeXP + '/' + player.memeXPToLevel, 10, 40);
    ctx.fillText('Level: ' + currentLevel + ' / ' + maxLevel, 10, 60);
}

function update() {
    // Movement
    let speed = 3 + player.memeLevel * 0.5;
    if (keys['a']) player.x -= speed;
    if (keys['d']) player.x += speed;
    // Jump (space only)
    if (keys[' '] && player.onGround) {
        player.vy = -10 - player.memeLevel * 1.2;
        player.onGround = false;
        keys[' '] = false; // Prevent holding jump
    }
    // Gravity
    player.vy += 0.5;
    player.y += player.vy;
    if (player.y + player.h >= groundY) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.onGround = true;
    }
    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

    // Move enemies (harder levels: enemies move left/right)
    enemies.forEach((e, i) => {
        if (!e.alive) return;
        if (currentLevel > 1) {
            e.x += Math.sin(Date.now() / (600 - currentLevel * 20 + i * 100)) * e.speed;
        }
    });
    // Boss moves
    if (boss && boss.alive && currentLevel > 4) {
        boss.x += Math.sin(Date.now() / (400 - currentLevel * 10)) * boss.speed;
    }

    // Die if touching a red block (enemy)
    for (const e of enemies) {
        if (e.alive &&
            player.x + player.w > e.x && player.x < e.x + e.w &&
            player.y + player.h > e.y && player.y < e.y + e.h
        ) {
            alert('You touched a meme foe and died!');
            resetPlayer();
            break;
        }
    }
    // Die if touching boss
    if (boss && boss.alive &&
        player.x + player.w > boss.x && player.x < boss.x + boss.w &&
        player.y + player.h > boss.y && player.y < boss.y + boss.h
    ) {
        alert('You touched the store clerk and died!');
        resetPlayer();
    }

    // Meme attack (shift)
    if (keys['shift']) {
        // Enemies
        enemies.forEach(e => {
            if (e.alive && Math.abs(player.x - e.x) < 40 && Math.abs(player.y - e.y) < 40) {
                e.alive = false;
                memeJuice(e.x, e.y);
                gainXP();
            }
        });
        // Boss
        if (boss && boss.alive && Math.abs(player.x - boss.x) < 40 && Math.abs(player.y - boss.y) < 60) {
            boss.alive = false;
            memeJuice(boss.x, boss.y);
            alert('You defeated the store clerk with the power of memes!');
            gainXP();
        }
        keys['shift'] = false; // Prevent holding
    }
    // Win
    if (
        player.x + player.w > walmart.x &&
        player.x < walmart.x + walmart.w &&
        player.y + player.h > walmart.y &&
        player.y < walmart.y + walmart.h
    ) {
        alert('You got the milk! Next level!');
        nextLevel();
    }
}

function gainXP() {
    player.memeXP++;
    if (player.memeXP >= player.memeXPToLevel) {
        player.memeLevel++;
        player.memeXP = 0;
        player.memeXPToLevel += 2;
        alert('Your meme leveled up! Power: ' + player.memeLevel);
    }
}

function memeJuice(x, y) {
    // Red apple juice effect
    let t = 0;
    function splash() {
        ctx.fillStyle = '#f22';
        ctx.beginPath();
        ctx.arc(x + 16, y + 32, 16 + t * 2, 0, Math.PI * 2);
        ctx.fill();
        t++;
        if (t < 10) requestAnimationFrame(splash);
    }
    splash();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();
