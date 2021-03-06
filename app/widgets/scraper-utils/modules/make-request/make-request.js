const config = require('config');
const rp = require('request-promise');
var reqCount = 0;
const HEADERS = config.headers.submitSearchReqHeaders;

module.exports = ((link) => {
    let failedCallCount  = 0;

    return new Promise((resolve, reject) => {
        makeRequest(resolve, reject, link);
    });
    
    function makeRequest(resolve, reject, link) {
        reqCount++
        var options = {
            uri: link,
            headers : HEADERS,
            gzip : true
        };
        
        rp(options)
        .then(response => {
            resolve(response)
        })
        .catch(err => {
            reject(err)
        });
    }
    
    function doRequestAgainOnErr(err, resolve, reject, link) {
        let hasBeenCalledAgain3times = failedCallCount >=4;
        if (hasBeenCalledAgain3times) {
            reject(err)
        } else {
            failedCallCount++;
            makeRequest(resolve, reject, link)
        } 
    }
});