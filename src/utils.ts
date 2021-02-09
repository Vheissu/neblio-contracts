import seedrandom from 'seedrandom';
import request from 'request';

export const Utils = {
    sleep(milliseconds: number) {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    },

    walletRequest(method, params = []) {
        return new Promise((resolve, reject) => {
            const options = {
                url: 'http://127.0.0.1:6326',
                method: 'post',
                headers: {
                    'content-type': 'text/plain',
                },
                auth: {
                    user: 'user',
                    pass: 'password',
                },
                body: JSON.stringify({
                    jsonrpc: '1.0',
                    id: 'neblio-contracts',
                    method,
                    params,
                }),
            };

            request(options, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        });
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

        return parseFloat(
            (
                Math.round(value * Math.pow(10, precision) + NUMBER_SIGN * 0.0001) /
                Math.pow(10, precision)
            ).toFixed(precision),
        );
    },

    randomRange(min = 0, max = 2000) {
        return !isNaN(min) && !isNaN(max) ? Math.floor(Math.random() * (max - min + 1)) + min : NaN;
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
