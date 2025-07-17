class Player {
    constructor(config, isPlayer1) {
        this.x = config.x;
        this.y = config.y;
        this.vx = 0;
        this.vy = 0;
        this.color = config.color;
        this.outfitColor = config.outfitColor;
        this.health = GAME_CONFIG.MAX_HEALTH;
        this.onGround = true;
        this.facing = isPlayer1 ? 1 : -1;
        this.attacking = false;
        this.lastAttack = 0;
        this.blocking = false;
        this.specialAttacking = false;
        this.lastSpecial = 0;
        this.nextKick = false;
        this.isKicking = false;
        this.walkCycle = 0;
        this.isPlayer1 = isPlayer1;
        this.specialKicking = false;
        this.lastSpecialKick = 0;
    }

    update(keys, controls, now) {
        // Movement
        if (keys[controls.LEFT]) { 
            this.vx = -GAME_CONFIG.SPEED; 
            this.facing = -1; 
        }
        else if (keys[controls.RIGHT]) { 
            this.vx = GAME_CONFIG.SPEED; 
            this.facing = 1; 
        }
        else this.vx = 0;

        // Jump
        if (keys[controls.JUMP] && this.onGround) {
            this.vy = -GAME_CONFIG.JUMP_POWER;
            this.onGround = false;
        }

        // Block
        this.blocking = !!keys[controls.BLOCK];

        // Special attack (Player 1 only)
        if (controls.SPECIAL && keys[controls.SPECIAL] && !this.specialAttacking && 
            now - this.lastSpecial > 6000 && this.onGround) {
            this.specialAttacking = true;
            this.attacking = true;
            this.lastSpecial = now;
            // Jump toward the other player
            this.vy = -GAME_CONFIG.JUMP_POWER * 0.9;
            this.vx = (this.isPlayer1 ? 1 : 0) * (GAME_CONFIG.SPEED * 2.2);
            setTimeout(() => {
                this.specialAttacking = false;
                this.attacking = false;
            }, 350);
        }

        // Special kick (Player 2 only)
        if (controls.SPECIAL && keys[controls.SPECIAL] && !this.specialKicking && 
            now - this.lastSpecialKick > 6000 && this.onGround) {
            this.specialKicking = true;
            this.attacking = true;
            this.lastSpecialKick = now;
            this.vy = -GAME_CONFIG.JUMP_POWER * 0.5;
            setTimeout(() => {
                this.specialKicking = false;
                this.attacking = false;
            }, 350);
        }

        // Normal attack
        if (keys[controls.ATTACK] && !this.attacking && 
            now - this.lastAttack > GAME_CONFIG.ATTACK_COOLDOWN && 
            !this.specialAttacking && !this.specialKicking) {
            if (!this.nextKick) {
                // This is a punch, so set up next attack as a kick
                this.attacking = true;
                this.lastAttack = now;
                this.isKicking = false;
                setTimeout(() => { this.attacking = false; }, 150);
                this.nextKick = true;
            } else {
                // This is a kick
                this.attacking = true;
                this.lastAttack = now;
                this.isKicking = true;
                setTimeout(() => { this.attacking = false; this.isKicking = false; }, 200);
                this.nextKick = false;
            }
        }

        // Apply physics
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GAME_CONFIG.GRAVITY;

        // Ground collision
        if (this.y >= GAME_CONFIG.GROUND_Y) {
            this.y = GAME_CONFIG.GROUND_Y;
            this.vy = 0;
            this.onGround = true;
            // Stop special attack/kick movement on landing
            if (this.specialAttacking) {
                this.specialAttacking = false;
                this.attacking = false;
            }
            if (this.specialKicking) {
                this.specialKicking = false;
                this.attacking = false;
            }
        }

        // Wall collision
        this.x = Math.max(0, Math.min(GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PLAYER_WIDTH, this.x));

        // Walking animation
        if (Math.abs(this.vx) > 0.1 && this.onGround) {
            this.walkCycle += 0.2;
        } else {
            this.walkCycle = 0;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
    }
} 