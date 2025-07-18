class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.inputManager = new InputManager();
        this.init();
    }

    init() {
        this.renderer = new Renderer(this.ctx);
        this.particleSystem = new ParticleSystem();
        this.combatSystem = new CombatSystem(this.particleSystem);

        this.p1 = new Player(PLAYER_CONFIG.P1, true);
        this.p2 = new Player(PLAYER_CONFIG.P2, false);

        this.staffFlying = false;
        this.staffData = {
            x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0, timer: 0, flying: false
        };
        this.gameRunning = true;
    }

    update() {
        const now = Date.now();
        const keys = this.inputManager.getKeys();

        // Update players
        this.p1.update(keys, CONTROLS.P1, now);
        this.p2.update(keys, CONTROLS.P2, now);

        // Handle staff throwing for Player 2
        if (CONTROLS.P2.SPECIAL && keys[CONTROLS.P2.SPECIAL] &&
            !this.p2.specialKicking && now - this.p2.lastSpecialKick > 6000 &&
            this.p2.onGround) {
            const dist = Math.abs(this.p1.x - this.p2.x);
            if (dist > 120) {
                this.p2.specialKicking = true;
                this.p2.attacking = false;
                this.p2.lastSpecialKick = now;
                this.staffData.flying = true;
                this.staffData.x = this.p2.x + GAME_CONFIG.PLAYER_WIDTH / 2;
                this.staffData.y = this.p2.y + 40;
                this.staffData.targetX = this.p1.x + GAME_CONFIG.PLAYER_WIDTH / 2;
                this.staffData.targetY = this.p1.y + 20;
                const dx = this.staffData.targetX - this.staffData.x;
                const dy = this.staffData.targetY - this.staffData.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                this.staffData.vx = dx / (len / 12);
                this.staffData.vy = dy / (len / 12);
                this.staffData.timer = 0;
                setTimeout(() => {
                    this.p2.specialKicking = false;
                }, 700);
            }
        }

        // Update flying staff
        if (this.staffData.flying) {
            this.staffData.x += this.staffData.vx;
            this.staffData.y += this.staffData.vy;
            this.staffData.timer++;
            // Remove staff after 40 frames if it misses
            if (this.staffData.timer > 40) this.staffData.flying = false;
        }

        // Check combat
        this.combatSystem.checkAttack(this.p1, this.p2);
        this.combatSystem.checkAttack(this.p2, this.p1);
        this.combatSystem.checkStaffCollision(this.staffData, this.p1);
        this.combatSystem.checkBulletCollision(this.p2.bullets, this.p1)
        // Update particles
        this.particleSystem.updateParticles();

        // In your game loop or wherever you check for player death, add:
        if (this.p1.health <= 0 && !this.p1.exploded) {
            this.p1.exploded = true;
            this.combatSystem.explodePlayer(this.p1);
        }
        if (this.p2.health <= 0 && !this.p2.exploded) {
            this.p2.exploded = true;
            this.combatSystem.explodePlayer(this.p2);
        }

        // Check game over
        if (this.p1.health <= 0 || this.p2.health <= 0) {
            this.gameRunning = false;
        }
    }

    render() {
        this.renderer.clear();
        this.renderer.drawBackground();
        this.renderer.drawPlayer(this.p1);
        this.renderer.drawPlayer(this.p2);
        this.renderer.drawHealth(this.p1, 20, 20);
        this.renderer.drawHealth(this.p2, GAME_CONFIG.CANVAS_WIDTH - 20 - GAME_CONFIG.MAX_HEALTH * 22, 20);
        this.renderer.drawParticles(this.particleSystem.getParticles());

        if (this.staffData.flying) {
            this.renderer.drawFlyingStaff(this.staffData);
        }

        if (!this.gameRunning) {
            const winner = this.p1.health <= 0 ? "Player 2" : "Player 1";
            this.renderer.drawGameOver(winner);
        }
    }

    onEnd() {

    }

    gameLoop() {
        if (this.gameRunning) {
            this.update();
        } else {
            this.onEnd();
            return;
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    start() {
        this.gameLoop();
    }
} 