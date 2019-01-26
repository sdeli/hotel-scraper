const config = require('config');
const fs = require('fs')

const taskQueue = require('widgets/task-queue');
// let extractCurrHotelPageLinksIntoCsvFile = require('./moduls/extract-curr-hotel-pg-links-into-csv/extract-curr-hotel-pg-links-into-csv.js')
let extractCurrHotelPageLinksIntoCsvFilePath = `${__dirname}/moduls/extract-curr-hotel-pg-links-into-csv/extract-curr-hotel-pg-links-into-csv.js`;

const PAGI_LINKS_FOLDER__PATH = config.pathes.paginationLinksFolder,
HOTEL_PAGE_LINKS_CLICKABLE__SEL = config.selectors.searchResPg.hoteSubPageClickable,
HOTEL_PAGE_LINKS_FOLDER__PATH = config.pathes.hotelSubPageLinks;
WEBSITES_BASE__URL = config.urls.searchHotelForm,

module.exports = extractHotelPagelinks

function extractHotelPagelinks(batchId) {
    let HotelSearchResPgLinksArr = getHotelSearchResPgLinksArr(batchId);
    
    
    let subProcessPath = extractCurrHotelPageLinksIntoCsvFilePath;
    var i = 0
    allExtractionPromisesArr = HotelSearchResPgLinksArr.map(link => {
        let hotelLinkExtractionParams = {
            HOTEL_PAGE_LINKS_CLICKABLE__SEL,
            WEBSITES_BASE__URL,
            HOTEL_PAGE_LINKS_FILE__PATH : `${HOTEL_PAGE_LINKS_FOLDER__PATH}/${batchId}`
        }

        hotelLinkExtractionParams.hotelSearchResPgLink = link;
        hotelLinkExtractionParams.num = i;
        i++;
        return runExtractionParallel(subProcessPath, taskQueuCb, hotelLinkExtractionParams)
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

function runExtractionParallel(subProcessPath, taskQueuCb, paramsForSubProc) {
    return new Promise((resolve, reject) => {
        let cbsParams = [resolve, reject];
        taskQueue.addTask(subProcessPath, taskQueuCb, [paramsForSubProc], cbsParams);
    });
}

function taskQueuCb(err, results, resolve, reject) {
    if (err) {
        console.log(err)
        reject(err);
    } else {
        resolve(results)
    }
}
