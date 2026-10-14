import { DatabaseSync } from 'node:sqlite';
import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { normalizePlayer, validateUpload } from '../src/shared/profile.js';
const hash = token => createHash('sha256').update(token).digest('hex');
export class Store {
    constructor(path) {
        if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
        this.db = new DatabaseSync(path);
        this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
        CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0);
        CREATE TABLE IF NOT EXISTS leaderboard (player_id TEXT PRIMARY KEY REFERENCES profiles(id), player_name TEXT NOT NULL, best_score INTEGER NOT NULL CHECK(best_score>=0), best_distance INTEGER NOT NULL CHECK(best_distance>=0), updated_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS ranking_score ON leaderboard(best_score DESC, best_distance DESC, player_id);
        CREATE INDEX IF NOT EXISTS ranking_distance ON leaderboard(best_distance DESC, best_score DESC, player_id);
        CREATE TABLE IF NOT EXISTS match_results (round_id TEXT PRIMARY KEY, room_code TEXT NOT NULL, host_id TEXT NOT NULL, guest_id TEXT NOT NULL, winner_id TEXT, reason TEXT NOT NULL, finished_at TEXT NOT NULL);`);
    }
    get(id) { const row = this.db.prepare('SELECT data FROM profiles WHERE id=?').get(id); return row ? JSON.parse(row.data) : null; }
    authenticate(id, token) {
        if (typeof id !== 'string' || typeof token !== 'string' || token.length < 32 || token.length > 128) return false;
        const row = this.db.prepare('SELECT token_hash FROM profiles WHERE id=?').get(id);
        return !!row && timingSafeEqual(Buffer.from(row.token_hash), Buffer.from(hash(token)));
    }
    register(id, token, value) {
        if (!/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Identidad inválida.');
        const old = this.get(id);
        if (old) { if (!this.authenticate(id, token)) throw new Error('Identidad no autorizada.'); return old; }
        const p = validateUpload(value); p.id = id; p.wins = 0; p.losses = 0; p.multiplayerGames = 0; p.updatedAt = new Date().toISOString(); p.revision = 1;
        this.db.prepare('INSERT INTO profiles VALUES (?,?,?,?)').run(id, hash(token), JSON.stringify(p), p.revision);
        this.rank(p); return p;
    }
    save(id, value) {
        const old = this.get(id), p = validateUpload(value);
        if (value.revision !== old.revision) return { conflict: true, profile: old };
        p.id = id; p.wins = old.wins; p.losses = old.losses; p.multiplayerGames = old.multiplayerGames;
        p.bestScore = Math.max(p.bestScore, old.bestScore); p.bestDistance = Math.max(p.bestDistance, old.bestDistance);
        p.gamesPlayed = Math.max(p.gamesPlayed, old.gamesPlayed); p.updatedAt = new Date().toISOString(); p.revision = old.revision + 1;
        this.db.exec('BEGIN IMMEDIATE');
        try { this.write(p); this.rank(p); this.db.exec('COMMIT'); } catch (e) { this.db.exec('ROLLBACK'); throw e; }
        return { profile: p };
    }
    write(p) { this.db.prepare('UPDATE profiles SET data=?,revision=? WHERE id=?').run(JSON.stringify(p), p.revision, p.id); }
    rank(p) {
        this.db.prepare(`INSERT INTO leaderboard VALUES (?,?,?,?,?) ON CONFLICT(player_id) DO UPDATE SET player_name=excluded.player_name,
        best_score=max(best_score,excluded.best_score),best_distance=max(best_distance,excluded.best_distance),updated_at=excluded.updated_at`).run(p.id, p.name, p.bestScore, p.bestDistance, p.updatedAt);
    }
    ranking(metric, id) {
        const order = metric === 'distance' ? 'best_distance DESC,best_score DESC,player_id' : 'best_score DESC,best_distance DESC,player_id';
        const sql = `SELECT player_id AS playerId,player_name AS playerName,best_score AS bestScore,best_distance AS bestDistance,updated_at AS updatedAt,ROW_NUMBER() OVER(ORDER BY ${order}) AS position FROM leaderboard`;
        const rows = this.db.prepare(`SELECT * FROM (${sql}) ORDER BY position LIMIT 10`).all();
        const me = this.db.prepare(`SELECT * FROM (${sql}) WHERE playerId=?`).get(id) || null;
        return { rows, me };
    }
    finish(round, room, winner, reason) {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            const inserted = this.db.prepare('INSERT OR IGNORE INTO match_results VALUES (?,?,?,?,?,?,?)').run(round, room.code, room.host, room.guest, winner, reason, new Date().toISOString());
            if (inserted.changes) for (const id of [room.host, room.guest]) {
                const p = normalizePlayer(this.get(id)); if (winner) p[id === winner ? 'wins' : 'losses']++; p.multiplayerGames++; p.gamesPlayed++; p.revision++; p.updatedAt = new Date().toISOString(); this.write(p);
            }
            this.db.exec('COMMIT');
        } catch (e) { this.db.exec('ROLLBACK'); throw e; }
    }
    close() { this.db.close(); }
}
