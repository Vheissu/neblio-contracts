import { config } from '../config';
import { AdapterBase } from './base.adapter';

import BigNumber from 'bignumber.js';

import { MongoClient, Db } from 'mongodb';

import BlacklistedTokens from '../token-blacklist.json';

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

            const chainCollection = await this.db.collection('chain');

            if (!chainCollection) {
                await this.db.createCollection('chain');
                await this.db.createCollection('balances');
                await this.db.createCollection('contractBalances');
                await this.db.createCollection('neblBalances');
                await this.db.createCollection('tokens');
            }

            return true;
        } catch (e) {
            throw e;
        }
    }

    protected async depositNeblio(account: string, amount: string): Promise<any> {
        const collection = this.db.collection('neblBalances');
        const neblBalance = await collection.findOne({account});

    }

    protected async createToken(token: any): Promise<any> {
        const collection = this.db.collection('tokens');
        const tokenExists = await collection.findOne({symbol: token.symbol});
        
        const neblBalance = await this.db.collection('neblBalances').findOne({account: token.account});

        if (neblBalance) {
            if (neblBalance.balance) {
                const numericBalance = new BigNumber(neblBalance.balance);

                if (numericBalance.gte(config.TOKEN_CREATION_FEE)) {
                    // Token exists and isn't on the blacklist
                    if (!tokenExists && !BlacklistedTokens.includes(token.symbol.toLowerCase())) {
                        await collection.insertOne(token);

                        const finalBalance = numericBalance.minus(config.TOKEN_CREATION_FEE).toString();
                        neblBalance.balance = finalBalance;

                        await this.db.collection('neblBalances').updateOne({ account: token.account }, neblBalance);
                    }
                }
            }
        }
    }

    protected async addToUserBalance(account: string, token: any, amount: string): Promise<any> {
        const collection = this.db.collection('balances');
        const balance = await collection.findOne({account, symbol: token.symbol});

        // No existing balance, add new DB row
        if (!balance) {
            balance.account = account;
            balance.symbol = token.symbol;
            balance.balance = amount;

            await collection.insertOne(balance);

            return true;
        }

        const currentBalance = balance.balance;
        const adjustedBalance = calculateBalance(balance.balance, amount, token.precision, true);

        if (! new BigNumber(adjustedBalance).gt(currentBalance)) {
            return null;
        }

        await collection.updateOne({account, symbol: token.symbol}, balance);
    }

    protected async addToContractBalance(account: string, contract: string, token: any, amount: string): Promise<any> {
        const collection = this.db.collection('contractBalances');
        const balance = await collection.findOne({account, symbol: contract});

        // No existing balance, add new DB row
        if (!balance) {
            balance.account = account;
            balance.contract = contract;
            balance.balance = amount;

            await collection.insertOne(balance);

            return true;
        }

        const currentBalance = balance.balance;
        const adjustedBalance = calculateBalance(balance.balance, amount, token.precision, true);

        if (! new BigNumber(adjustedBalance).gt(currentBalance)) {
            return null;
        }

        await collection.updateOne({account, symbol: token.symbol}, balance);
    }

    protected async updateTokenMetadata(account: string, token: any, metadata: object): Promise<any> {
        const collection = this.db.collection('tokens');
        const tokenExists = await collection.findOne({symbol: token.symbol});

        if (tokenExists) {
            token.metadata = {...token.metadata, ...metadata};

            await collection.updateOne({symbol: token.symbol}, token);
        }
        
        return false;
    }

    protected async getUserBalanceForSymbol(account: string, symbol: string) {
        return this.db.collection('balances').findOne({account, symbol});
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

    protected async processNtp1Block(block: any) {
        this.block = block;

        const collection = this.db.collection('chain');

        return collection.insertOne(block);
    }

    protected async destroy(): Promise<boolean> {
        await this.client.close();

        return true;
    }
}
