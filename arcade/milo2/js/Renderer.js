class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.background = new Image();
        this.background.src = 'https://www.creativeuncut.com/gallery-18/art/mk9-background-mileena.jpg';
    }

    drawPlayer(p) {
        // Walking animation variables
        let walkCycle = p.walkCycle;

        // Leg length adjustment: shorter when jumping or during Player 1's special move
        let isShortLegs = !p.onGround || (p.isPlayer1 && p.specialAttacking);
        let kneeOffset = isShortLegs ? 10 : 18;
        let footOffset = isShortLegs ? 10 : 22;

        // Draw legs with improved walking animation (legs swing forward/back)
        this.ctx.strokeStyle = "#111"; // Legs always black
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();

        let hipX = p.x + GAME_CONFIG.PLAYER_WIDTH / 2;
        let hipY = p.y + GAME_CONFIG.PLAYER_HEIGHT - 10;

        // Left leg (swings forward/back)
        let leftLegSwing = Math.sin(walkCycle) * 18;
        let leftKneeX = hipX - 8 + Math.sin(walkCycle) * 6;
        let leftKneeY = hipY + kneeOffset - Math.abs(leftLegSwing) * 0.2;
        let leftFootX = leftKneeX + Math.sin(walkCycle) * 8;
        let leftFootY = leftKneeY + footOffset + Math.max(0, -leftLegSwing * 0.15);

        // Right leg (swings opposite phase)
        let rightLegSwing = -Math.sin(walkCycle) * 18;
        let rightKneeX = hipX + 8 + Math.sin(walkCycle + Math.PI) * 6;
        let rightKneeY = hipY + kneeOffset - Math.abs(rightLegSwing) * 0.2;
        let rightFootX = rightKneeX + Math.sin(walkCycle + Math.PI) * 8;
        let rightFootY = rightKneeY + footOffset + Math.max(0, -rightLegSwing * 0.15);

        // Only draw the non-kicking leg if kicking
        if (!(p.isKicking && p.facing === 1)) {
            this.ctx.moveTo(hipX - 8, hipY);
            this.ctx.lineTo(leftKneeX, leftKneeY);
            this.ctx.lineTo(leftFootX, leftFootY);
        }
        if (!(p.isKicking && p.facing === -1)) {
            this.ctx.moveTo(hipX + 8, hipY);
            this.ctx.lineTo(rightKneeX, rightKneeY);
            this.ctx.lineTo(rightFootX, rightFootY);
        }
        this.ctx.stroke();

        // Draw body (shirt)
        this.ctx.fillStyle = p.outfitColor;
        this.ctx.fillRect(p.x + GAME_CONFIG.PLAYER_WIDTH * 0.25, p.y + 30, GAME_CONFIG.PLAYER_WIDTH * 0.5, 40);

        // Draw head
        this.ctx.beginPath();
        this.ctx.arc(p.x + GAME_CONFIG.PLAYER_WIDTH / 2, p.y + 20, 16, 0, Math.PI * 2);
        this.ctx.fillStyle = "#ffe0b2";
        this.ctx.fill();

        // Draw arms (with punch animation and walking)
        this.ctx.strokeStyle = p.isPlayer1 ? "#2196f3" : p.outfitColor; // Player 1: blue arms, Player 2: grey arms
        this.ctx.lineWidth = 6;
        this.ctx.beginPath();

        // Left arm (static unless walking)
        let armSwing = Math.sin(walkCycle) * 8;
        this.ctx.moveTo(p.x + GAME_CONFIG.PLAYER_WIDTH * 0.25, p.y + 40);
        this.ctx.lineTo(p.x + GAME_CONFIG.PLAYER_WIDTH * 0.05, p.y + 60 + armSwing);

        // Right arm (punches when attacking if facing right, else left arm punches)
        if (p.attacking && !p.isKicking) {
            if (p.facing === 1) {
                // Right punch (extends forward)
                this.ctx.moveTo(p.x + GAME_CONFIG.PLAYER_WIDTH * 0.75, p.y + 40);
                this.ctx.lineTo(p.x + GAME_CONFIG.PLAYER_WIDTH * 1.15, p.y + 35);
            } else {
                // Left punch (extends forward)
                this.ctx.moveTo(p.x + GAME_CONFIG.PLAYER_WIDTH * 0.25, p.y + 40);
                this.ctx.lineTo(p.x - GAME_CONFIG.PLAYER_WIDTH * 0.15, p.y + 35);
            }
        } else {
            // Normal right arm with walking swing
            let armSwing2 = -Math.sin(walkCycle) * 8;
            this.ctx.moveTo(p.x + GAME_CONFIG.PLAYER_WIDTH * 0.75, p.y + 40);
            this.ctx.lineTo(p.x + GAME_CONFIG.PLAYER_WIDTH * 0.95, p.y + 60 + armSwing2);
        }
        this.ctx.stroke();

        // Draw kick animation if isKicking
        if (p.isKicking) {
            this.ctx.strokeStyle = "#111"; // Kicking leg is black
            this.ctx.lineWidth = 8;
            this.ctx.beginPath();
            // The kicking leg is fully lifted and extended forward, not touching the ground
            let kickLength = 48;
            let kickAngle = p.facing === 1 ? -Math.PI / 6 : -5 * Math.PI / 6; // Up and forward
            let kneeX = hipX + Math.cos(kickAngle) * (kickLength * 0.5);
            let kneeY = hipY + Math.sin(kickAngle) * (kickLength * 0.5);
            let footX = hipX + Math.cos(kickAngle) * kickLength;
            let footY = hipY + Math.sin(kickAngle) * kickLength;

            // Draw the lifted kicking leg (on the correct side)
            this.ctx.moveTo(hipX + 8 * p.facing, hipY);
            this.ctx.lineTo(kneeX, kneeY);
            this.ctx.lineTo(footX, footY);
            this.ctx.stroke();
        }

        // Draw block outline
        if (p.blocking) {
            this.ctx.save();
            this.ctx.strokeStyle = "#0f0";
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(p.x - 4, p.y - 4, GAME_CONFIG.PLAYER_WIDTH + 8, GAME_CONFIG.PLAYER_HEIGHT + 8);
            this.ctx.restore();
        }

        // Always show golden staff in Player 2's hand (acts like dagger)
        if (!p.isPlayer1) {
            let staffX, staffY, staffDir;
            if (p.attacking && !p.isKicking) {
                if (p.facing === 1) {
                    staffX = p.x + GAME_CONFIG.PLAYER_WIDTH * 1.15;
                    staffY = p.y + 35;
                    staffDir = 1;
                } else {
                    staffX = p.x - GAME_CONFIG.PLAYER_WIDTH * 0.15;
                    staffY = p.y + 35;
                    staffDir = -1;
                }
            } else {
                let armSwing2 = -Math.sin(walkCycle) * 8;
                staffX = p.x + GAME_CONFIG.PLAYER_WIDTH * 0.95;
                staffY = p.y + 60 + armSwing2;
                staffDir = p.facing === -1 ? -1 : 1;
            }

            this.ctx.save();
            if (p.hasGun) {
                // Draw gun (rectangle with barrel)
                this.ctx.fillStyle = "#222";
                this.ctx.fillRect(staffX, staffY, 28 * staffDir, 8);
                // Barrel
                this.ctx.fillStyle = "#888";
                this.ctx.fillRect(staffX + 28 * staffDir, staffY + 2, 12 * staffDir, 4);
            } else {
                // Draw cane (long, golden)
                this.ctx.strokeStyle = "#FFD700";
                this.ctx.lineWidth = 8;
                this.ctx.beginPath();
                this.ctx.moveTo(staffX, staffY);
                this.ctx.lineTo(staffX, staffY + 48);
                this.ctx.stroke();
                // Cane tip
                this.ctx.beginPath();
                this.ctx.arc(staffX, staffY + 48, 7, 0, Math.PI * 2);
                this.ctx.fillStyle = "#FFD700";
                this.ctx.fill();
                // Cane end
                this.ctx.beginPath();
                this.ctx.arc(staffX, staffY, 6, 0, Math.PI * 2);
                this.ctx.fillStyle = "#FFD700";
                this.ctx.fill();
            }
            this.ctx.restore();
        }

        // Draw Player 2's bullets
        if (!p.isPlayer1 && p.bullets && p.bullets.length > 0) {
            for (let bullet of p.bullets) {
                if (bullet.active) {
                    this.ctx.save();
                    this.ctx.fillStyle = "#bbb";
                    this.ctx.shadowColor = "#fff";
                    this.ctx.shadowBlur = 8;
                    this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                    this.ctx.restore();
                }
            }
        }
    }

    drawHealth(p, x, y) {
        const blockW = 12, blockH = 12, gap = 4;
        let health = Math.max(0, p.health);

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 10; col++) {
                let i = row * 10 + col;
                let filled = i < health;
                this.ctx.fillStyle = filled ? "#e33" : "#444";
                this.ctx.fillRect(x + col * (blockW + gap), y + row * (blockH + gap), blockW, blockH);
            }
        }
        // Health text
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 13px Arial";
        this.ctx.textAlign = "left";
        this.ctx.fillText(`${Math.ceil(p.health)} / 30`, x, y + 3 * (blockH + gap) + 10);
    }

    drawParticles(particles) {
        for (let p of particles) {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle = "#f44";
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawFlyingStaff(staffData) {
        this.ctx.save();
        this.ctx.strokeStyle = "#FFD700";
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(staffData.x, staffData.y);
        this.ctx.lineTo(staffData.x, staffData.y + 48);
        this.ctx.stroke();
        // Staff tip
        this.ctx.beginPath();
        this.ctx.arc(staffData.x, staffData.y + 48, 7, 0, Math.PI * 2);
        this.ctx.fillStyle = "#FFD700";
        this.ctx.fill();
        // Staff end
        this.ctx.beginPath();
        this.ctx.arc(staffData.x, staffData.y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = "#FFD700";
        this.ctx.fill();
        this.ctx.restore();
    }

    drawGameOver(winner) {
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "48px Arial";
        this.ctx.fillText(`${winner} Wins!`, GAME_CONFIG.CANVAS_WIDTH / 2 - 120, GAME_CONFIG.CANVAS_HEIGHT / 2);
    }

    clear() {
        this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    }

    drawBackground() {
        this.ctx.drawImage(this.background, 0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    }
}