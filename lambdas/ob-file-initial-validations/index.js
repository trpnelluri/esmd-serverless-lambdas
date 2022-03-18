'use strict';
const PostgresPoolService = require('../../sharedLib/db/postgre-pool-service');
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');
const FileSizeValidationService = require('./lib/file-size-validation');
//const IdServiceShared = require('../../sharedLib/common/id-service');
const FileDuplicateCheckService = require('./lib/file-duplicate-chack');
const LOBClassificationService = require('./lib/lob-classification');

module.exports.handler = async function (event, context, callback) {
    console.log(`handler,Event received: ${JSON.stringify(event)}`);
    //let id = IdServiceShared.getInstance().getId();
    //console.log(`handler,Id: ${id}`);
    const bucketName = event.Records[0].s3.bucket.name;
    const fullFileName = event.Records[0].s3.object.key;
    let fileNameArray = fullFileName.split('/');
    const fileName = fileNameArray[1].toUpperCase();
    const fileSize = event.Records[0].s3.object.size;
    console.log(`-,-,handler,fullFileName: ${fullFileName} fileName: ${fileName} fileSize: ${fileSize}`);
    context.callbackWaitsForEmptyEventLoop = false;
    try{ 

        const transID = 'ZMF0000276301EC'
        let lobClassificationService = LOBClassificationService.getInstance();
        let response = await lobClassificationService.classifyLOB(transID, bucketName, fullFileName, fileName)

        console.log(`${transID},-,handler,response: ${response}`);
        return callback(null, response);
        /*
        const pool = await PostgresPoolService.getInstance().connectToPostgresDB ()
        const queryTOGetGUID = process.env.ref_sql_to_get_new_guid
        console.log(`-,-,handler,queryTOGetGUID: ${queryTOGetGUID}`)
        let postgresSQLService = PostgresSQLService.getInstance();
        const rows = await postgresSQLService.getGUID(queryTOGetGUID,pool)
        console.log(`-,-,handler,rows: ${JSON.stringify(rows)}`)
        if (rows) {
            const transID = rows[0].generate_global_unique_id
            console.log(`${transID},-,handler,transID: ${transID}`)
            let fileSizeValidationService = FileSizeValidationService.getInstance();
            let fileSizeValidationFlag = await fileSizeValidationService.validateFileSize(transID,fileName,fileSize)
            console.log(`${transID},-,handler,fileSizeValidationFlag: ${fileSizeValidationFlag}`);
            if (fileSizeValidationFlag) {
                const  fileDupChkService = FileDuplicateCheckService.getInstance();
                let duplicateFlag = await fileDupChkService.fileDuplicateCheck(transID, fileName, pool)
                console.log(`${transID},-,handler,duplicateFlag: ${duplicateFlag}`);
            }
        }
        //return callback(null, response);
        */
    } catch(err) {
        console.log(`-,-,handler,Error in catch: ${err}`);
        return callback(err, null);
    }
};