const dbPool = require('widgets/db-pool');

const hotelsModel = (() => {
    
    function hotelInfosFromBookingIntoDb(hotelInfosArr) {
        let sql = 'set autocommit = 0;\nSTART TRANSACTION;\n';
            
        hotelInfosArr.forEach((hotelInfosObj) => {
            sql += getHotelInfosFromBookingSql(hotelInfosObj);
            sql += '\n'
            return sql;
        });
        
        sql += 'COMMIT;\nset autocommit = 1;';

        return new Promise((resolve, reject) => {
            dbPool.queryCb(sql, (err, results, fields) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                logDuplicateHotels(results)
                resolve();
            });
        });
    }

    function getHotelInfosFromBookingSql(hotelInfosObj) {
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

    function insertHotelWebsiteAndAvatar(hotelInfosObj) {
        let hotelId = dbPool.escape(hotelInfosObj.hotelId);
        let avatarShortLink = dbPool.escape(hotelInfosObj.avatarShortLink);
        let websiteUrl = dbPool.escape(hotelInfosObj.websiteUrl);
        let batchId = dbPool.escape(hotelInfosObj.batchId);
        
        sql = ''
        +`update hotels set avatar_shortened_link = ${avatarShortLink} where hotel_id = ${hotelId};\n`
        
        + `insert into hotel_webistes (website_url, batch_id)\n`
        + `values (${websiteUrl}, ${batchId});\n`
        
        + `insert into websites_of_hotels (hotel_id, website_id) values (${hotelId}, LAST_INSERT_ID());\n`;
        
        return dbPool.queryProm(sql);
    }
    
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
        insertHotelWebsiteAndAvatar,
        getHotelNamesAndAdresses,
        getWebsitesByBatchId,
        insertEmails
    }
})();

module.exports = hotelsModel;

