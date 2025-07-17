class Player {
    constructor(config, isPlayer1) {
        this.x = config.x;
        this.y = config.y;
        this.vx = 0;
        this.vy = 0;
        this.color = config.color;
        this.outfitColor = config.outfitColor;
        this.health = 30; // Set health to 30 for both players
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

        // Player 1 specific properties
        if (isPlayer1) {
            this.specialBeamReady = true;
            this.specialBeamActive = false;
            this.specialBeamTimer = 0;
            this.projectileReady = true;
            this.projectileActive = false;
            this.projectile = null;
            this.rushReady = true;
            this.rushActive = false;
        }
        // Player 2 specific properties
        else {
            this.hasGun = false;
            this.gunTimer = 0;
            this.gunReady = true;
            this.bullets = [];
            this.lastBullet = 0;
        }
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

        // Replace Player 2's punch logic when gun is equipped
        if (!this.isPlayer1 && this.hasGun && keys[controls.ATTACK] && !this.attacking &&
            now - this.lastBullet > 1000 && // 1 second cooldown
            !this.specialAttacking && !this.specialKicking) {
            // Shoot a bullet instead of punch
            this.attacking = true;
            this.lastAttack = now;
            this.lastBullet = now;
            // Create bullet object
            this.bullets.push({
                x: this.x + GAME_CONFIG.PLAYER_WIDTH,
                y: this.y + 32,
                vx: 14 * this.facing,
                width: 10,
                height: 4,
                active: true
            });
            setTimeout(() => { this.attacking = false; }, 120);
        }

        // Special beam (Player 1 only)
        if (this.isPlayer1 && keys['q'] && this.specialBeamReady && !this.specialBeamActive) {
            this.specialBeamActive = true;
            this.specialBeamReady = false;
            this.specialBeamTimer = 0;
            setTimeout(() => {
                this.specialBeamActive = false;
            }, 700); // Beam lasts  2 seconds
            setTimeout(() => {
                this.specialBeamReady = true;
            }, 12000); // 12 second cooldown
        }

        // Player 1 projectile
        if (this.isPlayer1 && keys['r'] && this.projectileReady && !this.projectileActive) {
            this.projectileActive = true;
            this.projectileReady = false;
            // Create projectile object
            this.projectile = {
                x: this.x + GAME_CONFIG.PLAYER_WIDTH,
                y: this.y + 24,
                vx: 12 * this.facing,
                width: 18,
                height: 8,
                active: true
            };
            setTimeout(() => { this.projectileActive = false; }, 600); // Projectile lasts 0.6s
            setTimeout(() => { this.projectileReady = true; }, 1200); // 1.2s cooldown
        }

        // Update the cane-to-gun transformation for Player 2 to last 4 seconds:
        if (!this.isPlayer1 && keys['l'] && this.gunReady && !this.hasGun) {
            this.hasGun = true;
            this.gunReady = false;
            this.gunTimer = 0;
            setTimeout(() => {
                this.hasGun = false;
            }, 4000); // Gun lasts 4 seconds
            setTimeout(() => {
                this.gunReady = true;
            }, 6000); // 2 second cooldown after gun ends
        }

        // Rush move (Player 1 only)
        if (this.isPlayer1 && keys['c'] && this.rushReady && !this.rushActive) {
            this.rushActive = true;
            this.rushReady = false;
            // Rush forward quickly with twice the previous range
            this.vx = 56 * this.facing; // 28 * 2 = 56, twice the previous range
            setTimeout(() => {
                this.rushActive = false;
                this.vx = 0;
            }, 320); // Duration unchanged, but speed is higher
            setTimeout(() => {
                this.rushReady = true;
            }, 700); // 0.7 second cooldown
        }

        // Update the cane-to-gun transformation for Player 2 to last 4 seconds:
        if (!this.isPlayer1 && keys['l'] && this.gunReady && !this.hasGun) {
            this.hasGun = true;
            this.gunReady = false;
            this.gunTimer = 0;
            setTimeout(() => {
                this.hasGun = false;
            }, 4000); // Gun lasts 4 seconds
            setTimeout(() => {
                this.gunReady = true;
            }, 6000); // 2 second cooldown after gun ends
        }

        // Update projectile position
        if (this.projectile && this.projectile.active) {
            this.projectile.x += this.projectile.vx;
            // Remove projectile if off screen
            if (this.projectile.x < 0 || this.projectile.x > 800) {
                this.projectile.active = false;
            }
        }

        // Update bullets position each frame
        if (this.bullets) {
            for (let bullet of this.bullets) {
                if (bullet.active) {
                    bullet.x += bullet.vx;
                    if (bullet.x < 0 || bullet.x > GAME_CONFIG.CANVAS_WIDTH) {
                        bullet.active = false;
                    }
                }
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