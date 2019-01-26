const fs = require('fs');
const {getFormattedDate, readCsvIntoArr} = require('widgets/scraper-utils');

let initiateHotelSearch = require('widgets/initiate-hotel-search');
let extractSearchResultPageLinks = require('widgets/extract-search-result-page-links');
let extractHotelPagelinks = require('widgets/extract-hotel-page-links');
let extractHotelInfos = require('widgets/extract-hotel-infos')
// let test = require('../../../test/test.js')

module.exports = scrapeController;

function scrapeController() {
    // const batchId = '2019-01-24_11-28-50';
    // readCsvIntoArr('2019-01-24_10-39-05');
    // test();
    const batchId = getFormattedDate();

    initiateHotelSearch()
    .then((firstSearchResPgsLink) => {
        console.log(firstSearchResPgsLink);
        return extractSearchResultPageLinks(batchId, firstSearchResPgsLink);
    })
    .then(() => {
        return extractHotelPagelinks(batchId)
    })
    .then(() => {
        return extractHotelInfos(batchId)
    })
    .then(() => {
        return extractHotelPageAndAvatarFromGoogle(batchId)
    })
    .catch(e => {
        console.log(e);
    });
};