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

(async () => {
  const response = await walletRequest('getblockbynumber', [2699709, true]);

  for (const tx of response.result.tx) {
    if (tx.ntp1) {
      console.log(tx);
      const { metadataOfUtxos: { userData: { meta } } } = tx;
      console.log(meta);
    }
  }
  
  walletRequest('getblockcount');
})();

walletRequest('getblockcount');

// walletRequest('getblockbynumber', [2699640, true]);
// walletRequest('getblockbynumber', [2699641, true]);
// walletRequest('getblockbynumber', [2699642, true]);

// const Neblioapi = require('neblioapi');

// const defaultClient = Neblioapi.ApiClient.instance;
// const rpcAuth = defaultClient.authentications['rpcAuth'];

// rpcAuth.username = 'username';
// rpcAuth.password = 'password';

// let apiInstance = new Neblioapi.JSONRPCApi();
// let rpcRequest = new Neblioapi.RpcRequest('1.0', 'neblio-apis', 'getblockcount', []);

// apiInstance.jsonRpc(rpcRequest, (error, data, response) => {
//     if (error) {
//       console.error(error);
//     } else {
//       console.log('API called successfully. Returned data: ' + data);
//     }
//   });