import { GlobalWithFetchMock } from 'jest-fetch-mock';

// (global as any).console = {
//     log: jest.fn(), // console.log are ignored in tests

//     // Keep native behaviour for other methods, use those to print out things in your own tests, not `console.log`
//     error: console.error,
//     warn: console.warn,
//     info: console.info,
//     debug: console.debug,
// };

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;

global.fetch = require('jest-fetch-mock');
(global as any).fetchMock = global.fetch;;

process.on('unhandledRejection', (error) => {
  throw error; // Or whatever you like...
});