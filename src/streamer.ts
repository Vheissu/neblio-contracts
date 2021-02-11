import { DiceContract } from './contracts/dice.contract';
import { Utils } from './utils';

import { MongodbAdapter } from './adapters/mongodb.adapter';

import axios from 'axios';
import { config } from './config';

interface Contract {
    name: string;
    contract: any;
}

export class Streamer {
    private subscriptions: any[] = [];
    private ntp1Subscriptions: any[] = [];

    private contracts: Contract[] = [];
    private adapter;

    private lastBlockNum = 0;

    private blockHeightStreamer;

    constructor() {
        this.blockHeightStreamer = setInterval(async () => {
            const latestBlockHeight = await this.getBlockCount();

            if (latestBlockHeight) {
                this.lastBlockNum = latestBlockHeight;
            }
        }, config.BLOCK_CHECK_INTERVAL);

        this.registerContract('nebldice', new DiceContract());
        this.registerAdapter(new MongodbAdapter(config.MONGO_HOST, config.MONGO_DB));
    }

    public registerAdapter(adapter: any) {
        this.adapter = adapter;

        if (this?.adapter?.create) {
            this.adapter.create();
        }
    }

    public getAdapter() {
        return this.adapter;
    }

    public registerContract(name: string, contract: any) {
        // Store an instance of the streamer
        contract['$instance'] = this;

        // Call the contract create lifecycle method if it exists
        if (contract && typeof contract['create'] !== 'undefined') {
            contract.create();
        }

        const storedReference: Contract = { name, contract };

        // Push the contract reference to be called later on
        this.contracts.push(storedReference);

        if (this.adapter?.contractRegistered) {
            this.adapter?.contractRegistered(name);
        }

        return this;
    }

    public unregisterContract(name: string) {
        // Find the registered contract by it's ID
        const contractIndex = this.contracts.findIndex(c => c.name === name);

        if (contractIndex >= 0) {
            // Get the contract itself
            const contract = this.contracts.find(c => c.name === name);

            // Call the contract destroy lifecycle method if it exists
            if (contract && typeof contract.contract['destroy'] !== 'undefined') {
                contract.contract.destroy();
            }

            // Remove the contract
            this.contracts.splice(contractIndex, 1);
        }
    }

    async start() {
        const state = await this.adapter.loadState();

        if (state?.lastBlockNumber) {
            if (state.lastBlockNumber) {
                this.lastBlockNum = state.lastBlockNumber;
            }
        }

        if (this.lastBlockNum === 0) {
            const latestBlockHeight = await this.getBlockCount();

            if (latestBlockHeight) {
                this.lastBlockNum = latestBlockHeight;
            }
        }

        console.log(`Starting from block ${this.lastBlockNum}`);

        this.handleBlock(this.lastBlockNum);
    }

    async getBlockCount() {
        const response = (await Utils.walletRequest('getblockcount')) as any;

        if (response.result) {
            return response.result;
        }

        return null;
    }

    async getBlock(blockNumber) {
        return Utils.walletRequest('getblockbynumber', [blockNumber, true]);
    }

    async handleBlock(blockNum) {
        if (this.lastBlockNum >= blockNum) {
            const block = (await this.getBlock(blockNum)) as any;

            if (block.result) {
                console.log(`New block height is ${blockNum} ${block.result.time}`);

                if (this.adapter?.processBlock) {
                    this.adapter.processBlock(block.result);
                }

                // Loop over all subscriptions and call the supplied callback, passing the block result in
                for (const sub of this.subscriptions) {
                    sub.callback(block.result);
                }

                // Does this block contain any ntp1 token transactions?
                // we use a reduce to create a new array of ntp1 tokens
                const ntp1Transactions = block.result.tx.reduce((acc, value) => {
                    if (value.ntp1) {
                        acc.push(value);
                    }

                    return acc;
                }, []);

                // Does this block have any ntp1 transactions?
                if (ntp1Transactions.length) {
                    if (this.adapter?.processNtp1Block && ntp1Transactions.length) {
                        this.adapter.processNtp1Block(block.result);
                    }

                    for (const ntp1 of ntp1Transactions) {
                        if (ntp1?.metadataOfUtxos) {
                            const { metadataOfUtxos: { userData: { meta } } } = ntp1;

                            if (meta) {
                                const { name, action, payload } = meta;
    
                                const contract = this.contracts.find(c => c.name === name);
    
                                if (contract) {
                                    if (contract?.contract.updateBlockInfo) {
                                        contract.contract.updateBlockInfo(block.result);
                                    }
    
                                    if (contract?.contract?.[action]) {
                                        contract.contract?.[action](payload, block.result);
                                    }
                                }
                            }
                        }
                    }

                    // Call one or more ntp1 subscriptions, pass the block result as the first argument
                    // and pass the array of ntp1 transactions as the second argument
                    for (const sub of this.ntp1Subscriptions) {
                        sub.callback(block.result, ntp1Transactions);
                    }
                }

                this.lastBlockNum = blockNum;
                await this.saveState();

                this.handleBlock(blockNum + 1);
            } else {
                console.error(`Block does not exist`);
                this.handleBlock(blockNum);
            }
        } else {
            await Utils.sleep(500);
            this.handleBlock(blockNum);
        }
    }

    async getTransaction(txId: string) {
        // Test: f1eb2c44be5745dc47aedea9c9e9bf4bf2427a309b71b71d6c5ee05cf7c11b82
        return axios.get(`https://explorer.nebl.io/api/getrawtransaction?txid=${txId}&decrypt=1`);
    }

    public async saveState(): Promise<void> {
        if (this.adapter?.saveState) {
            this.adapter.saveState({lastBlockNumber: this.lastBlockNum});
        }
    }

    addSubscription(callback) {
        this.subscriptions.push({ callback });
    }

    addNtp1Subscription(callback) {
        this.ntp1Subscriptions.push({ callback });
    }
}
