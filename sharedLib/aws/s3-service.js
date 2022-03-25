'use strict';

const AWS = require('aws-sdk');
const GenerateAuditEventService = require('../common/generate-audit-event');
const s3Client = new AWS.S3();
const EventName = 'S3Service'
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
        console.log(`${EventName},-,getObj,params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            let strData = data.Body.toString('utf-8');
            let objData = JSON.parse(strData); // passing the buffer directly will have it converted to string
            console.log(`${EventName},-,getObj,objData: ${JSON.stringify(objData)}`)
            return objData
        } catch (err) {
            console.error(`${EventName},-,getObj,,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`${EventName}.getObj,Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async getText(bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        console.log(`${EventName},-,getText,params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            console.log(`${EventName},-,getText,data: ${data.Body.toString()}`)
            return data.Body.toString();
        } catch (err) {
            console.error(`${EventName},-,getText,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`${EventName}.getText, Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async exists(bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        console.log(`${EventName},-,exists,params: ${JSON.stringify(params)}`)
        try {
            const info = await s3Client.headObject(params).promise();
            console.log(`${EventName},-,exists,File Exists: ${JSON.stringify(info)}`);
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
            console.log(`${EventName},${transID},copyObj,copyObjParams: ${JSON.stringify(copyObjParams)}`)
            let listOfFiles = new Object;
            let filesArray = [];
            const copyResponse = await s3Client.copyObject(copyObjParams).promise();
            console.log(`${EventName},${transID},copyObj,copyResponse:  ${JSON.stringify(copyResponse)}`);
            if (copyResponse) {
                let files = new Object;
                listOfFiles.lob = lineOfBuss
                listOfFiles.directory = LOBDirectory.slice(0, -1)
                files.filename = fileName   //TBD to Add LOBDirectory
                files.filetype = fileName.split('.').pop();
                filesArray.push(files)
                listOfFiles.files = filesArray
                console.log(`${EventName},${transID},copyObj,listOfFiles: ${JSON.stringify(listOfFiles)}`)
                return listOfFiles
            } else {
                console.log(`${EventName},${transID},copyObj,ERROR`);
                return null
            }
        } catch (err) {
            const requiredEnvData = {
                auditeventdata: process.env.copyobject_fail_audit_event,
                auditqueueurl: process.env.audit_queue_url
            }
            const generateAuditEvent = await GenerateAuditEventService.getInstance().generateAuditEvent(transID, requiredEnvData)
            console.error(`${EventName},${transID},fileUnzip,generateAuditEvent: ${generateAuditEvent} ERROR in copyObj catch ${JSON.stringify(err.stack)}`)
            return false;
        }
    }
}

module.exports = S3Service;