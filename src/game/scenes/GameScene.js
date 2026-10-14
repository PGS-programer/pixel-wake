import { screen, action } from '../ui/screen.js';
import { mobileControls, portraitTouch, touchDevice } from '../ui/mobile.js';
import * as Phaser from 'phaser';
import { STORAGE_KEYS } from '../config.js';
import { BOATS } from '../data/boats.js';
import { safeLoadNumber, safeSaveNumber, safeLoadString, loadUnlockedBoats } from '../services/storage.js';
import { createOceanBackdrop } from '../visuals/ocean.js';
import { buildBoat } from '../visuals/boat.js';
import { createGameHud, updateMissionHud } from '../ui/gameHud.js';
import { showRunResults } from '../ui/runResults.js';
import { label, button, bindKey, enter, C } from '../ui/kit.js';
import { audio } from '../services/audio.js';
import { getSettings, saveSettings } from '../services/preferences.js';
import { loadProgress, saveProgress } from '../services/progress.js';
import { settleRun, availableTrails } from '../data/progression.js';
import { seededRandom } from '../systems/rules.js';
import { BALANCE } from '../config.js';
import { obstaclesMethods } from '../systems/obstacles.js';
import { coinsMethods } from '../systems/coins.js';
import { effectsMethods } from '../systems/effects.js';
import { scoringMethods } from '../systems/scoring.js';
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        if (portraitTouch()) { this.scene.start('MenuScene'); return; }
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        this.isGameOver = false;
        this.isPaused = false;
        this.pauseObjects = [];
        this.touchTarget = null;
        this.elapsed = 0;
        this.nearMisses = 0;
        this.encounterIndex = 0;
        this.profile = loadProgress();
        this.settings = getSettings();
        this.trail = availableTrails(this.profile).includes(this.settings.trail) ? this.settings.trail : 'foam';
        this.trailColor = { foam: 0xe5fbff, mint: 0x46dfc1, gold: 0xffd166 }[this.trail];
        const suppliedSeed = new URLSearchParams(window.location.search).get('seed');
        this.seed = suppliedSeed !== null && Number.isFinite(Number(suppliedSeed)) ? Number(suppliedSeed) >>> 0 : crypto.getRandomValues(new Uint32Array(1))[0];
        this.rng = seededRandom(this.seed);
        this.debugHitboxes = false;
        enter(this);

        this.distance = 0;
        this.points = 0;

        this.DEPTH_WORLD = 10;
        this.DEPTH_PLAYER = 30;
        this.DEPTH_PARTICLES = 50;
        this.DEPTH_HUD = 100;
        this.DEPTH_FLOATING_TEXT = 180;
        this.DEPTH_FEEDBACK = 200;
        this.DEPTH_COMBO = 300;
        this.DEPTH_GAME_OVER = 500;

        this.startingDistanceRecord = safeLoadNumber(STORAGE_KEYS.bestDistance);
        this.startingPointsRecord = safeLoadNumber(STORAGE_KEYS.bestPoints);
        this.distanceRecordBroken = false;
        this.pointsRecordBroken = false;

        this.walletCoins = safeLoadNumber(STORAGE_KEYS.coins);
        this.runCoins = 0;
        this.coins = [];
        

        this.difficultyLevel = 1;
        this.startGameSpeed = BALANCE.startSpeed;
        this.gameSpeed = this.startGameSpeed;
        this.targetGameSpeed = this.startGameSpeed;
        this.maxDifficultyLevel = BALANCE.maxLevel;
        this.distancePerLevel = BALANCE.distancePerLevel;

        this.obstacles = [];
        this.spawnTravel = 335;

        this.combo = 0;
        this.maxCombo = 0;
        this.comboDuration = BALANCE.comboDuration;
        this.comboTimer = 0;
        this.nearMissMargin = BALANCE.nearMissMargin;

        this.particles = [];
        this.floatingTexts = [];
        this.wakeParticleTimer = 0;
        this.feedbackTimer = 0;
        this.comboPopupTimer = 0;
        this.comboPopupDuration = 650;

        this.selectedBoat = safeLoadString(STORAGE_KEYS.selectedBoat, 'coastal');
        if (!BOATS.some((boat) => boat.id === this.selectedBoat) || !loadUnlockedBoats().includes(this.selectedBoat)) this.selectedBoat = 'coastal';

        this.waves = createOceanBackdrop(this);
        this.createBoat();
        this.createControls();
        this.createInterface();
        this.hitboxGraphics = this.add.graphics().setDepth(190);
        this.installLifecycle();
        this.startText.setVisible(false);
        this.installOpening();
        mobileControls(this);
        audio.play('start');
    }

    createBoat() {
        this.boat = buildBoat(this, this.selectedBoat, 170, this.gameHeight / 2, 1)
            .setDepth(this.DEPTH_PLAYER);

        this.boatHitbox = {
            halfWidth: 26,
            halfHeight: 10
        };
    }

    createControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({ up: 'W', down: 'S' });
    }

    createInterface() {
        createGameHud(this);
    }

    updateBoat(time, delta) {
        const step = BALANCE.playerSpeed * delta / 1000;
        let direction = this.mobileDirection || Number(this.cursors.down.isDown || this.keys.down.isDown) - Number(this.cursors.up.isDown || this.keys.up.isDown);
        if (!this.mobileDirection && this.touchTarget !== null) direction = Math.max(-1, Math.min(1, (this.touchTarget - this.boat.y) / Math.max(1, step)));
        this.boat.y = Math.max(110, Math.min(446, this.boat.y + direction * step));
        const targetRotation = direction ? direction * 0.075 : Math.sin(time / 210) * 0.012;
        this.boat.rotation += (targetRotation - this.boat.rotation) * (1 - Math.exp(-10.5 * delta / 1000));
        this.boat.list[0].scaleY = 1 + Math.abs(direction) * 0.3;
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.touchTarget = null;
        this.startText.setVisible(false);
        this.tutorialText.setVisible(false);
        this.comboPopupText.setVisible(false);
        this.feedbackText.setVisible(false);
        this.boat.rotation = 0.38;
        if (!this.settings.reducedEffects) this.cameras.main.shake(180, 0.006, true);
        this.createBurst(this.boat.x + 10, this.boat.y, 24, [0xffffff, 0xcdf8ff, 0x71d8ef, 0xf3c457], 180);
        audio.play('crash');
        const finalDistance = Math.floor(this.distance), finalPoints = Math.floor(this.points);
        const newRecord = finalDistance > this.startingDistanceRecord || finalPoints > this.startingPointsRecord;
        if (finalDistance > this.startingDistanceRecord) safeSaveNumber(STORAGE_KEYS.bestDistance, finalDistance);
        if (finalPoints > this.startingPointsRecord) safeSaveNumber(STORAGE_KEYS.bestPoints, finalPoints);
        const result = settleRun(this.profile, this.runStats());
        saveProgress(result.profile);
        this.walletCoins += result.reward;
        safeSaveNumber(STORAGE_KEYS.coins, this.walletCoins);
        if (newRecord || result.completed.length || result.unlocked.length) this.time.delayedCall(280, () => audio.play('reward'));
        this.time.delayedCall(this.settings.reducedEffects ? 0 : 90, () => showRunResults(this, result, newRecord));
    }

    runStats() { return { distance: this.distance, coins: this.runCoins, nearMisses: this.nearMisses, combo: this.maxCombo }; }

    visualBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    installLifecycle() {
        bindKey(this, 'keydown-P', () => this.togglePause());
        bindKey(this, 'keydown-ESC', () => this.togglePause());
        bindKey(this, 'keydown-H', () => { this.debugHitboxes = !this.debugHitboxes; this.drawHitboxes(); });
        bindKey(this, 'keydown-SPACE', () => { audio.unlock(); if (this.isGameOver) this.scene.restart(); });
        bindKey(this, 'keydown-M', () => { if (this.isGameOver) this.scene.start('MenuScene'); });
        const blur = () => { if (!this.isGameOver && !this.isPaused) this.togglePause(); audio.suspend(); };
        const visibility = () => { if (document.hidden) blur(); };
        window.addEventListener('blur', blur);
        document.addEventListener('visibilitychange', visibility);
        const target = pointer => {
            if (pointer.wasTouch && pointer.isDown && !this.isPaused && !this.isGameOver && pointer.y > 96 && pointer.y < 495) this.touchTarget = pointer.y;
        };
        this.input.on('pointerdown', target); this.input.on('pointermove', target);
        const release = () => { this.touchTarget = null; };
        this.input.on('pointerup', release); this.input.on('pointerupoutside', release);
        this.events.once('shutdown', () => {
            window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility);
            this.input.off('pointerdown', target); this.input.off('pointermove', target);
            this.input.off('pointerup', release); this.input.off('pointerupoutside', release);
        });
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        this.touchTarget = null;
        if (!this.isPaused) {
            this.pauseUi?.destroy(); this.pauseUi = null;
            this.pauseObjects.forEach(o => o.destroy()); this.pauseObjects = [];
            this.input.keyboard.resetKeys(); audio.unlock(); return;
        }
        audio.suspend();
        if (touchDevice()) {
            this.pauseUi = screen(this, 'MAR EN CALMA.', 'Partida pausada.');
            action(this.pauseUi.card, 'SEGUIR NAVEGANDO →', () => this.togglePause(), true);
            action(this.pauseUi.card, 'VOLVER AL MENÚ', () => this.scene.start('MenuScene')); return;
        }
        const overlay = this.add.rectangle(480, 270, 960, 540, C.navy, 0.88).setDepth(600).setInteractive();
        const title = label(this, 480, 186, 'MAR EN CALMA.', 32, '#fff4d9', 601).setOrigin(0.5);
        const hint = label(this, 480, 230, 'P / ESC PARA CONTINUAR', 13, '#93bdbe', 601).setOrigin(0.5);
        const resume = button(this, 480, 300, 'SEGUIR NAVEGANDO →', () => this.togglePause(), { primary: true, width: 360, depth: 602 });
        const menu = button(this, 480, 365, 'VOLVER AL MENÚ', () => this.scene.start('MenuScene'), { width: 360, depth: 602 });
        this.pauseObjects = [overlay, title, hint, resume, menu];
    }

    updateTutorial() {
        if (this.settings.tutorialSeen) { this.tutorialText.setVisible(false); return; }
        this.tutorialText.setText(this.elapsed < 5500 ? 'W / S o ↑ / ↓ para navegar · En móvil: ▲ ▼ o arrastra' : 'Pasa cerca sin chocar: +100 puntos y una cadena de combos');
        if (this.elapsed > 11500) { saveSettings({ tutorialSeen: true }); this.settings.tutorialSeen = true; this.tutorialText.setVisible(false); }
    }

    drawHitboxes() {
        const g = this.hitboxGraphics; g.clear();
        if (!this.debugHitboxes) return;
        g.lineStyle(1, 0xffd166, 1).strokeRect(this.boat.x - 26, this.boat.y - 10, 52, 20);
        for (const o of this.obstacles) g.lineStyle(1, 0xff7c74, 1).strokeRect(o.x - o.hitboxHalfWidth, o.y - o.hitboxHalfHeight, o.hitboxHalfWidth * 2, o.hitboxHalfHeight * 2);
        for (const c of this.coins) g.lineStyle(1, 0x46dfc1, 1).strokeRect(c.x - 8, c.y - 10, 16, 20);
    }

    update(time, delta) {
        // Clamp a stalled frame; no teleporting after a tab switch.
        delta = Math.min(delta, 40);
        if (this.isPaused) return;
        this.updateParticles(delta);
        this.updateFloatingTexts(delta);
        this.updateFeedback(delta);
        this.updateComboPopup(delta);
        if (this.isGameOver) return;
        this.elapsed += delta;
        this.previousBoatY = this.boat.y;
        this.updateBoat(time, delta);
        this.updateWakeParticles(delta);
        this.updateDifficulty(delta);
        this.updateOcean(delta);
        this.updateSpawner(delta);
        this.updateObstacles(delta);
        this.updateCoins(time, delta);
        if (this.checkCollisions()) return;
        this.checkNearMisses();
        this.updateCombo(delta);
        this.updateScores(delta);
        updateMissionHud(this);
        this.updateTutorial();
        this.drawHitboxes();
    }

}
Object.assign(GameScene.prototype, obstaclesMethods, coinsMethods, effectsMethods, scoringMethods);
export default GameScene;
