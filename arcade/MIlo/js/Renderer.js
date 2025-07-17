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
        this.ctx.strokeStyle = "#ffe0b2";
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
            // Right hand (matches punch animation if attacking, otherwise follows arm swing)
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
                // Normal right hand position
                let armSwing2 = -Math.sin(walkCycle) * 8;
                staffX = p.x + GAME_CONFIG.PLAYER_WIDTH * 0.95;
                staffY = p.y + 60 + armSwing2;
                staffDir = p.facing === -1 ? -1 : 1;
            }
            let staffEndX = staffX;
            let staffEndY = staffY;
            if (p.attacking) {
                staffEndX += 35;
            } else {
                staffEndY += 35;
            }

            this.ctx.save();
            // Staff (long, golden, aligned with hand)
            this.ctx.strokeStyle = "#FFD700"; // Gold color
            this.ctx.lineWidth = 8;
            this.ctx.beginPath();
            this.ctx.moveTo(staffX, staffY);
            this.ctx.lineTo(staffEndX + 0 * staffDir, staffEndY); // Long staff, straight down from hand
            this.ctx.stroke();

            // Staff tip (rounded)
            this.ctx.beginPath();
            this.ctx.arc(staffEndX + 0 * staffDir, staffEndY, 7, 0, Math.PI * 2);
            this.ctx.fillStyle = "#FFD700";
            this.ctx.fill();

            // Staff end (rounded at hand)
            this.ctx.beginPath();
            this.ctx.arc(staffX, staffY, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = "#FFD700";
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    drawHealth(p, x, y) {
        for (let i = 0; i < Math.floor(p.health); i++) {
            this.ctx.fillStyle = "#e33";
            this.ctx.fillRect(x + i * 22, y, 20, 20);
        }
        // Draw half-heart if needed
        if (p.health % 1 >= 0.5) {
            this.ctx.fillStyle = "#e33";
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(x + Math.floor(p.health) * 22, y, 20, 20);
            this.ctx.globalAlpha = 1.0;
        }
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