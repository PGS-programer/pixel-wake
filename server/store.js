import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { SqlStore } from './sql-store.js';
export class Store extends SqlStore {
    constructor(path) {
        if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
        const db = new DatabaseSync(path);
        db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
        db.transaction = fn => {
            db.exec('BEGIN IMMEDIATE');
            try { const value = fn(); db.exec('COMMIT'); return value; }
            catch (e) { db.exec('ROLLBACK'); throw e; }
        };
        super(db);
    }
}
