
import { Db, MongoClient } from 'mongodb';

export class Database {
    private db: Db = null;
    private client: MongoClient = null;
    private blockchain = null;

    async init(dbUrl: string, dbName: string) {
        this.client = await MongoClient.connect(dbUrl, { useNewUrlParser: true });
        this.db = await this.client.db(dbName);

        const neblio = await this.getCollection('blockchain');

        if (neblio === null) {
            this.blockchain = await this.db.createCollection('blockchain');

            await this.db.createCollection('contracts');
            await this.db.createCollection('transactions');
        }
    }

    close() {
        this.client.close();
    }

    getCollection(name: string) {
        return new Promise((resolve) => {
            this.db.collection(name, { strict: true }, (err, collection) => {
              if (err) {
                resolve(null);
              }

              resolve(collection);
            });
          });
    }

    async getTransaction(transactionId: string) {
        const transactionsTable = this.db.collection('transactions');
    
        const transaction = await transactionsTable.findOne({ _id: transactionId });
    
        let result = null;
    
        if (transaction) {
          const { index, blockNumber } = transaction;

          const block = await this.getBlockInfo(blockNumber);
    
          if (block) {
            result = Object.assign({}, { blockNumber }, block.transactions[index]);
          }
        }
    
        return result;
      }

    async addTransactions(block) {
        const transactionsTable = this.db.collection('transactions');

        const { transactions } = block;

        for (const [index, transaction] of transactions.entries()) {
            const transactionObject = {
                _id: transaction.id,
                blockNumber: block.blockNumber,
                index
            };

            await transactionsTable.insertOne(transactionObject);
        }
    }

    async getBlockInfo(blockNumber) {
        try {
            const block = typeof blockNumber === 'number' && Number.isInteger(blockNumber) ? await this.blockchain.findOne({ _id: blockNumber }) : null;
      
            return block;
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            return null;
          }
    }
}