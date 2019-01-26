const dbPool = require('widgets/db-pool');

const HotelsModel = (() => {
    
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
                    console.log('error handling');
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
        console.log('hotelName: ' + hotelName);
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
    
    return {
        hotelInfosFromBookingIntoDb
    }
})();

module.exports = HotelsModel;

