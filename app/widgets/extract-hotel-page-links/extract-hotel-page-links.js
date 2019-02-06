const config = require('config');
const fs = require('fs')

const TaskQueue = require('widgets/task-queue');
const taskQueue = new TaskQueue();

let extractCurrHotelPageLinksIntoCsvFilePath = `${__dirname}/moduls/extract-curr-hotel-pg-links-into-csv/extract-curr-hotel-pg-links-into-csv.js`;

const PAGI_LINKS_FOLDER__PATH = config.pathes.paginationLinksFolder,
HOTEL_PAGE_LINKS_CLICKABLE__SEL = config.selectors.searchResPg.hoteSubPageClickable,
HOTEL_PAGE_LINKS_FOLDER__PATH = config.pathes.hotelSubPageLinks;
WEBSITES_BASE__URL = config.urls.searchHotelForm,

module.exports = extractHotelPagelinks

function extractHotelPagelinks(batchId) {
    let HotelSearchResPgLinksArr = getHotelSearchResPgLinksArr(batchId);
    
    let subProcessPath = extractCurrHotelPageLinksIntoCsvFilePath;

    allExtractionPromisesArr = HotelSearchResPgLinksArr.map((link, i) => {
        let hotelLinkExtractionParams = {
            HOTEL_PAGE_LINKS_CLICKABLE__SEL,
            WEBSITES_BASE__URL,
            HOTEL_PAGE_LINKS_FILE__PATH : `${HOTEL_PAGE_LINKS_FOLDER__PATH}/${batchId}`
        }

        hotelLinkExtractionParams.hotelSearchResPgLink = link;
        
        return runExtractionParallel(subProcessPath, taskQueuCb, hotelLinkExtractionParams, i)
    });
    
    return Promise.all(allExtractionPromisesArr);
}

function getHotelSearchResPgLinksArr(batchId) {
    hotelSearchResPgLinksFilePath = `${PAGI_LINKS_FOLDER__PATH}/${batchId}`;
    let linksInStr = fs.readFileSync(hotelSearchResPgLinksFilePath, 'utf-8');
    let linksArr = linksInStr.split("\n");
    linksArr.pop() // last item is always an emtyp "\n"
    return linksArr;
}

function runExtractionParallel(subProcessPath, taskQueuCb, paramsForSubProc, i) {
    return new Promise((resolve, reject) => {
        let cbsParams = [resolve, reject, i];
        taskQueue.addTask(subProcessPath, taskQueuCb, [paramsForSubProc], cbsParams);
    })
    .catch(err => {
        process.emit(CATCHER_ERR_EVENT__TERM, JSON.stringify(err, null, 2));
    });
}

function taskQueuCb(err, results, resolve, reject, i) {
    if (err) {
        console.log(err)
        reject(err);
    } else {
        console.log('resolved: ' + i);
        resolve(results)
    }
}
