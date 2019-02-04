const EventEmitter = require('events');
const uniqid = require('uniqid');
const googleScraper = require('../google-scraper-class/google-scraper-class.js');

module.exports = ((config) => {
    const {
        IS_HEADLESS,
        HOTEL_WEBSITE_LINK__SEL,
        HOTEL_AVATAR_IMG__SEL,
        PROXIES
    } = config;
    
    let GoogleScraper = googleScraper({
        IS_HEADLESS,
        HOTEL_WEBSITE_LINK__SEL,
        HOTEL_AVATAR_IMG__SEL,
    })
    
    class GoogleScraperQueue {
        async init() {
            this.maxScraperCount = PROXIES.length;
            this.obeserver = new EventEmitter();
            this.tasks = [];
            this.callBacks = [];
            this.freeGoogleScrapers = [];

            this.obeserver.on('execute-task', () => {
                let arefreeGoogleScrapersToRunTask = this.freeGoogleScrapers.length > 0;
                let areDueTasks = this.tasks.length > 0;
                if (arefreeGoogleScrapersToRunTask && areDueTasks) {
                    this.execute();
                }

                let finishedAllExecution = this.callBacks.length > 0;
                finishedAllExecution &= this.freeGoogleScrapers.length === this.maxScraperCount;
                if (finishedAllExecution) {
                    this.shutDownBrowsers();
                }
            })
    
            await this.initGoogleScrapers();
        }
        
        addTask(keywords, cb, cbParamsArr = [], delay) {
            let taskId = uniqid();
            this.tasks.push({taskId, keywords, cb, cbParamsArr, delay});
            this.obeserver.emit('execute-task');
        }
        
        async execute() {
            let {taskId, keywords, cb, cbParamsArr, delay} = this.tasks.shift();
            this.callBacks.push({taskId, cb, cbParamsArr})
            let googleScraper = this.freeGoogleScrapers.shift();
            
            try {
                var hotelInfosObj = await googleScraper.getHotelWebsiteAndAvatar(...keywords, delay)
                var didEncounterCaptcha = hotelInfosObj === false;
            } catch (err) {
                this.runCurrTasksCb(err, taskId, false);
                this.freeGoogleScrapers.push(googleScraper);
                this.obeserver.emit('execute-task');
                return;
            }
            
            this.freeGoogleScrapers.push(googleScraper);
            this.obeserver.emit('execute-task');

            if (!didEncounterCaptcha) {
                this.runCurrTasksCb(false, taskId, hotelInfosObj);
            } else {
                let err = new Error('encountered captcha');
                this.runCurrTasksCb(err, taskId, keywords);
            }
        
        }
        
        async initGoogleScrapers() {
            for (let i = 0; i < this.maxScraperCount; i++) {
                let googleScraper = new GoogleScraper(PROXIES[i]);
                await googleScraper.init();
                this.freeGoogleScrapers.push(googleScraper);  
            }
        }
        
        runCurrTasksCb(err, taskId, hotelInfosObj) {
            let cbOfCurrFnObj = getCbOfCurrTask(this.callBacks, taskId)
            // console.log('err handling what if no taskId');
            let {cbParamsArr} = cbOfCurrFnObj;
            cbOfCurrFnObj.cb(err, hotelInfosObj, ...cbParamsArr);
        }

        async shutDownBrowsers() {
            let scrapersCount = this.freeGoogleScrapers.length;

            for (let i = 0; i < scrapersCount; i++) {
                await this.freeGoogleScrapers[i].close();
            }
        }
    }
    
    function getCbOfCurrTask(callbacks, currTaskId) {
        let cbOfCurrFnObj = callbacks.find(cbObj => {
            isthisCbTheRequestedCb = cbObj.taskId === currTaskId;
            
            return isthisCbTheRequestedCb;
        })
        
        return cbOfCurrFnObj;
    }

    return new GoogleScraperQueue();
});

