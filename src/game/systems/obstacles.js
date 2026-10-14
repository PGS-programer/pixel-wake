import { crossingSample } from './rules.js';
import { chooseEncounter, openingPattern } from './spawnDirector.js';
import { obstacleSpec, atTravel } from '../data/obstacles.js';
import { buildObstacle } from '../entities/obstacle.js';
export const obstaclesMethods = {
    randomBetween(min, max) { return Math.floor(this.rng() * (max - min + 1)) + min; },
    createObstacle(spec) {
        const object = buildObstacle(this, spec);
        this.obstacles.push(object);
        return object;
    },
    createRock() { return this.createObstacle(obstacleSpec('rock', this.gameWidth + 70, this.randomBetween(145, 410))); },
    installOpening() {
        const plan = openingPattern(); this.commitEncounter(plan);
        this.spawnTravel = 335; this.previousPattern = plan.id;
    },
    commitEncounter(plan) {
        plan.obstacles.forEach(o => this.createObstacle(o));
        plan.coins.forEach((c, i) => this.createCoin(c.x, c.y, i * 0.9, c.speedFactor));
        this.previousPattern = plan.id;
    },
    updateSpawner(delta) {
        this.spawnTravel -= this.gameSpeed * delta / 1000;
        if (this.spawnTravel > 0) return;
        const plan = chooseEncounter({ level: this.difficultyLevel, index: this.encounterIndex++, random: this.rng,
            hazards: this.obstacles, coins: this.coins, playerY: this.boat.y, previousPattern: this.previousPattern });
        this.commitEncounter(plan); this.spawnTravel = plan.nextTravel;
    },
    updateObstacles(delta) {
        const travel = this.gameSpeed * delta / 1000;
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const o = this.obstacles[i];
            o.previousX = o.x; o.previousY = o.y;
            const next = atTravel(o, travel);
            o.x = next.x; o.y = next.y; o.travelled += travel;
            o.foam.scaleX = 1 + Math.sin(o.travelled / 22) * 0.09;
            o.foam.alpha = 0.7 + Math.sin(o.travelled / 31) * 0.2;
            if (o.warning) { o.warning.setPosition(939, o.y); o.warning.setVisible(o.x > 960 && o.x < 1210); }
            if (o.x < -100) { o.destroy(); this.obstacles.splice(i, 1); }
        }
    },
    checkCollisions() {
        for (const o of this.obstacles) {
            if (crossingSample(this.boat, this.previousBoatY ?? this.boat.y, this.boatHitbox, o).collision) {
                this.triggerGameOver(); return true;
            }
        }
        return false;
    }
};
