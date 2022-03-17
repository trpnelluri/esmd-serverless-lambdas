'use strict';

const FileSizeValidationService = require('./lib/file-size-validation');
const IdServiceShared = require('../../sharedLib/common/id-service');
const GetReqDataFromDBService = require('../../sharedLib/common/get-required-data-from-db');

module.exports.handler = async function (event, context, callback) {
    console.log(`handler,Event received: ${JSON.stringify(event)}`);
    let id = IdServiceShared.getInstance().getId();

    console.log(`handler,Id: ${id}`);
    const fileName = event.Records[0].s3.object.key;
    const fileSize = event.Records[0].s3.object.size;

    try{ 
  
        const requiredEnvData = {
            refsql: process.env.ref_sql_to_get_new_guid
        }

        let getReqDataFromDBService = GetReqDataFromDBService.getInstance();
        const { requiredData }  = await getReqDataFromDBService.getReqDataFromDB(requiredEnvData )
        console.log(`handler,requiredData: ${JSON.stringify(requiredData)}`)
        let fileSizeValidationService = FileSizeValidationService.getInstance();
        let fileSizeValidationFlag = await fileSizeValidationService.validateFileSize(fileName,fileSize)
        console.log(`handler,fileSizeValidationFlag: ${fileSizeValidationFlag}`);
    
    } catch(err) {
        console.log(`handler> Error: ${err}`);
        return callback(err, null);
    }

    console.log(`handler,fileName: ${fileName} fileSize: ${fileSize}`);


    // let frsS3ToDynamodbServiceTci = FrsS3ToDynamodbServiceTci.getInstance();
    // try {
    //     let response = await frsS3ToDynamodbServiceTci.maintenanceSchedule(event, id);
    //     console.log(`handler> Response: ${JSON.stringify(response)}`);
    //     return callback(null, response);
    // } catch (e) {
    //     return callback(`An error occurred :: ${e}`);
    // }
};