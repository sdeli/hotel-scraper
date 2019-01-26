const config = require('config');
const rp = require('request-promise');

const HEADERS = config.general.submitSearchReqHeaders;

module.exports = makeRequest

function makeRequest(link, i = 0) {
    var options = {
        uri: link,
        headers : HEADERS,
        gzip : true
    };

    return new Promise((resolve, reject) => {
        rp(options)
        .then(response => {
            resolve(response)
        })
        .catch(err => {
            doRequestAgainOnErr(err, reject, link, i);
        });
    });  
}

function doRequestAgainOnErr(err, reject, link, i) {
    let hasBeenCalledAgain3times = i >=4;
    if (hasBeenCalledAgain3times) {
        reject(err)
    } else {
        i++;
        makeRequest(link, i)
    } 
}