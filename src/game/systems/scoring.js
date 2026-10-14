import { formatNumber } from '../ui/format.js';
import { difficulty, nextCombo, tickCombo } from './rules.js';
import { BALANCE } from '../config.js';
import { crossingSample } from './rules.js';
import { audio } from '../services/audio.js';
export const scoringMethods = {
    updateDifficulty(delta) {
        const currentDistance = Math.floor(this.distance);
        const calculatedLevel = difficulty(currentDistance);

        if (calculatedLevel > this.difficultyLevel) {
            audio.play('level');
            this.difficultyLevel = calculatedLevel;
            this.targetGameSpeed = this.startGameSpeed + (this.difficultyLevel - 1) * BALANCE.speedPerLevel;
            this.levelText.setText(`COSTA / NIVEL ${this.difficultyLevel}`);
            this.showFeedback(`¡MÁS VELOCIDAD! · NIVEL ${this.difficultyLevel}`, '#ffffff', 1000);
            this.createSpeedLines();
        }

        const acceleration = 72 * (delta / 1000);
        if (this.gameSpeed < this.targetGameSpeed) {
            this.gameSpeed = Math.min(this.targetGameSpeed, this.gameSpeed + acceleration);
        }
    },
    checkNearMisses() {
        for (const obstacle of this.obstacles) {
            if (obstacle.nearMissChecked) continue;

            const sample = crossingSample(this.boat, this.previousBoatY ?? this.boat.y, this.boatHitbox, obstacle, this.nearMissMargin);
            if (!sample.collision && sample.nearGap !== null) {
                obstacle.nearMissCandidate = true;
                obstacle.bestNearMissGap = Math.min(obstacle.bestNearMissGap, sample.nearGap);
            }

            const obstacleRightSide = obstacle.x + obstacle.hitboxHalfWidth;
            const boatLeftSide = this.boat.x - this.boatHitbox.halfWidth;

            if (obstacleRightSide < boatLeftSide) {
                obstacle.nearMissChecked = true;
                if (obstacle.nearMissCandidate) this.registerNearMiss();
            }
        }
    },
    registerNearMiss() {
        const next = nextCombo(this.combo);
        this.combo = next.combo;
        this.nearMisses += 1;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.comboTimer = next.timer;
        const bonus = next.bonus;
        audio.play('near', this.combo);
        this.points += bonus;

        this.comboText.setText(`COMBO x${this.combo}`);
        this.comboText.alpha = 1;

        this.createFloatingText(
            this.boat.x + 88,
            this.boat.y - 35,
            `POR LOS PELOS +${bonus}`,
            '#ffe16b'
        );

        this.createBurst(
            this.boat.x - 5,
            this.boat.y,
            8 + Math.min(3, Math.floor(this.combo / 4)) * 4,
            [0xffffff, 0xcdf8ff, 0x73d8f3],
            100
        );

        if (!this.settings.reducedEffects) this.cameras.main.shake(55, 0.0008 + Math.min(3, Math.floor(this.combo / 4)) * 0.0002, true);
        this.showComboPopup(this.combo);
    },
    updateCombo(delta) {
        if (this.combo <= 0) {
            this.comboText.alpha = 0;
            return;
        }

        const next = tickCombo(this.combo, this.comboTimer, delta);
        this.comboTimer = next.timer;
        this.combo = next.combo;

        if (this.comboTimer <= 0) {
            this.combo = 0;
            this.comboTimer = 0;
            this.comboText.alpha = 0;
            return;
        }

        this.comboText.setText(`COMBO x${this.combo}`);

        if (this.comboTimer < 1000) {
            const blink = Math.floor(this.comboTimer / 120) % 2;
            this.comboText.alpha = blink === 0 ? 0.45 : 1;
        } else {
            this.comboText.alpha = 1;
        }
    },
    updateScores(delta) {
        const speedMultiplier = this.gameSpeed / this.startGameSpeed;

        this.distance += delta * 0.012 * speedMultiplier;
        this.points += delta * 0.006 * speedMultiplier;

        const currentDistance = Math.floor(this.distance);
        const currentPoints = Math.floor(this.points);

        this.distanceText.setText(` ${formatNumber(currentDistance)} m`);
        this.pointsText.setText(` ${formatNumber(currentPoints)}`);

        const displayedDistanceBest = Math.max(this.startingDistanceRecord, currentDistance);
        const displayedPointsBest = Math.max(this.startingPointsRecord, currentPoints);

        this.distanceBestText.setText(`RÉCORD ${formatNumber(displayedDistanceBest)} m`);
        this.pointsBestText.setText(`RÉCORD ${formatNumber(displayedPointsBest)}`);

        if (
            !this.distanceRecordBroken &&
            this.startingDistanceRecord > 0 &&
            currentDistance > this.startingDistanceRecord
        ) {
            this.distanceRecordBroken = true;
            audio.play('reward');
            this.showFeedback('★ NUEVO RÉCORD DE DISTANCIA ★', '#ffe16b', 1700);
        }

        if (
            !this.pointsRecordBroken &&
            this.startingPointsRecord > 0 &&
            currentPoints > this.startingPointsRecord
        ) {
            this.pointsRecordBroken = true;
            audio.play('reward');
            this.showFeedback('★ NUEVO RÉCORD DE PUNTOS ★', '#ffe16b', 1700);
        }

        const displayedKnots = 13.5 * speedMultiplier;
        this.speedText.setText(`${displayedKnots.toFixed(1)} kn`);
    },
};
