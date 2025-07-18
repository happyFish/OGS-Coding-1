class CombatSystem {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
    }

    // Add this function if not present:
    explodePlayer(player) {
        for (let i = 0; i < 120; i++) {
            this.particleSystem.spawnParticles(
                player.x + GAME_CONFIG.PLAYER_WIDTH / 2,
                player.y + GAME_CONFIG.PLAYER_HEIGHT / 2,
                {
                    color: "#e33",
                    count: 1,
                    spread: 2 * Math.PI,
                    speed: 4 + Math.random() * 4
                }
            );
        }
    }

    checkAttack(attacker, defender) {
        if (!attacker.attacking) return;

        // Attack hitbox
        let ax, ay, aw, ah;
        if (attacker.specialKicking) {
            // Special staff attack hitbox (neck area)
            ax = defender.x + GAME_CONFIG.PLAYER_WIDTH / 2 - 10;
            ay = defender.y + 10;
            aw = 20;
            ah = 20;
        } else if (attacker.isKicking) {
            ax = attacker.facing === 1 ? attacker.x + GAME_CONFIG.PLAYER_WIDTH : attacker.x - 30;
            ay = attacker.y + 40;
            aw = 30;
            ah = 30;
        } else if (!attacker.isPlayer1) {
            // Regular staff attack hitbox
            ax = attacker.facing === 1 ? attacker.x + GAME_CONFIG.PLAYER_WIDTH + 10 : attacker.x - 30;
            ay = attacker.y + 35;
            aw = 34;
            ah = 18;
        } else {
            ax = attacker.facing === 1 ? attacker.x + GAME_CONFIG.PLAYER_WIDTH : attacker.x - 20;
            ay = attacker.y + 20;
            aw = 20;
            ah = 20;
        }

        // Defender hitbox
        let dx = defender.x, dy = defender.y, dw = GAME_CONFIG.PLAYER_WIDTH, dh = GAME_CONFIG.PLAYER_HEIGHT;

        if (ax < dx + dw && ax + aw > dx && ay < dy + dh && ay + ah > dy) {
            let damage = attacker.isKicking ? 2 : 1;
            if (attacker.specialKicking) damage = 6; // Special staff attack does 6 damage
            else if (!attacker.isPlayer1 && !attacker.isKicking) damage = 1; // Regular staff attack does 1 damage
            if (attacker.specialAttacking) damage = 5;

            if (defender.blocking) {
                defender.health -= damage / 2;
            } else {
                defender.health -= damage;
            }

            attacker.attacking = false;
            attacker.specialAttacking = false;
            attacker.specialKicking = false;

            // Spawn red glitter at defender's neck for special, else normal
            let hitY = attacker.specialKicking ? defender.y + 18 :
                (attacker.isKicking ? defender.y + 75 : defender.y + 50);
            this.particleSystem.spawnParticles(defender.x + GAME_CONFIG.PLAYER_WIDTH / 2, hitY);
        }
    }

    checkStaffCollision(staffData, defender) {
        if (staffData.flying &&
            Math.abs(staffData.x - (defender.x + GAME_CONFIG.PLAYER_WIDTH / 2)) < 24 &&
            Math.abs(staffData.y - (defender.y + 20)) < 24) {
            let damage = 5; // Staff flying hit does 5 damage
            if (defender.blocking) {
                defender.takeDamage(damage / 2);
            } else {
                defender.takeDamage(damage);
            }
            staffData.flying = false;
            this.particleSystem.spawnParticles(defender.x + GAME_CONFIG.PLAYER_WIDTH / 2, defender.y + 18);
        }
    }

    checkBulletCollision(bullets, defender) {
        for (let bullet of bullets) {
            if (bullet.active &&
                bullet.x + bullet.width > defender.x &&
                bullet.x < defender.x + GAME_CONFIG.PLAYER_WIDTH &&
                bullet.y + bullet.height > defender.y &&
                bullet.y < defender.y + GAME_CONFIG.PLAYER_HEIGHT) {
                defender.health -= 1;
                bullet.active = false;
                this.particleSystem.spawnParticles(defender.x + GAME_CONFIG.PLAYER_WIDTH / 2, defender.y + 30);
            }
        }
    }
}