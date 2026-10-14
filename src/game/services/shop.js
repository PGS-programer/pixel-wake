import { BOATS } from '../data/boats.js';
import { STORAGE_KEYS } from '../config.js';
import { safeLoadNumber, safeSaveNumber, safeSaveString, loadUnlockedBoats, saveUnlockedBoats } from './storage.js';
export function chooseBoat(id) {
    const boat = BOATS.find(b => b.id === id); if (!boat) throw new Error('Barco desconocido.');
    const owned = loadUnlockedBoats(), coins = safeLoadNumber(STORAGE_KEYS.coins);
    if (!owned.includes(id)) {
        if (coins < boat.price) throw new Error(`Te faltan ${boat.price - coins} monedas.`);
        safeSaveNumber(STORAGE_KEYS.coins, coins - boat.price); saveUnlockedBoats([...owned, id]);
    }
    safeSaveString(STORAGE_KEYS.selectedBoat, id);
}
