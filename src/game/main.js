import ProfileScene from './scenes/ProfileScene.js';
import RankingScene from './scenes/RankingScene.js';
import MultiplayerMenuScene from './scenes/MultiplayerMenuScene.js';
import LobbyScene from './scenes/LobbyScene.js';
import MultiplayerGameScene from './scenes/MultiplayerGameScene.js';
import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import MenuScene from './scenes/MenuScene.js';
import GarageScene from './scenes/GarageScene.js';
import GameScene from './scenes/GameScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import JournalScene from './scenes/JournalScene.js';
import { watchViewport } from './services/viewport.js';
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#155e85',
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: { activePointers: 2 },
    scene: [ProfileScene, RankingScene, MultiplayerMenuScene, LobbyScene, MultiplayerGameScene, MenuScene, GarageScene, GameScene, SettingsScene, JournalScene]
};

const StartGame = (parent) => {
    return new Phaser.Game({
        ...config,
        parent,
        callbacks: { postBoot: game => watchViewport(game, document.getElementById(parent)) }
    });
};

export default StartGame;
