export const effectsMethods = {
    updateWakeParticles(delta) {
        this.wakeParticleTimer -= delta;
        if (this.wakeParticleTimer > 0) return;

        this.wakeParticleTimer = this.settings.reducedEffects ? 140 : 65;
        const count = Math.random() < 0.45 ? 2 : 1;

        for (let i = 0; i < count; i++) {
            const particle = this.add.rectangle(
                this.boat.x - 42,
                this.boat.y + this.visualBetween(-11, 11),
                this.visualBetween(4, 9),
                this.visualBetween(2, 4),
                this.trailColor,
                0.75
            ).setDepth(this.DEPTH_PARTICLES);

            this.particles.push({
                object: particle,
                vx: -this.visualBetween(80, 145),
                vy: this.visualBetween(-25, 25),
                life: 450,
                maxLife: 450
            });
        }
    },
    createBurst(x, y, amount, colors, speed) {
        if (this.settings.reducedEffects) amount = Math.min(amount, 4);
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = speed * (0.45 + Math.random() * 0.65);
            const size = this.visualBetween(3, 7);
            const color = colors[this.visualBetween(0, colors.length - 1)];

            const particle = this.add.rectangle(x, y, size, size, color, 1)
                .setDepth(this.DEPTH_PARTICLES);

            this.particles.push({
                object: particle,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: this.visualBetween(350, 650),
                maxLife: 650
            });
        }
    },
    createSpeedLines() {
        if (this.settings.reducedEffects) return;
        for (let i = 0; i < 12; i++) {
            const line = this.add.rectangle(
                this.visualBetween(250, this.gameWidth),
                this.visualBetween(100, this.gameHeight - 70),
                this.visualBetween(35, 80),
                3,
                0xcaf6ff,
                0.55
            ).setDepth(this.DEPTH_PARTICLES);

            this.particles.push({
                object: line,
                vx: -this.visualBetween(500, 750),
                vy: 0,
                life: 420,
                maxLife: 420
            });
        }
    },
    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            particle.life -= delta;
            particle.object.x += particle.vx * (delta / 1000);
            particle.object.y += particle.vy * (delta / 1000);
            particle.object.alpha = Math.max(0, particle.life / particle.maxLife);

            if (particle.life <= 0) {
                particle.object.destroy();
                this.particles.splice(i, 1);
            }
        }
    },
    updateOcean(delta) {
        this.waves.forEach((waveData) => {
            waveData.object.x -= this.gameSpeed * waveData.speedFactor * (delta / 1000);
            if (waveData.object.x < -waveData.width) {
                waveData.object.x = this.gameWidth + waveData.width;
            }
        });
    },
    showComboPopup(comboValue) {
        const title = comboValue >= 10 ? 'ESTELA PERFECTA' : comboValue >= 5 ? 'AL LÍMITE' : 'POR LOS PELOS';
        this.comboPopupText.setText(`${title} · x${comboValue}`);

        if (comboValue <= 2) this.comboPopupText.setColor('#fff3b0');
        else if (comboValue <= 4) this.comboPopupText.setColor('#ffd447');
        else if (comboValue <= 6) this.comboPopupText.setColor('#ff9f43');
        else if (comboValue <= 9) this.comboPopupText.setColor('#ff5c70');
        else this.comboPopupText.setColor('#ff4678');

        this.comboPopupTimer = this.comboPopupDuration;
        this.comboPopupText.alpha = 1;
        this.comboPopupText.setScale(0.65);
        this.comboPopupText.y = 112;
    },
    updateComboPopup(delta) {
        if (this.comboPopupTimer <= 0) {
            this.comboPopupText.alpha = 0;
            return;
        }

        this.comboPopupTimer -= delta;
        const progress = 1 - (this.comboPopupTimer / this.comboPopupDuration);

        let scale;
        if (progress < 0.16) scale = 0.65 + progress * 3.5;
        else scale = 1.1 - (progress - 0.16) * 0.2;

        this.comboPopupText.setScale(scale);
        this.comboPopupText.y = 112 - progress * 4;

        if (progress > 0.62) {
            this.comboPopupText.alpha = Math.max(0, 1 - ((progress - 0.62) / 0.38));
        }
    },
    createFloatingText(x, y, message, color) {
        const text = this.add.text(x, Math.max(155, Math.min(435, y)), message, {
            fontFamily: 'monospace',
            fontSize: '17px',
            color,
            stroke: '#573500',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(this.DEPTH_FLOATING_TEXT);

        this.floatingTexts.push({ object: text, life: 850, maxLife: 850 });
    },
    updateFloatingTexts(delta) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const floating = this.floatingTexts[i];
            floating.life -= delta;
            floating.object.y -= 25 * (delta / 1000);
            floating.object.alpha = Math.max(0, floating.life / floating.maxLife);

            if (floating.life <= 0) {
                floating.object.destroy();
                this.floatingTexts.splice(i, 1);
            }
        }
    },
    showFeedback(message, color, duration) {
        this.feedbackText.setText(message);
        this.feedbackText.setColor(color);
        this.feedbackText.alpha = 1;
        this.feedbackTimer = duration;
    },
    updateFeedback(delta) {
        if (this.feedbackTimer <= 0) {
            this.feedbackText.alpha = 0;
            return;
        }

        this.feedbackTimer -= delta;
        if (this.feedbackTimer < 350) {
            this.feedbackText.alpha = Math.max(0, this.feedbackTimer / 350);
        } else {
            this.feedbackText.alpha = 1;
        }
    },
};
