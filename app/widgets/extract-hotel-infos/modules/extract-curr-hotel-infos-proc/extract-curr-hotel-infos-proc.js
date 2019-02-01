const cheerio = require('cheerio');
const uniqid = require('uniqid');

module.exports = ((params) => {    
    const {
        HOTEL_NAME__SEL,
        HOTEL_ADDR__SEL,
        COUNTRY
    } = params;

    return extractHotelInfos(params.hotelPgHtml, params.batchId)

    function extractHotelInfos(hotelPgHtml, batchId) {
        let hotelInfos = {};

        return new Promise((resolve) => {
            hotelInfos.hotelId = uniqid();
            let $ = cheerio.load(hotelPgHtml);

            hotelInfos.hotelName = $(HOTEL_NAME__SEL).text().replace(/\n/g, ' ').trim().normalize();
            hotelInfos.fullAddr =  $(HOTEL_ADDR__SEL).text().trim().normalize().replace('\n', '');
            hotelInfos.region =  hotelInfos.fullAddr.replace(/(.*,\s\d+\s)(.*)(,.*)/, '$2');
            hotelInfos.country = COUNTRY;
            hotelInfos.batchId = batchId;
            // console.log('log')
            resolve(hotelInfos);
        });
    }
});