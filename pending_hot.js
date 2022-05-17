var fs = require('fs')
var path = require('path')
var { BigNumber } = require('ethers')
var { web3Ws } = require('./providerWs');
var { getTokenInfo } = require('./tokenInfo')

var JaguarDb = require('./lib/jaguarDb').JaguarDb;
var options = {logging: true};
var db = new JaguarDb(options);
var subscription;


const GWEI = BigNumber.from(10).pow(9)
const gasPriceInGwei = GWEI.mul(1000)

var data = []
var tableInOne = []

let listenOnce = function () {

    console.log('Time :\n',new Date());
    
    let i = true;    
    subscription = web3Ws.eth.subscribe('pendingTransactions', function (error, result) {//scan mempool
        if (!error && i){
            console.log('Scubscribe succesfully!\nSubscription Id:',subscription.id)
            i = false;//Log only once.
        }
        if (error){
            console.log(error);
            console.log('Reconnection to Robot.')
            setTimeout( () => {
                //Re-instantiatiing web3 is needed in case the connection is droped.
                web3Ws = new Web3(new Web3.providers.WebsocketProvider(WEBSOCKET_PROVIDER_LINK));
                _listen()
            }, 5000)
        }
    })
    .on("data", async function (transactionHash) 
    {
        let transaction = await web3Ws.eth.getTransaction(transactionHash);
        if (transaction != null)
        {        
            const transactionGasPrice = parseInt(transaction.gasPrice)
            if (transactionGasPrice >= gasPriceInGwei)    
            { 
               
                data.push(transaction['to']) 
    
            }         
        }
    })
    // .on("error", () =>{
    //     console.log("Error occured, resubscribe...",JSON.stringify(error))
    //     subscription();
    // })
    return subscription;
}

const _listen = async () => {
    let tips = listenOnce();
    console.log('Conneted to Robot.')
    let n = 0
    // Web3 subscription times out at 60 secs. Close and reopen at 50 secs.
    if ( n <= 24 ){ // Max times 24
        setInterval( () => {
            tips.unsubscribe( (error, success) => {
                if(error) {
                    console.log('Failed to disconnect from Robot!')
                }
                if(success) {
                    console.log('Disconneted.')
                    const frequency = data.reduce(function (obj, item) {//Calculate frequence and generate new table
                        if (!obj[item]) {
                            obj[item] = 0
                        }
                        obj[item]++;
                    
                        return obj;
                    }, {})
    
                    let sortFrequencyAddr = Object.keys(frequency).sort( (a,b)=>{
                        return frequency[b]-frequency[a]//From big to small
                    })
                    
                       
                    var tables = []    
                    
                  
                    db.connect('./data', async function(err) {//Connect to local DB
    
                        if(err) {
                            console.log('Could not connect: ' + err);
                            return;
                        }
    
                        for ( let key in sortFrequencyAddr ) {
                            if ( key < 50 && frequency[sortFrequencyAddr[key]] > 1 ){ //Only update the most showup addresses of front 50 on board and show up fre need acceed 10 
                                var token_info = await getTokenInfo(sortFrequencyAddr[key])
                                if ( typeof(token_info) != 'undefined' && typeof(token_info.name) != 'undefined' && typeof(token_info.symbol) != 'undefined' ){
                                    var query = {content: sortFrequencyAddr[key]}
                                    db.find(query, {}, function(err, documents) {//Check data
                                        if (err) {
                                            console.log('ERROR: ' + err);
                                            return err;
                                        }                        
                                        if ( documents.length == 0 ) {// New address found.
                                            var data = { title: 'Token contract '+token_info.name+'('+token_info.symbol+')', content: sortFrequencyAddr[key] };
                                            db.insert(data, function(err, insertedData) {
                                                if(err) {
                                                    console.log('ERROR: ' + err);
                                                    return;
                                                }                               
                                            })
                                        }
                                        if ( documents.length > 0 && documents[0].title == 'Check it!' ) {
                                            updatedData = documents[0]
                                            updatedData.title = 'Token contract '+token_info.name+'('+token_info.symbol+')'
                                            db.update(updatedData,function(err,){
                                                
                                                if(err) {
                                                    console.log('ERROR: ' + err);
                                                    return;
                                                    }
                                            })
                                        }                                                                    
                                    })                                      
                                }                
                            }                       
                        }       
                 
                                          

                        for ( let key in sortFrequencyAddr) { 
                            if ( key < 5 ){ //The number of items to show 
                                var query = {content: sortFrequencyAddr[key]};
                                var tag
                                if ( frequency[sortFrequencyAddr[key]] > 2 ){//Show up frequency
                                    var tagFunction = db.find(query,{},function(e,dc){})        //Check        
                                    if (tagFunction.length == 0) tag = "Check it!"
                                    if (tagFunction.length > 0) tag = tagFunction[0].title
                                }                
                                if ( frequency[sortFrequencyAddr[key]] <= 2) tag = "Check it!"// Do not show up frequency                 
                                
                                var table = { 
                                    "fre": frequency[sortFrequencyAddr[key]], 
                                    "address": sortFrequencyAddr[key],
                                    "tag": tag
                                }  

                                tables.push(table)                              
                            }                                              
                        }  
                        console.log(tables)     
                        if ( tables.length !== 0 ){  
                            
                            tableInOne.push( {"time": new Date(), "id": n , tables })                         
                            var content  = JSON.stringify(tableInOne)                           
                                fs.writeFile(path.join(__dirname, `tables/table.json`), content, err => {
                                if (err) {
                                console.error(err)
                                return
                                }
                                //file written successfully
                            })
                        }                                 
                    })           
                }                
            });

            tips = listenOnce();
            n++;
        }, (1800 * 1000));// Every half hour
    }else{
        process.exit()   
    }   
}

_listen()
