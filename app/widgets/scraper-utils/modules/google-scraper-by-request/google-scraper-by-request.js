do15requests();

async function do15requests() {
    for (let i = 0; i < 15; i++) {
        try {
            await delaySearch(i)
        } catch (e) {
            console.log(e);
        }
    }
}

function delaySearch(i) {
    let delay = Math.floor(Math.random() * (4000-1000) + 1000);
    console.log(delay);
    
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            makeRequest('https://www.google.com/search?q=query+goes+here+and+what', 0, i)
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                reject(err);
            })
        }, delay);
    });  
}

function makeRequest(link, i = 0, y) {
    var options = {
        uri: link,
        headers : HEADERS,
        gzip : true
    };

    return new Promise((resolve, reject) => {
        requestIpAndPort()
        .then(ipObj => {
            options.proxy = `http://${ipObj.userName}:${ipObj.pwd}@${ipObj.ip}:${ipObj.port}`;
            return rp(options)
        })
        .then(response => {
            let $ = cheerio.load(response);

            let isGoogleSearchResultsPg = $(GOOGLE_SEARCH_INPUT__SEL).length > 0;
            if (isGoogleSearchResultsPg) {
                logger(`./log/${y}.html`, response);
            } else {
                logger(`./log/${y}-rejected.html`, response);
            }
            
            resolve(response)
        })
        .catch(err => {
            logger(`./log/${y}-rejected.html`, JSON.stringify(err, null, 2));
            // doRequestAgainOnErr(err, reject, link, i);
        });
    });  
}

function requestIpAndPort() {
    return new Promise((resolve, reject) => {
        rp(`${LOCALHOST_URL}:${IP_FEEDERS_PORT}/${REQUEST_IP_AND_PORT__URL_PATH}`)
        .then(ipAndPortJson => {
            let ipAndPort = JSON.parse(ipAndPortJson);
            resolve(ipAndPort)
        })
        .catch(err => {
            reject(err);
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