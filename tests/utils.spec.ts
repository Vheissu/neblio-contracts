import { Utils } from './../src/utils';

describe('Utils', () => {

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    describe('Round Precision', () => {
        test('Properly rounds precision of number to 3 places', () => {
            const value = 99.299223;
    
            expect(Utils.roundPrecision(value, 3)).toStrictEqual(99.299);
        });
    
        test('Properly rounds precision of number up and to 3 places', () => {
            const value = 99.2966;
    
            expect(Utils.roundPrecision(value, 3)).toStrictEqual(99.297);
        });
    
        test('Invalid numeric values passed', () => {
            expect(Utils.roundPrecision('dasd', 3)).toBeNaN();
        });
    });

    test('Should generate two deterministic numbers', () => {
        // Should generate a deterministic random number
        expect(Utils.randomNumber('dasdasdas', '2312fsdfsdfsdf', 'kfjlksdjflksdjf999')).toStrictEqual(26);

        expect(Utils.randomNumber('fdfsdfsdfsdfsf', '2312fsdfsdfsdf', 'kfjlksdjflksdjf999')).toStrictEqual(43);
    });

    test('Should shuffle array in a non-deterministic way', () => {
        const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        const arrayCloned = [...array];
        
        Utils.shuffle(array);

        expect(array).not.toMatchObject(arrayCloned);
    });

    describe('Generate String', () => {
        test('Generates a memo 6 characters in length', () => {
            expect(Utils.randomString(6)).toHaveLength(6);
        });
    
        test('Generates a memo using default 12 character length', () => {
            expect(Utils.randomString()).toHaveLength(12);
        });
    });

    describe('Random Range', () => {
        test('Should generate a random number between 0 and 10', () => {
            expect(Utils.randomRange(0, 10)).toBeLessThanOrEqual(10);
        });

        test('Should generate the number 10', () => {
            expect(Utils.randomRange(10, 10)).toStrictEqual(10);
        });

        test('Only pass min and not max', () => {
            expect(Utils.randomRange(0)).toBeLessThanOrEqual(2000);
        });

        test('Pass non numeric values to random range', () => {
            expect(Utils.randomRange('dd' as any, 'asjj' as any)).toBeNaN();
        });
    });

});