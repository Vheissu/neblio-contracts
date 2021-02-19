export interface IVin {
    txid: string;
    vout: number;
    sscriptSig: any;
    sequence: number;
    tokens: any[];
}

export interface IVout {
    value: number;
    n: number;
    scriptPubKey: any;
    tokens: any[];
}

export interface ITransaction {
    size: number;
    txid: string;
    version: number;
    time: number;
    locktime: number;
    ntp1: boolean;
    vin: IVin[];
    vout: IVout[];
    metadataOfUtxos: {
        userData: {
            meta: any;
        }
    }
}

export interface IBlock {
    result: {
        hash: string;
        confirmations: number;
        size: number;
        height: number;
        version: number;
        merkleroot: string;
        mint: number;
        time: number;
        nonce: number;
        bits: string;
        difficulty: number;
        blocktrust: string;
        chaintrust: string;
        previousblockhash: string;
        nextblockhash: string;
        flags: string;
        proofhash: string;
        entropybit: number;
        modifier: string;
        modifierchecksum: string;
        tx: ITransaction[];
        signature: string;
    };

    error: string;
    id: string;
}

export interface IToken {
    owner: string;
    precision: string;
    symbol: string;
    metadata: unknown;
    supply: string;
    circulatingSupply: string;
}

export interface IInputToken {
    amount: string;
    issueTxid: string;
    tokenName: string;
}