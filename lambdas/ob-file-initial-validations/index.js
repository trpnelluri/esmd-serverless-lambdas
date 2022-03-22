'use strict';
const PostgresPoolService = require('../../sharedLib/db/postgre-pool-service');
const LOBClassificationService = require('./lib/lob-classification');

module.exports.handler = async function (event, context, callback) {
    console.log(`handler,Event received: ${JSON.stringify(event)}`);
    const bucketName = event.Records[0].s3.bucket.name;
    const fullFileName = event.Records[0].s3.object.key;
    let fileNameArray = fullFileName.split('/');
    //const fileName = fileNameArray[1].toUpperCase();
    const fileName = fileNameArray[1];
    const fileSize = event.Records[0].s3.object.size;
    console.log(`-,-,handler,fullFileName: ${fullFileName} fileName: ${fileName} fileSize: ${fileSize}`);
    context.callbackWaitsForEmptyEventLoop = false;
    try{ 
        const pool = await PostgresPoolService.getInstance().connectToPostgresDB ()
        const transID = 'ZMF0000276301EC'
        let lobClassificationService = LOBClassificationService.getInstance();
        let response = await lobClassificationService.classifyLOB(transID, bucketName, fullFileName, fileName, fileSize, pool)
        console.log(`${transID},-,handler,response: ${response}`);
        return callback(null, response);
     
    } catch(err) {
        console.log(`-,-,handler,Error in catch: ${err}`);
        return callback(err, null);
    }
};