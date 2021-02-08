const Neblioapi = require('neblioapi');

const defaultClient = Neblioapi.ApiClient.instance;
const rpcAuth = defaultClient.authentications['rpcAuth'];

rpcAuth.username = 'username';
rpcAuth.password = 'password';

let apiInstance = new Neblioapi.JSONRPCApi();
let rpcRequest = new Neblioapi.RpcRequest('1.0', 'neblio-apis', 'getblockcount', []);

apiInstance.jsonRpc(rpcRequest, (error, data, response) => {
    if (error) {
      console.error(error);
    } else {
      console.log('API called successfully. Returned data: ' + data);
    }
  });