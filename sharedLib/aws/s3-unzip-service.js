'use strict';

const AWS = require('aws-sdk')
const s3 = new AWS.S3();
const unzipper = require('unzipper');

let instance = null;

class S3UnzipService {

    static getInstance() {
        if (!instance) {
            instance = new S3UnzipService();
        }
        return instance;
    }

    async fileUnzip (transID, bucketName, fullFileName, LOBDirectory, lineOfBuss){
        const params = {
            Bucket: bucketName,
            Key: fullFileName,
        }
        console.log(`${transID},-,fileUnzip,params: ${JSON.stringify(params)}`)

        const zip = s3
          .getObject(params)
          .createReadStream()
          .pipe(unzipper.Parse({ forceStream: true }));

        const promises = [];
        let num = 0;
        let listOfFiles = new Object;
        let filesArray = [];
    
        for await (const file of zip) {
            const entry = file;
            const fileName = entry.path;
            const type = entry.type.toLowerCase();
            let files = new Object
            console.log(`${transID},-,fileUnzip,fileName: ${fileName} type: ${type}`)
            if (type === 'file') {
                const uploadParams = {
                    Bucket: bucketName,
                    Key: LOBDirectory + fileName,
                    Body: entry,
                };
                console.log(`${transID},-,fileUnzip,uploadParams Bucket: ${uploadParams.Bucket} Key: ${uploadParams.Key}`)
                promises.push(s3.upload(uploadParams).promise());

                files.filename = fileName
                files.filetype = fileName.split('.').pop(); // Assumtion will be only one '.' in file name
                /*
                // Adding filetype to message body
                let lengthOfFile = fileName.length
                let indexOfFileExtn = fileName.lastIndexOf(".")
                let typeOfFile = fileName.slice(indexOfFileExtn+1, lengthOfFile) // to get the file extension
                files.filetype = typeOfFile
                */
                filesArray.push(files)
                num++;
            } else {
                if ( type === 'directory' ) {
                    listOfFiles.lob = lineOfBuss
                    listOfFiles[type] = fileName.slice(0, -1)  // To remove '/' at the end
                }
                entry.autodrain();
            }
        }

        listOfFiles.files = filesArray
    
        await Promise.all(promises);

        return listOfFiles
    }

}

module.exports = S3UnzipService;