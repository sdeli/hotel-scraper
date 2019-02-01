const config = require('config');
const shortenUrl = require('node-url-shortener');
const hotelsModel = require('models/hotels-model');
const GoogleScraperQueue = require('./modules/google-scrape-queue-class/google-scrape-queue.js');

const IS_HEADLESS = config.pupeteer.headless,
    HOTEL_WEBSITE_LINK__SEL = config.selectors.googleSearch.hotelWebsiteATAg,
    HOTEL_AVATAR_IMG__SEL = config.selectors.googleSearch.hotelAvatar,
    DELAY_MIN__MILI_SECS = config.extractHotelPageAndAvatarFromGoogle.minDelay,
    DELAY_MAX__MILI_SECS = config.extractHotelPageAndAvatarFromGoogle.maxDelay,
    PROXIES = config.extractHotelPageAndAvatarFromGoogle.proxies,
    CATCHER_ERR_EVENT__TERM = config.errors.events[0];

    
module.exports = ((batchId) => {
    let googleScraperQueue = GoogleScraperQueue({
        IS_HEADLESS,
        HOTEL_WEBSITE_LINK__SEL,
        HOTEL_AVATAR_IMG__SEL,
        PROXIES
    });
    
    return extractHotelWebsiteAndAvatarFromGoogle(batchId);

    async function extractHotelWebsiteAndAvatarFromGoogle(batchId) {
        try {
            var hotelsArr = await hotelsModel.getHotelNamesAndAdresses(batchId)
        } catch (err) {
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            console.log('emit shutdown');
        }
    
        let delay = {
            min : DELAY_MIN__MILI_SECS,
            max : DELAY_MAX__MILI_SECS
        }

        hotelsArr.forEach(hotelObj => {
            let {hotelId, hotelName, fullAddr} = hotelObj;
            keywords = [hotelName, fullAddr];
            googleScraperQueue.addTask(keywords, cb, [batchId, hotelId], delay);
        });
        
    }
    
    function cb(err, hotelInfosObj, batchId, hotelId) {
        let didEncounterCaptcha = err && err.msg === 'encountered captcha';
        if (didEncounterCaptcha) {
            let keywords = hotelInfosObj;
            googleScraperQueue.addTask(keywords, cb)
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            return;
        } else if (err) {
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            return;
        }
        
        saveHotelWebsiteAndAvatarIntoDb(hotelInfosObj, batchId, hotelId);
    }
    //18nt9wgjrdoh7dq
    function saveHotelWebsiteAndAvatarIntoDb(hotelInfosObj, batchId, hotelId) {
        hotelInfosObj.batchId = batchId;
        hotelInfosObj.hotelId = hotelId;
        
        shortUrlPromise(hotelInfosObj.avatarLink)
        .then(shortUrl => {
            hotelInfosObj.avatarShortLink = shortUrl;
            return hotelsModel.insertHotelWebsiteAndAvatar(hotelInfosObj)
        })
        .catch(err => {
            console.log(err);
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify({err, hotelInfosObj}, null, 2));
        })
    }
    
    function shortUrlPromise(longUrl) {
        return new Promise((resolve, reject) => {
            shortenUrl.short(longUrl, function(err, shortUrl){
                if (err) {
                    reject(err);
                    return;
                }
    
                resolve(shortUrl)
            });
        });
    }
});

/*
{"ip" : "23.80.149.164", "port" : "29842", "userName" : "sdeli", "pwd" : "Andy1234"},
            {"ip" : "23.106.252.24", "port" : "29842", "userName" : "sdeli", "pwd" : "Andy1234"},
            {"ip" : "23.80.149.140", "port" : "29842", "userName" : "sdeli", "pwd" : "Andy1234"}
*/

