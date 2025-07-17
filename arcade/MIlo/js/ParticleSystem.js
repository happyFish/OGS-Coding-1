class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawnParticles(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3,
                alpha: 1,
                life: 20 + Math.random() * 10
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.alpha -= 0.04;
            p.life--;
            if (p.life <= 0 || p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    getParticles() {
        return this.particles;
    }
} 