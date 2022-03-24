'use strict';
const PostgresPoolService = require('../../sharedLib/db/postgre-pool-service');
const LOBClassificationService = require('./lib/lob-classification');

module.exports.handler = async function (event, context, callback) {
    console.log(`handler,Event received: ${JSON.stringify(event)}`);
    let lengthOfEvent = event.Records.length
    console.log(`handler,event.Records[0]: ${lengthOfEvent}`);
    try{
        const msgBody = JSON.parse(event.Records[0].body)
        console.log(`handler,msgBody received: ${JSON.stringify(msgBody)}`);
        const bucketName = msgBody.Records[0].s3.bucket.name;
        const fullFileName = msgBody.Records[0].s3.object.key;
        let fileNameArray = fullFileName.split('/');
        const fileName = fileNameArray[1];
        const fileSize = msgBody.Records[0].s3.object.size;
        console.log(`-,handler,fullFileName: ${fullFileName} fileName: ${fileName} fileSize: ${fileSize}`);
        context.callbackWaitsForEmptyEventLoop = false;
        
        const pool = await PostgresPoolService.getInstance().connectToPostgresDB ()
        let lobClassificationService = LOBClassificationService.getInstance();
        let response = await lobClassificationService.classifyLOB(bucketName, fullFileName, fileName, fileSize, pool)
        console.log(`-,handler,response: ${response}`);
        return callback(null, response);
    } catch(err) {
        console.log(`-,handler,Error in catch: ${err}`);
        return callback(err, null);
    }
};