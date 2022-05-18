var express = require('express');
const fs = require('fs');
var path = require('path')

var app = express();

app.get('/', function(req, res){
  
    var i;
    var n;
    var html = "";

   

    fs.readFile(path.join(__dirname, 'tables',`table.json`), (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        const dataJ = JSON.parse(data);
        
        html += '<p><br/>' + 
        '<p>The most HOT to address on Etheruem every hour</p><br/>' +
        '<p>Enjoin it!!<p/>'
        '</p>';

        for (  n in dataJ ){

            var obj = dataJ[dataJ.length-n-1]
            console.log(obj);
            html += '<p><br/>' + 
            '<p>Time : ' + obj.time + '</p>' +
            '<p>id : ' + obj.id + '</p><br/>' +
            '</p>';

        
            var table = obj.tables
            for ( i = 0; i < table.length; i++ ){
                var address = table[i].address
                var tag = `<a href=https://etherscan.io/address/${address}>` + table[i].tag +"</a>"
                html += '<p>' + 
                // '<p>Time: ' + dataJ[dataJ.length-2].time + '</p><br/>' +
                // '<p>id: ' + dataJ[dataJ.length-1].id + '</p><br/>' +
                '<p>Frequency : \t' + table[i].fre + '</p>' +
                '<p>Address : \t' + address + '</p>' +
                '<p>Tag : \t' + tag + '</p>' +
                // '<b>title:</b> ' + url + '<br/>' +  
                '</p>';
            }
        }               

        res.send(html);
    });
     
});


console.log("Server started http://localhost:4500");
app.listen(4500);