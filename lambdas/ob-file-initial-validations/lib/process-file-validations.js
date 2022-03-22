'use strict';

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

    async processFileValidation (transID, lineOfBuss, fileName, fileSize, postgresSQLService, pool) {
        try {
            let fileSizeValidationService = FileSizeValidationService.getInstance();
            let isFileSizeValid = await fileSizeValidationService.validateFileSize(transID, fileName, fileSize)
            console.log(`${transID},processFileValidation,isFileSizeValid: ${isFileSizeValid}`);
            if (isFileSizeValid) {
                const fileDupChkService = FileDuplicateCheckService.getInstance();
                let isDuplicateFile = await fileDupChkService.fileDuplicateCheck(transID, fileName, lineOfBuss, postgresSQLService, pool)
                console.log(`${transID},processFileValidation,isDuplicateFile: ${isDuplicateFile}`);
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
        } catch(err){
            console.error(`processFileValidation,ERROR in processFileValidation catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.copyObj, Error: ${JSON.stringify(err)}`);
        }
    }
}

module.exports = FileValidationService;