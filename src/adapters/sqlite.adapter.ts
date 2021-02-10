import { AdapterBase } from './base.adapter';

import { Database } from 'sqlite3';

import path from 'path';

import BigNumber from 'bignumber.js';

const calculateBalance = (balance, quantity, precision, add) => {
    if (add) {
        return new BigNumber(balance).plus(quantity).toFixed(precision);
    }

    return new BigNumber(balance).minus(quantity).toFixed(precision);
};

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

                const tokens = `
                    CREATE TABLE IF NOT EXISTS tokens (
                        id TEXT NOT NULL UNIQUE,
                        name TEXT NOT NULL UNIQUE CHECK (typeof("name") = "text" AND length("name") <= 50),
                        symbol TEXT NOT NULL UNIQUE CHECK (typeof("symbol") = "text" AND length("symbol") <= 4),
                        precision INTEGER DEFAULT(8),
                        supply INTEGER,
                        account TEXT NOT NULL
                    )`;

                const balances = `
                    CREATE TABLE IF NOT EXISTS balances (
                        account TEXT NOT NULL,
                        symbol TEXT NOT NULL,
                        balance TEXT NOT NULL
                    )`;

                const transfers = `
                    CREATE TABLE IF NOT EXISTS transfers (
                        id TEXT NOT NULL UNIQUE,
                        blockId TEXT,
                        blockNumber INTEGER,
                        sender TEXT,
                        amount TEXT,
                        contractName TEXT,
                        contractAction TEXT,
                        contractPayload TEXT
                    )`;

                this.db
                    .run(params)
                    .run(tokens)
                    .run(balances)
                    .run(transfers, () => {
                        resolve(true);
                    });
            });
        });
    }

    protected async addToUserBalance(account: string, token: any, quantity: string): Promise<any> {
        const balance = await this.getUserBalanceForSymbol(account, token.symbol) as any;

        // No existing balance, add new DB row
        if (!balance) {
            const insertSql = `INSERT INTO balances (account, symbol, balance) VALUES ('${account}', '${token.symbol}', '${quantity})`;

            await this.runSql(insertSql);
        }

        const currentBalance = balance.balance;
        const adjustedBalance = calculateBalance(balance.balance, quantity, token.precision, true);

        if (! new BigNumber(adjustedBalance).gt(currentBalance)) {
            return null;
        }

        const updateSql = `UPDATE balances SET balance = ${adjustedBalance} WHERE account = ${account} AND symbol = ${token.symbol}`;

        await this.runSql(updateSql);
    }

    protected async getUserBalanceForSymbol(account: string, symbol: string) {
        return new Promise(resolve => {
            this.db.all(`SELECT account, symbol, balance FROM balances WHERE account = ${account} AND symbol = ${symbol}`, (err, rows) => {
                if (!err) {
                    const balance = rows?.[0];

                    return resolve(balance);
                }

                return resolve(null);
            });
        });
    }

    protected async runSql(sql: string) {
        return new Promise((resolve) => {
            this.db.run(sql, [], (err, result) => {
                if (!err) {
                    return resolve(result);
                }

                return resolve(null);
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
