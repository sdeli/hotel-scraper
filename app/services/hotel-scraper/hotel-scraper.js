const config = require('config');
const path = require('path');
const {getFormattedDate, readCsvIntoArr, logger} = require('widgets/scraper-utils');

let initiateHotelSearch = require('widgets/initiate-hotel-search');
let extractSearchResultPageLinks = require('widgets/extract-search-result-page-links');
let extractHotelPagelinks = require('widgets/extract-hotel-page-links');
let extractHotelInfos = require('widgets/extract-hotel-infos');
let extractHotelPageAndAvatarFromGoogle = require('widgets/extract-hotel-pages-and-avatars-from-google');
let extractEmailsFromHotelsWebsites = require('widgets/extract-emails-from-hotels-webistes');

const CATCHER_ERR_EVENT__TERM = config.general.catchedErrEventsName;
const ERR_LOG_FILE__PATH = path.join(process.cwd(), config.pathes.errorLog);

module.exports = scrapeController;

function scrapeController() {
    // const batchId = '2019-01-24_11-28-50';
    // readCsvIntoArr('2019-01-24_10-39-05');
    // test();
    extractEmailsFromHotelsWebsites('2019-01-31_12-05-47');
    // const batchId = getFormattedDate();
    // initiateHotelSearch()
    // .then((firstSearchResPgsLink) => {
    //     return extractSearchResultPageLinks(batchId, firstSearchResPgsLink);
    // })
    // .then(() => {
    //     return extractHotelPagelinks(batchId);
    // })
    // .then(() => {
    //     return extractHotelInfos(batchId);
    // })
    // .then(() => {
    //     return extractHotelPageAndAvatarFromGoogle(batchId);
    // })
    // .then(() => {
    //     extractEmailsFromHotelsWebsites('123');    
    // })
    // .catch(e => {
    //     console.log(e);
    // });

    process.on(CATCHER_ERR_EVENT__TERM, (errStr) => {
        let errLogFilePath = `${ERR_LOG_FILE__PATH}/${'2019-01-31_12-05-47'}`;
        console.log(errStr);
        logger(errLogFilePath, errStr);
    });
};