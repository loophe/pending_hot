var axios = require('axios');
var tunnel = require('tunnel');
var { web3Ws } = require('./providerWs');

async function getTokenInfo( tokenAddr ) {
    let token_abi_ask = 'https://api.etherscan.io/api?module=contract&action=getabi&address='+tokenAddr+'&apikey=AKI6MKB4KHB37QZGKJ9F81JNTTYZE3ABY2'
    const agent = tunnel.httpsOverHttp({
        proxy: {
            host: 'localhost',
            port: 1081,
        },
      });
    var response = await axios.get( token_abi_ask ,{
        httpsAgent: agent,
    })

    if ( typeof(response) == 'object' )
    var token_abi = response.data.result;
    var m =  token_abi.substring(0,1)
    if ( m != 'M' && m != 'I' && m !='C' ){//escape JSON format error
      try{      

        var token_contract = new web3Ws.eth.Contract(JSON.parse(token_abi), tokenAddr);
        
        //get token info           
        if ( typeof(token_contract.methods.decimals) == 'function' )           
        var decimals = await token_contract.methods.decimals().call();
        if ( typeof(token_contract.methods.symbol) == 'function')
        var symbol =  await token_contract.methods.symbol().call(); 
        if ( typeof(token_contract.methods.name) == 'function')
        var name = await token_contract.methods.name().call() 

        return {'address': tokenAddr, 'name': name, 'symbol': symbol, 'decimals': decimals, 'abi': token_abi, 'token_contract': token_contract}
      
    }
      catch(e){
        console.log(e)
      } 
    } 
}

module.exports = {

    getTokenInfo

}
