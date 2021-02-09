import { AdapterBase } from './base.adapter';

import { Database } from 'sqlite3';

import path from 'path';

export class SqliteAdapter extends AdapterBase {
    private db = new Database(path.resolve(__dirname, 'neblio-db.db'));

    private block: any;

    public getDb(): Database {
        return this.db;
    }

    protected async create(): Promise<boolean> {
        return new Promise((resolve) => {
            this.db.serialize(() => {
                const params = `CREATE TABLE IF NOT EXISTS params ( id INTEGER PRIMARY KEY, lastBlockNumber NUMERIC)`;
                const transfers = `CREATE TABLE IF NOT EXISTS transfers ( id TEXT NOT NULL UNIQUE, blockId TEXT, blockNumber INTEGER, sender TEXT, amount TEXT, contractName TEXT, contractAction TEXT, contractPayload TEXT)`;
  
                this.db
                    .run(params)
                    .run(transfers, () => {
                    resolve(true);
                });
            });
        })
    }

    protected async loadState(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT lastBlockNumber FROM params LIMIT 1', (err, rows) => {
                if (!err) {
                    if (rows.length) {
                        const row = rows[0];
                        resolve(row);
                    } else {
                        resolve(null);
                    }
                } else {
                    reject(err);
                }
            });
        });
    }

    protected async saveState(data: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql = `REPLACE INTO params (id, lastBlockNumber) VALUES(1, '${data.lastBlockNumber}')`;

            this.db.run(sql, [], (err, result) => {
                if (!err) {
                    resolve(true);
                } else {
                    reject(err);
                }
            });
        });
    }

    protected async processBlock(block: any) {
        this.block = block;
    }

    protected async destroy(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (!err) {
                    resolve(true);
                } else {
                    reject(err);
                }
            });
        });
    }
}