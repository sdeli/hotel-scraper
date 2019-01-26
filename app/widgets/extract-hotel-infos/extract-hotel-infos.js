const config = require('config');
const taskQueue = require('widgets/task-queue');
const hotelsModel = require('models/hotels-model');
const {readCsvIntoArr, makeRequest} = require('widgets/scraper-utils');

// const extractCurrHotelsInfos = require('./modules/extract-curr-hotel-infos-proc/extract-curr-hotel-infos-proc.js');

const HOTEL_PAGE_LINKS_FOLDER__PATH = config.pathes.hotelSubPageLinks,
    EXTRACT_HOTEL_INFOS_PROCESS__PATH = __dirname + '/modules/extract-curr-hotel-infos-proc/extract-curr-hotel-infos-proc.js',
    HOTEL_NAME__SEL = config.selectors.hotelPage.hotelName,
    HOTEL_ADDR__SEL = config.selectors.hotelPage.hotelAddr;
    COUNTRY = config.general.searchedCountry;

module.exports = extractHotelInfos

async function extractHotelInfos(batchId) {
    let hotelPageLinksArr = getHotelPageLinks(batchId);
    
    for (let i = 0; i < hotelPageLinksArr.length; i += 10) {
        try {
            let currHotelPageLinksArr = hotelPageLinksArr.slice(i, i + 10);
            await extract10HotelPagesForInfos(currHotelPageLinksArr, i, batchId)
        } catch (err) {
            console.log('err handling');
            console.log(err);
        }
        console.log(`next ${i} - ${i + 10} =================`);
    }    
}

function extract10HotelPagesForInfos(hotelPageLinksArr, i, batchId) {
    let getHotelPgHtmlsPromisesArr = hotelPageLinksArr.map(hotelPageLink => {
        return makeRequest(hotelPageLink);
    });

    return new Promise((resolve, reject) => {
        Promise.all(getHotelPgHtmlsPromisesArr)
        .then(hotelPgHtmlsArr => {
            return getHotelInfosObjs(hotelPgHtmlsArr, batchId)
        })
        .then((hotelInfosArr) => {
            hotelsModel.hotelInfosFromBookingIntoDb(hotelInfosArr);
        })
        .then(() => {
            resolve();
        })
        .catch(err => {
            console.log('error handling');
            reject(err);
        });
    });
}

function extractAllHotelPagesBy10() {

}

function getHotelPageLinks(batchId) {
    let hotelPageLinksFilePath = `${HOTEL_PAGE_LINKS_FOLDER__PATH}/${batchId}`
    let hotelPageLinksArr = readCsvIntoArr(hotelPageLinksFilePath);

    return hotelPageLinksArr;
}

function getHotelInfosObjs(hotelPgHtmlsArr, batchId) {
    let getHotelInfosPromisesArr = hotelPgHtmlsArr.map(hotelPgHtml => {
        return getHotelInfosObj(hotelPgHtml, batchId);
    });

    return Promise.all(getHotelInfosPromisesArr)
}

function getHotelInfosObj(hotelPgHtml, batchId) {
    let subProcessPath = EXTRACT_HOTEL_INFOS_PROCESS__PATH;
    let extractionParams = {
        HOTEL_NAME__SEL,
        HOTEL_ADDR__SEL,
        COUNTRY,
        batchId,
        hotelPgHtml
    }

    return new Promise((resolve, reject) => {
        let cbParams = [resolve, reject];
        taskQueue.addTask(subProcessPath, resolveRejectCb, [extractionParams], cbParams);
    });
}

function resolveRejectCb(err, results, resolve, reject) {
    if (err) {
        console.log(err)
        reject(err);
    } else {
        resolve(results)
    }
}