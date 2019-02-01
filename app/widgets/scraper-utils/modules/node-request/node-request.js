const url = require('url');
const https = require('https');
const http = require('http');
const config = require('config');
const headers = config.headers.nodeRequest
const protocols = {http, https};
const isGzip = require('is-gzip');
const {gzip, ungzip} = require('node-gzip');

module.exports = ((link) => {
    let failedCallCount = 0;
    const protocol = protocols[url.parse(link).protocol.replace(':', '')];

    return nodeRequest(link, protocol);
    
    function nodeRequest(link) {
        var options = {
            method : 'GET',
            headers
        };

        return new Promise((resolve, reject) => {
            protocol.get(link, options, function(res) {
                res.setEncoding('utf8');
        
                let rawData = '';
        
                res.on('data', (chunk) => { 
                    rawData += chunk; 
                });
        
                res.on('end', () => {
                    if (isGzip(rawData)) {
                        let data = ungzip(rawData);
                        resolve(data);
                    } else {
                        resolve(rawData)
                    }
                });
            })
            .on('error', (err) => {
                process.stderr.write(err.message);
                doRequestAgainOnErr(err, resolve, reject, link)
            });
        });
    }

    function doRequestAgainOnErr(err, resolve, reject, link) {
        let hasBeenCalledAgain3times = failedCallCount >=4;
        if (hasBeenCalledAgain3times) {
            reject(err)
        } else {
            failedCallCount++;
            nodeRequest(resolve, reject, link)
        } 
    }
});