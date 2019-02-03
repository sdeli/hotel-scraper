const path = require('path');
const config = require('config');

const hotelsModel = require('models/hotels-model');
const PromiseTaskQueue = require('./modules/promise-task-queue-class/promise-task-queue-class.js');
const promiseTaskQueue = new PromiseTaskQueue();

const EmailExtractor = require('./modules/extract-emails-from-website-class/extract-emails-from-website-class.js');
const {logger} = require('widgets/scraper-utils');
// let extractor = require('./modules/extract-emails-proc/extract-emails-proc.js');
//http://helvetia.ischgl.at/
//https://www.urban-stay.at/de/content/kontaktieren-sie-uns
const MAX_PAGE_EXTRACTION_COUNT = config.emailScraper.maxPageEstraction,
CATCHER_ERR_EVENT__TERM = config.general.catchedErrEventsName;

module.exports = ((batchId) => {
    return extractEmailsFromHotelsWebsites();
    
    async function extractEmailsFromHotelsWebsites() {
        try {
            var hotelWebsites = await hotelsModel.getWebsitesByBatchId('2019-01-31_12-05-47');
        } catch (error) {
            console.log('shutdown event');
        }
        let websiteUrl = 'https://www.urban-stay.at/de/content/kontaktieren-sie-uns';
        let websiteId = 1;
        let i = 1;
        runExtractionParallel(websiteId, websiteUrl, i)
        // hotelWebsites.forEach(({websiteId, websiteUrl}, i) => {    
        //     runExtractionParallel(websiteId, websiteUrl, i)
        // });
    }
    
    function runExtractionParallel(webisteId, websiteUrl, fnId) {
        let extractEmailsParams = {
            MAX_PAGE_EXTRACTION_COUNT,
            websiteUrl,
            fnId
        }
        
        let cbsParams = [webisteId, websiteUrl];
        promiseTaskQueue.addPromiseTask(extractEmailsProm, extractEmailsCb, [extractEmailsParams], cbsParams);
    }

    function extractEmailsProm(params) {
        const emailExtractor = EmailExtractor(params);
    
        return new Promise((resolve) => {
            emailExtractor.on('extraction-finished', (emails) => {
                resolve(emails);
            });
        });
    }
    
    function extractEmailsCb(err, emails, websiteId, websiteUrl) {
        if (err) {
            console.log(err);
            process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
            return;
        }
        
        console.log(`emails for: ${websiteUrl}`);
        console.log(emails);
        let hasFoundEmals = emails.length > 0;
        if (hasFoundEmals) {
            insertEmailsIntoDb(emails, websiteId)
        } else {
            console.log(`/////////\nno email found for:\n${websiteUrl}`);
            loggeWebsiteWithNoEmail(websiteId, websiteUrl)
        }
    }
    
    function insertEmailsIntoDb(emails, websiteId) {
        hotelsModel.insertEmails(emails, websiteId, batchId, (err, results) => {
            if (err) {
                process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
                return
            }
        });
    }
    
    function loggeWebsiteWithNoEmail(websiteId, websiteUrl) {
        let filePath = path.join(process.cwd(), `./log/no-email-websites/${batchId}`)
        let content = `\nid: ${websiteId}\nurl: ${websiteUrl}\n`;
        logger(filePath, content)
    }
});