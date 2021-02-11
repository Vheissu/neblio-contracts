import { AdapterBase } from './base.adapter';

import BigNumber from 'bignumber.js';

import { MongoClient, Db } from 'mongodb';

const calculateBalance = (balance, quantity, precision, add) => {
    if (add) {
        return new BigNumber(balance).plus(quantity).toFixed(precision);
    }

    return new BigNumber(balance).minus(quantity).toFixed(precision);
};

export class MongodbAdapter extends AdapterBase {
    private client: MongoClient;
    private db: Db;

    private mongo = {
        uri: '',
        database: '',
        options: {}
    };

    private block: any;

    constructor(uri: string, database: string, options = { useNewUrlParser: true,  useUnifiedTopology: true }) {
        super();

        this.mongo.uri = uri;
        this.mongo.database = database;
        this.mongo.options = options;
    }

    protected async getDbInstance() {
        try {
            this.client = await MongoClient.connect(this.mongo.uri, this.mongo.options);
            this.db = this.client.db(this.mongo.database);

            return this.db;
        } catch (e) {
            throw e;
        }
    }

    protected async create(): Promise<boolean> {
        try {
            this.client = await MongoClient.connect(this.mongo.uri, this.mongo.options);
            this.db = this.client.db(this.mongo.database);

            return true;
        } catch (e) {
            throw e;
        }
    }

    protected async addToUserBalance(account: string, token: any, amount: string): Promise<any> {
        const balance = await this.db.collection('balances').findOne({account, symbol: token.symbol});

        // No existing balance, add new DB row
        if (!balance) {
            balance.account = account;
            balance.symbol = token.symbol;
            balance.balance = amount;

            await this.db.collection('balances').insertOne(balance);

            return true;
        }

        const currentBalance = balance.balance;
        const adjustedBalance = calculateBalance(balance.balance, amount, token.precision, true);

        if (! new BigNumber(adjustedBalance).gt(currentBalance)) {
            return null;
        }

        await this.db.collection('balances').updateOne({account, symbol: token.symbol}, balance);
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

    protected async loadState(): Promise<any> {
        try {
            if (!this.db) {
                await this.getDbInstance();
            }

            const collection = this.db.collection('params');
            const params = await collection.findOne({});

            if (params) {
                return params;
            }
        } catch (e) {
            throw e;
        }
    }

    protected async saveState(data: any): Promise<boolean> {
        try {
            if (!this.db) {
                await this.getDbInstance();
            }

            const collection = this.db.collection('params');

            await collection.replaceOne({}, data, {  upsert: true});

            return true;
        } catch (e) {
            throw e;
        }
    }

    protected async processBlock(block: any) {
        this.block = block;
    }

    protected async destroy(): Promise<boolean> {
        await this.client.close();

        return true;
    }
}
