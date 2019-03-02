const config = require('config');
const dbPool = require('widgets/db-pool');

const FULL_ADDR_LENGTHL = config.hotelsModel.fullAddrLength,
    HOTEL_NAME_LENGTH = config.hotelsModel.regionLength,
    REGION_LENGTH = config.hotelsModel.hotelNameLength

const hotelsModel = (() => {
    
    function hotelInfosFromBookingIntoDb(hotelInfosArr) {
        // let sql = 'set autocommit = 0;\nSTART TRANSACTION;\n';
        let sql = '';
        
        hotelInfosArr.forEach((hotelInfosObj) => {
            sql += getHotelInfosFromBookingSql(hotelInfosObj);
            sql += '\n'
            return sql;
        });
        
        // sql += 'COMMIT;\nset autocommit = 1;';

        return new Promise((resolve, reject) => {
            dbPool.queryCb(sql, (err, results, fields) => {
                try {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    logDuplicateHotels(results)
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    function getHotelInfosFromBookingSql(hotelInfosObj) {
        let isdataLongerThenExpected = hotelInfosObj.fullAddr.length > FULL_ADDR_LENGTHL;
            isdataLongerThenExpected &= hotelInfosObj.hotelName.length > HOTEL_NAME_LENGTH;
            isdataLongerThenExpected &= hotelInfosObj.region.length > REGION_LENGTH;
        if (isdataLongerThenExpected) {
            process.emit(CATCHER_ERR_EVENT__TERM, `datalonger then expected: ${JSON.stringify(err, null, 2)}`);
            return '';
        }

        let hotelId = dbPool.escape(hotelInfosObj.hotelId);
        let hotelName = dbPool.escape(hotelInfosObj.hotelName);
        let country = dbPool.escape(hotelInfosObj.country);
        let region = dbPool.escape(hotelInfosObj.region);
        let fullAddr = dbPool.escape(hotelInfosObj.fullAddr);
        let batchId = dbPool.escape(hotelInfosObj.batchId);
        console.log('hotelName: ' + hotelName + ', '+ region);
        let sql = `call insertHotelInfos(${hotelId}, ${hotelName}, ${country}, ${region}, ${fullAddr}, ${batchId});`

        return sql;
    }

    function logDuplicateHotels(results) {
        let failedHotelsStr = '';

        results.forEach(result => {
            if (!Array.isArray(result)) return;
            
            let currDuplicateHotel = result[0];
            failedHotelsStr += JSON.stringify(currDuplicateHotel);
            failedHotelsStr += '\n=========================\n\n';
        })

        
        console.log(failedHotelsStr);
        return failedHotelsStr;
    }

    function insertHotelWebsite(hotelInfosObj) {
        let hotelId = dbPool.escape(hotelInfosObj.hotelId);
        let websiteUrl = dbPool.escape(hotelInfosObj.websiteUrl);
        let batchId = dbPool.escape(hotelInfosObj.batchId);
        
        sql = ''
        + `insert into hotel_webistes (website_url, batch_id)\n`
        + `values (${websiteUrl}, ${batchId});\n`
        
        + `insert into websites_of_hotels (hotel_id, website_id) values (${hotelId}, LAST_INSERT_ID());\n`;
        
        return dbPool.queryProm(sql);
    }

    function insertHotelWebsite1() {
        sql = ''
        + "call insertHotelInfos('fahqcb6ckjsrznuba', 'MOXY Vienna Airport', 'Austria', 'Schwechat', 'Ausfahrtsstraße 4, 1300 Schwechat, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznurl', 'OEKOTEL Korneuburg', 'Austria', 'Bisamberg', 'Kaiserallee 31, 2102 Bisamberg, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznv1c', 'Gasthof Zur Lok', 'Austria', 'Neusiedl am See', 'Bundesschulstraße 2, 7100 Neusiedl am See, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznv7k', 'SPA Resort Therme Geinberg', 'Austria', 'Geinberg', 'Thermenallee 1, 4943 Geinberg, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznvgv', 'Johannahof Appartements', 'Austria', 'Kaprun', 'Rosbachstraße 15, 5710 Kaprun, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznvq7', 'Rogner Bad Blumau', 'Austria', 'Bad Blumau', 'Bad Blumau 100, 8283 Bad Blumau, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznvyl', 'Chalet Garni Hotel Zimmermann', 'Austria', 'Reith bei Kitzbühel', 'Griesbachweg 48, 6370 Reith bei Kitzbühel, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznw6z', 'Arion Airport Hotel', 'Austria', 'Schwechat', 'Mühlgasse 30, 2320 Schwechat, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznwfn', 'Falkensteiner Hotel & Spa Carinzia', 'Austria', 'Tröpolach', 'Tröpolach 156, 9631 Tröpolach, Austria', '2019-03-02_19-50-20');\n"
        + "call insertHotelInfos('fahqcb6ckjsrznwmx', 'St. Martins Therme & Lodge', 'Austria', 'Frauenkirchen', 'Im Seewinkel 1, 7132 Frauenkirchen, Austria', '2019-03-02_19-50-20');";


        return dbPool.queryProm(sql);
    };
    
    insertHotelWebsite1();

    function getHotelNamesAndAdresses(batchId) {
        batchId = dbPool.escape(batchId);
        
        sql = ''
        + `select\n`
        + `hotels.hotel_id as hotelId,\n` 
        + `hotels.hotel_name as hotelName,\n`
        + `hotel_addr.full_addr as fullAddr\n`
        + `from hotels inner join hotel_addr\n`
        + `on hotels.batch_id = ${batchId}\n` 
        + `and hotels.hotel_id = hotel_addr.hotel_id;`;
        
        return dbPool.queryProm(sql);
    }
    
    function getWebsitesByBatchId(batchId) {
        batchId = dbPool.escape(batchId);

        let sql = '' 
        + `select website_id as websiteId, website_url as websiteUrl from hotel_webistes\n` 
        + `where batch_id = ${batchId};`
        
        return dbPool.queryProm(sql);
    }
    
    function insertEmails(emails, websiteId, batchId, cb) {
        websiteId = dbPool.escape(websiteId);
        batchId = dbPool.escape(batchId);
        let sql = '';
        
        emails.forEach(email => {
            email = dbPool.escape(email);

            sql += ''
                + `insert into emails (email, batch_id) values (${email}, ${batchId});\n`
                + `insert into emails_of_websites (website_id, email_id) values (${websiteId}, last_insert_id());\n`;
        })
        
        dbPool.queryCb(sql, cb);
    }
    
    return {
        hotelInfosFromBookingIntoDb,
        insertHotelWebsite,
        getHotelNamesAndAdresses,
        getWebsitesByBatchId,
        insertEmails
    }
})();

module.exports = hotelsModel;

