const config = require('config');
const fetch = require('node-fetch');
var reqCount = 0;
const HEADERS = config.headers.submitSearchReqHeaders;

module.exports = ((link) => {
    let failedCallCount  = 0;

    return new Promise((resolve, reject) => {
        nodeFetch(resolve, reject, link);
    });
    
    function nodeFetch(resolve, reject, link) {
        reqCount++
        var options = {
            compress: true,
        };
        
        fetch(link)
        .then(res => res.text())
        .then(response => {
            resolve(response)
        })
        .catch(err => {
            console.log('reqcount: ' + reqCount);
            process.stdout.write('request agian: ' + link)
            doRequestAgainOnErr(err, resolve, reject, link);
        });
    }
    
    function doRequestAgainOnErr(err, resolve, reject, link) {
        let hasBeenCalledAgain3times = failedCallCount >=4;
        if (hasBeenCalledAgain3times) {
            reject(err)
        } else {
            failedCallCount++;
            nodeFetch(resolve, reject, link)
        } 
    }
});