import seedrandom from 'seedrandom';

const MAX_PAYLOAD_SIZE = 2000;
const MAX_ACCOUNTS_CHECK = 999;

export const Utils = {

    // https://flaviocopes.com/javascript-sleep/
    sleep(milliseconds: number) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    },

    // Fisher Yates shuffle
    shuffle(array) {
        let currentIndex = array.length; 
        let temporaryValue; 
        let randomIndex;
      
        while (0 !== currentIndex) {
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
      
          temporaryValue = array[currentIndex];
          array[currentIndex] = array[randomIndex];
          array[randomIndex] = temporaryValue;
        }
      
        return array;
    },

    roundPrecision(value, precision) {
        const NUMBER_SIGN = value >= 0 ? 1 : -1;

        return parseFloat((Math.round((value * Math.pow(10, precision)) + (NUMBER_SIGN * 0.0001)) / Math.pow(10, precision)).toFixed(precision));
    },

    randomRange(min = 0, max = 2000) {
        return (!isNaN(min) && !isNaN(max) ? Math.floor(Math.random() * (max - min + 1)) + min : NaN); 
    },

    randomNumber(previousBlockId, blockId, transactionId) {
        const random = seedrandom(`${previousBlockId}${blockId}${transactionId}`).double();
        const randomRoll = Math.floor(random * 100) + 1;
        return randomRoll;
    },

    randomString(length = 12) {
        let str = '';
    
        const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const max = characters.length - 1;
    
        for (let i = 0; i < length; i++) {
            str += characters[Utils.randomRange(0, max)];
        }
    
        return str;
    },

    jsonParse(str: string) {
        let obj = null;

        try {
            obj = JSON.parse(str);
        } catch {
            // We don't do anything
        }

        return obj;
    },

    async asyncForEach(array: any[], callback: any) {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
        }
    },

};