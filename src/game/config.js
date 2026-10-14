export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const STORAGE_KEYS = {
    bestDistance: 'pixelWakeHighScore',
    bestPoints: 'pixelWakeBestPoints',
    coins: 'pixelWakeCoins',
    selectedBoat: 'pixelWakeSelectedBoat',
    unlockedBoats: 'pixelWakeUnlockedBoats'
};

export const BALANCE = Object.freeze({
    startSpeed: 220, playerSpeed: 420, speedPerLevel: 18, maxLevel: 14, distancePerLevel: 250,
    comboDuration: 3000, nearMissMargin: 30
});
