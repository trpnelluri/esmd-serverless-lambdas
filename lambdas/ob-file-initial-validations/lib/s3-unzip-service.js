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

    async fileUnzip (transID, bucketName, fullFileName, fileName, LOBDirectory){
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
        for await (const file of zip) {
            const entry = file;
            const fileName = entry.path;
            const type = entry.type.toLowerCase();
            console.log(`${transID},-,fileUnzip,fileName: ${fileName} type: ${type}`)
            if (type === 'file') {
                const uploadParams = {
                    Bucket: bucketName,
                    Key: LOBDirectory + fileName,
                    Body: entry,
                };
                console.log(`${transID},-,fileUnzip,uploadParams: ${JSON.stringify(uploadParams)}`)
                promises.push(s3.upload(uploadParams).promise());

                listOfFiles[type + num] = fileName
                num++;
            } else {
                if ( type === 'directory' ) {
                    listOfFiles[type] = fileName
                }
                entry.autodrain();
            }
        }
    
        await Promise.all(promises);

        return listOfFiles

    }

}

module.exports = S3UnzipService;