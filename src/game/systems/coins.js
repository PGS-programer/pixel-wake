import { STORAGE_KEYS } from '../config.js';
import { safeSaveNumber } from '../services/storage.js';
import { audio } from '../services/audio.js';
export const coinsMethods = {
    createCoin(x, y, phase, speedFactor = 1) {
        const coin = this.add.graphics();

        coin.fillStyle(0xd58b12);
        coin.fillRect(-8, -10, 16, 20);

        coin.fillStyle(0xffdf43);
        coin.fillRect(-5, -7, 10, 14);

        coin.fillStyle(0xfff6a6);
        coin.fillRect(-3, -5, 3, 6);

        coin.x = x;
        coin.y = y;
        coin.phase = phase;
        coin.speedFactor = speedFactor;
        coin.setDepth(20);

        this.coins.push(coin);
    },
    updateCoins(time, delta) {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];

            coin.x -= this.gameSpeed * coin.speedFactor * (delta / 1000);

            const spin = Math.abs(Math.cos(time / 130 + coin.phase));
            coin.scaleX = 0.35 + spin * 0.65;

            const collisionX = Math.abs(this.boat.x - coin.x) < 34;
            const collisionY = Math.abs(this.boat.y - coin.y) < 21;

            if (collisionX && collisionY) {
                this.collectCoin(coin);
                this.coins.splice(i, 1);
                continue;
            }

            if (coin.x < -30) {
                coin.destroy();
                this.coins.splice(i, 1);
            }
        }
    },
    collectCoin(coin) {
        audio.play('coin');
        this.runCoins += 1;
        this.walletCoins += 1;
        this.points += 75;

        safeSaveNumber(STORAGE_KEYS.coins, this.walletCoins);
        this.coinText.setText(`${this.walletCoins} MONEDAS`);

        this.createFloatingText(coin.x, coin.y - 18, '+1 · +75 PTS', '#ffe16b');
        this.createBurst(coin.x, coin.y, 8, [0xffdf43, 0xfff2a1, 0xf0a517], 120);

        coin.destroy();
    },
};
