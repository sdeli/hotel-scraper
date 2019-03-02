const config = require('config');
const rp = require('request-promise');

const HEADERS = config.headers.submitSearchReqHeaders,
    CATCHER_ERR_EVENT__TERM = config.errors.events[0];

module.exports = ((link, shouldResolveOnErr = false) => {
    let failedCallCount  = 0;

    return new Promise((resolve, reject) => {
        makeRequest(resolve, reject, link, shouldResolveOnErr);
    });
    
    function makeRequest(resolve, reject, link, shouldResolveOnErr) {
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
            if (shouldResolveOnErr) {
                resolve(false);
                process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            } else {
                reject(err);
            }
        });
    }
});