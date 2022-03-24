'use strict';

const AWS = require('aws-sdk');

const s3Client = new AWS.S3();
//const EventName = 'S3_SERVICE'
let instance = null;

class S3Service{

    static getInstance()
    {
        if(!instance){
            instance = new S3Service();
        }
        return instance;
    }

    async getObj(bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        console.log(`getObj,params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            let strData = data.Body.toString('utf-8');
            let objData = JSON.parse(strData); // passing the buffer directly will have it converted to string
            console.log(`getObj,objData: ${JSON.stringify(objData)}`)
            return objData
        } catch (err) {
            console.error(`getObj,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getObj,Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async getText(bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        console.log(`getText,params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            console.log(`getText,data: ${data.Body.toString()}`)
            return data.Body.toString();
        } catch (err) {
            console.error(`getText,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getText, Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async exists(bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        console.log(`exists,params: ${JSON.stringify(params)}`)
        try {
            const info = await s3Client.headObject(params).promise();
            console.log(`exists,File Exists: ${JSON.stringify(info)}`);
            return true;
        } catch (err) {
            if (err.statusCode === 404) {
                return false
            }
            throw Error(`S3Service.exists> There was an error getting information on the file ${key}, for ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async copyObj (transID, bucketName, fullFileName, LOBDirectory, lineOfBuss){

        try {
            let fileNameArray = fullFileName.split('/')
            let fileName = fileNameArray[1]
            let copyObjParams = {
                Bucket : bucketName,
                CopySource : bucketName + '/' + fullFileName,
                Key : LOBDirectory + fileName
            };
            console.log(`${transID},copyObj,copyObjParams: ${JSON.stringify(copyObjParams)}`)
            let listOfFiles = new Object;
            let filesArray = [];
            const copyResponse = await s3Client.copyObject(copyObjParams).promise();
            console.log(`${transID},copyObj,copyResponse:  ${JSON.stringify(copyResponse)}`);
            if (copyResponse) {
                let files = new Object;
                listOfFiles.lob = lineOfBuss
                listOfFiles.directory = LOBDirectory.slice(0, -1)
                files.filename = fileName   //TBD to Add LOBDirectory
                files.filetype = fileName.split('.').pop();
                filesArray.push(files)
                listOfFiles.files = filesArray
                console.log(`${transID},copyObj,listOfFiles: ${JSON.stringify(listOfFiles)}`)
                return listOfFiles
            } else {
                console.log(`${transID},copyObj,ERROR`);
                return null
            }
        } catch (err) {
            //TBD Need to Add Copy Object Failure Audit Event Exception/Email Notification 
            console.error(`copyObj,ERROR in copyObj catch ${JSON.stringify(err.stack)}`)
            return false;
        }
    }
}

module.exports = S3Service;