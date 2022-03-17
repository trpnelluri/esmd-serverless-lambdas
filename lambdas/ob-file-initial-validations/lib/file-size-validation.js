'use strict';

let instance = null;
const fileSize_1GB = process.env.max_allowed_file_size

class FileSizeValidationService {

    static getInstance() {
        if (!instance) {
            instance = new FileSizeValidationService();
        }
        return instance;
    }
    async validateFileSize(transID, fileName, fileSize) {
        console.log(`${transID},-,validateFileSize,is invoked for fileName:${fileName}`);
        const logPrefix = `validateFileSize,fileName: ${fileName} >`;
        let validateFileSize = false

        if (fileSize == 0)  {
            //TBD AUDIT EVENT
            return validateFileSize
        } else {
            console.log(`${transID},-,validateFileSize,fileSize: ${fileSize}`)
            if ( fileSize > fileSize_1GB ) {
                //TBD AUDIT EVENT
                console.log(`${transID},-,validateFileSize,fileSize is greater than 1 GB : ${fileSize}`)
                return validateFileSize
            } else {
                validateFileSize = true
                console.log(`${transID},-,validateFileSize,fileSize validation completed successfully and fileSizeInMB: ${fileSize}`)
                return validateFileSize
            }
        }
    }
}

module.exports = FileSizeValidationService;