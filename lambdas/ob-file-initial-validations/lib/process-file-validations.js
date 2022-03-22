'use strict';

const PostgresSQLService = require('../../../sharedLib/db/postgre-sql-service');
const FileSizeValidationService = require('./file-size-validation');
const FileDuplicateCheckService = require('./file-duplicate-chack');

let instance = null;

class FileValidationService {

    static getInstance() {
        if (!instance) {
            instance = new FileValidationService();
        }
        return instance;
    }

    async processDCFFileValidation (fileName, fileSize, pool) {

        try {
            const queryTOGetGUID = process.env.ref_sql_to_get_new_guid
            console.log(`-,-,processFileValidation,queryTOGetGUID: ${queryTOGetGUID}`)
            let postgresSQLService = PostgresSQLService.getInstance();
            const rows = await postgresSQLService.getGUID(queryTOGetGUID, pool)
            console.log(`-,-,processFileValidation,rows: ${JSON.stringify(rows)}`)
            if (rows) {
                const transID = rows[0].generate_global_unique_id
                console.log(`${transID},-,processFileValidation,transID: ${transID}`)
                let fileSizeValidationService = FileSizeValidationService.getInstance();
                let isFileSizeValid = await fileSizeValidationService.validateFileSize(transID,fileName,fileSize)
                console.log(`${transID},-,processFileValidation,isFileSizeValid: ${isFileSizeValid}`);
                if (isFileSizeValid) {
                    const  fileDupChkService = FileDuplicateCheckService.getInstance();
                    let isDuplicateFile = await fileDupChkService.fileDuplicateCheck(transID, fileName, pool)
                    console.log(`${transID},-,processFileValidation,isDuplicateFile: ${isDuplicateFile}`);
                    if ( ! isDuplicateFile ) {
                        return 'SUCCESS'
                    } else {
                        //Duplicat file Audit event
                        return 'FAILURE'
                    }
                } else {
                    //Invalid fileSize Audit event
                    return 'FAILURE'
                }
            } else {
                console.error(`-,-,processFileValidation,ERROR getting GUID`)  
            }
        } catch(err){
            console.error(`processFileValidation,ERROR in processFileValidation catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.copyObj, Error: ${JSON.stringify(err)}`);
        }
        
    }
}

module.exports = FileValidationService;