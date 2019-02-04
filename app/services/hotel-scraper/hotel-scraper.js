const path = require('path');
const fs = require('fs');

const config = require('config');

let initiateHotelSearch = require('widgets/initiate-hotel-search');
let extractSearchResultPageLinks = require('widgets/extract-search-result-page-links');
let extractHotelPagelinks = require('widgets/extract-hotel-page-links');
let extractHotelInfos = require('widgets/extract-hotel-infos');
let extractHotelWebsiteAndAvatarFromGoogle = require('widgets/extract-hotel-pages-and-avatars-from-google');
let extractEmailsFromHotelsWebsites = require('widgets/extract-emails-from-hotels-webistes');
let SendMail = require('widgets/send-mail-class');
let sendMail = new SendMail();

const {getFormattedDate, createFolder, logger} = require('widgets/scraper-utils');

const CATCHER_ERR_EVENT__TERM = config.general.catchedErrEventsName,
    ERR_LOG_FILE__PATH = path.join(process.cwd(), config.pathes.errorLog);

module.exports = scrapeController;

function scrapeController() {
    let batchId = getFormattedDate();
    let generalErrCount = 0;

    initiateHotelSearch()
    .then((firstSearchResPgsLink) => {
        return extractSearchResultPageLinks(batchId, firstSearchResPgsLink);
    })
    .then(() => {
        return extractHotelPagelinks(batchId);
    })
    .then(() => {
        return extractHotelInfos(batchId);
    })
    .then(() => {
        return extractHotelWebsiteAndAvatarFromGoogle(batchId);
    })
    .then(err => {
        console.log(err);
        return extractEmailsFromHotelsWebsites(batchId);    
    })
    .then(async () => {
        await sendMail.result();
        process.kill(process.pid, 'SIGHUP');
    })
    .catch(async err => {
        console.log(err);
        process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
        await sendMail.err(err, generalErrCount);
    })

    process.on(CATCHER_ERR_EVENT__TERM, (errStr) => {
        generalErrCount++
        console.log(errStr);
        logGenerealErr(errStr, batchId)
    });
};

async function logGenerealErr(errStr, batchId) {
    let generalErrLogFolderPath = `${ERR_LOG_FILE__PATH}/general-err`;

    try {
        if (!fs.existsSync(generalErrLogFolderPath)) await createFolder(generalErrLogFolderPath);
    } catch (err) {
        console.log(err);
    }

    let generalErrLogFilePath = `${generalErrLogFolderPath}/${batchId}`;

    logger(generalErrLogFilePath, errStr);
}