import { IInputToken } from './../types';
import { Streamer } from './../streamer';
import seedrandom from 'seedrandom';
import BigNumber from 'bignumber.js';

/**
 * TEst payload
 * {
  "name": "nebldice",
  "action": "roll",
  "payload": {
    "amount": "1 DICE",
    "roll": "54"
  }
}
 */

const HOUSE_EDGE = 0.05;
const MIN_BET = 1;
const MAX_BET = 10;

const CONTRACT_NAME = 'nebliodice';
const CONTRACT_SYMBOL = 'DB';

// Random Number Generator
const rng = (txid) => {
    const random = seedrandom(`${txid}`).double();
    const randomRoll = Math.floor(random * 100) + 1;

    return randomRoll;
};

export class DiceContract {
    private $instance: Streamer;

    private block = null;

    private tableName = 'nebldice';
    private tokenName = null;

    private create() {
        // Runs every time register is called on this contract
        // Do setup logic and code in here (creating a database, etc)
    }

    private destroy() {
        // Runs every time unregister is run for this contract
        // Close database connections, write to a database with state, etc
    }

    private updateInputTokens(inputTokens: IInputToken[]) {
        this.tokenName = inputTokens[0].tokenName;
    }

    // Updates the contract with information about the current block
    // This is a method automatically called if it exists
    private updateBlockInfo(block) {
        this.block = block;
    }

    /**
     * Roll
     *
     * Automatically called when a custom JSON action matches the following method
     *
     * @param payload
     * @param param1 - sender and amount
     */
    private async roll(payload: { roll: number; amount: string; seed?: string; }) {
        // We are only concerned with the token symbol for our contract
        if (this.tokenName !== CONTRACT_SYMBOL) {
            return;
        }

        try {
            // Destructure the values from the payload
            let { roll, amount, seed } = payload;

            console.log(`Roll: ${roll} Amount: ${amount}`);

            // Get the transaction from the blockchain
            const transaction = await this.$instance.getTransaction(this.block.tx[0].txid);

            const amountSplit = amount.split(' ');
            amount = amountSplit[0];

            // Transfer is valid
            if (transaction) {
                // Bet amount is valid
                if (parseFloat(amount) >= MIN_BET && parseFloat(amount) <= MAX_BET) {
                    // Validate roll is valid
                    if ((roll >= 2 && roll <= 96)) {
                        let rngValue = this.block.hash.toString();

                        if (seed) {
                            rngValue += seed.toString();
                        }

                        // Roll a random value
                        const random = rng(rngValue);

                        // Calculate the multiplier percentage
                        const multiplier = new BigNumber(1).minus(HOUSE_EDGE).multipliedBy(100).dividedBy(roll);

                        // Calculate the number of tokens won
                        const tokensWon = new BigNumber(amount).multipliedBy(multiplier).toFixed(3, BigNumber.ROUND_DOWN);

                        // Memo that shows in users memo when they win
                        const winningMemo = `You won ${tokensWon}. Roll: ${random}, Your guess: ${roll} -- Server seed: ${this.block.hash} Client seed: ${seed}`;

                        // Memo that shows in users memo when they lose
                        const losingMemo = `You lost ${amount}. Roll: ${random}, Your guess: ${roll} -- Server seed: ${this.block.hash} Client seed: ${seed}`;

                        // If random value is less than roll
                        if (random < roll) {
                            // User won
                            console.log(winningMemo);
                        } else {
                            // User lost
                            console.log(losingMemo);
                        }
                    } else {
                        // Invalid bet parameters
                    }
                }
            }
        } catch (e) {
            throw e;
        }
    }
}