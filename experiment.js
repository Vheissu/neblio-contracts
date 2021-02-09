const request = require('request');

async function walletRequest(method, params = []) {
  return new Promise((resolve, reject) => {
    let options = {
      url: "http://127.0.0.1:6326",
      method: "post",
      headers:
      { 
       "content-type": "text/plain"
      },
      auth: {
          user: 'user',
          pass: 'password'
      },
      body: JSON.stringify( {
        "jsonrpc": "1.0", 
        "id": "neblio-contracts", 
        "method":method, 
        "params": params
      })
    };
    
    request(options, (error, response, body) => {
      if (error) {
          reject(error);
      } else {
          resolve(JSON.parse(body));
      }
    });
  });
}

let lastBlockNum = 0;
const subscriptions = [];
const ntp1Subscriptions = [];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const stream = setInterval(async () => {
  const latestBlockHeight = await getBlockCount();

  if (latestBlockHeight) {
    lastBlockNum = latestBlockHeight;
  }
}, 1000);

async function getBlockCount() {
  const response = await walletRequest('getblockcount');

  if (response.result) {
    return response.result;
  }

  return null;
}

async function getBlock(blockNumber) {
  return walletRequest('getblockbynumber', [blockNumber, true]);
}

async function handleBlock(blockNum) {
  if (lastBlockNum >= blockNum) {
    const block = await getBlock(blockNum);

    if (block.result) {
      console.log(`New block height is ${blockNum} ${block.result.time}`);

      // Loop over all subscriptions and call the supplied callback, passing the block result in
      for (const sub of subscriptions) {
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
        // Call one or more ntp1 subscriptions, pass the block result as the first argument
        // and pass the array of ntp1 transactions as the second argument
        for (const sub of ntp1Subscriptions) {
          sub.callback(block.result, ntp1Transactions);
        }
      }

      handleBlock(blockNum + 1);
    } else {
      console.error(`Block does not exist`);
      handleBlock(blockNum);
    }
  } else {
    await sleep(500);
    handleBlock(blockNum);
  }
}

function addSubscription(callback) {
  subscriptions.push({ callback });
}

function addNtp1Subscription(callback) {
  ntp1Subscriptions.push({ callback });
}

async function streamNeblio(startingBlock = 0) {
  if (startingBlock === 0) {
    const latestBlockHeight = await getBlockCount();
    
    if (latestBlockHeight) {
      lastBlockNum = latestBlockHeight;
    }
  } else {
    lastBlockNum = startingBlock;
  }

  console.log(`Starting from block ${lastBlockNum}`);
  handleBlock(lastBlockNum);
}

addSubscription(block => {
  console.log(block);
});

streamNeblio();