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
        //const logPrefix = `validateFileSize,fileName: ${fileName} >`;
        let isFileSizeValid = false

        if (fileSize === 0) {
            return isFileSizeValid
        } else {
            console.log(`${transID},-,validateFileSize,fileSize: ${fileSize}`)
            if ( fileSize > fileSize_1GB ) {
                console.log(`${transID},-,validateFileSize,fileSize is greater than 1 GB : ${fileSize}`)
                return isFileSizeValid
            } else {
                isFileSizeValid = true
                console.log(`${transID},-,validateFileSize,fileSize validation completed successfully and fileSizeInMB: ${fileSize}`)
                return isFileSizeValid
            }
        }
    }
}

module.exports = FileSizeValidationService;