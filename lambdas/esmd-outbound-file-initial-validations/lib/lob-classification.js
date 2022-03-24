'use strict';

const PostgresSQLService = require('../../../sharedLib/db/postgre-sql-service');
const S3UnzipService = require('../../../sharedLib/aws/s3-unzip-service');
const S3Service = require('../../../sharedLib/aws/s3-service');
const SQSServiceShared = require('../../../sharedLib/aws/sqs-service');
const FileValidationService = require('./process-file-validations')

let instance = null;

const DCF = 'L17'
const ICDT = 'L15'
const EMDRPREPAY = 'L1_5'
const EMDRPOSTPAY = 'L1_6'
const indexOFLOB = 2

class LOBClassificationService {

    static getInstance() {
        if (!instance) {
            instance = new LOBClassificationService();
        }
        return instance;
    }

    async classifyLOB(bucketName, fullFileName, fileName, fileSize, pool) {

        try {

            let transID = '-'
            console.log(`${transID},classifyLOB,is invoked for fileName:${fileName}`);
            const fileIdentifiationArray = fileName.split('.')
            let lobIdetification = fileIdentifiationArray[indexOFLOB];
            console.log (`${transID},classifyLOB,lobIdetification: ${lobIdetification} DCF: ${DCF} ICDT: ${ICDT} EMDRPREPAY: ${EMDRPREPAY} EMDRPOSTPAY: ${EMDRPOSTPAY}`)
            let lengthOfLOBIdentify = ''
            let LOBDirectory = ''
            let lineOfBuss = ''
            let targetQueueQRL = ''
            let unZipService = false
            let response = null;

            const postgresSQLService = PostgresSQLService.getInstance();

            if ( lobIdetification.indexOf(DCF) > -1 ) {
                lengthOfLOBIdentify = lobIdetification.length
                let dcfLob = lobIdetification.slice(1, lengthOfLOBIdentify)
                LOBDirectory = 'dcf/'
                lineOfBuss = dcfLob.replace('_', '.')
                transID = await getUnid(fileName, lineOfBuss, LOBDirectory, postgresSQLService, pool)
                targetQueueQRL = process.env.process_dcf_queue
                console.log (`${transID},classifyLOB,DCF>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} dcfLob: ${dcfLob} lineOfBuss: ${lineOfBuss} LOBDirectory: ${LOBDirectory} targetQueueQRL: ${targetQueueQRL}`)
            } else if (lobIdetification.indexOf(ICDT) > -1) {
                lengthOfLOBIdentify = lobIdetification.length
                let icdtLob = lobIdetification.slice(1, lengthOfLOBIdentify)
                LOBDirectory = 'icdt/'
                lineOfBuss = icdtLob.replace('_', '.')
                unZipService = true
                targetQueueQRL = process.env.process_icdt_queue
                console.log (`${transID},classifyLOB,ICDT>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} icdtLob: ${icdtLob} lineOfBuss: ${lineOfBuss} LOBDirectory: ${LOBDirectory} targetQueueQRL: ${targetQueueQRL}`)
            } else if (lobIdetification.indexOf(EMDRPREPAY) > -1) {
                lengthOfLOBIdentify = lobIdetification.length
                let prePayLob = lobIdetification.slice(1, lengthOfLOBIdentify)
                LOBDirectory = 'emdr-prepay/'
                lineOfBuss = prePayLob.replace('_', '.')
                unZipService = true
                targetQueueQRL = process.env.process_emdr_prepay_queue
                console.log (`${transID},classifyLOB,EMDRPREPAY>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} prePayLob: ${prePayLob} lineOfBuss: ${lineOfBuss} LOBDirectory: ${LOBDirectory} targetQueueQRL: ${targetQueueQRL}`)
            } else if (lobIdetification.indexOf(EMDRPOSTPAY) > -1) {
                lengthOfLOBIdentify = lobIdetification.length
                let postPayLob = lobIdetification.slice(1, lengthOfLOBIdentify)
                LOBDirectory = 'emdr-postpay/'
                lineOfBuss = postPayLob.replace('_', '.')
                unZipService = true
                targetQueueQRL = process.env.process_emdr_postpay_queue
                console.log (`${transID},classifyLOB,EMDRPOSTPAY>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} postPayLob: ${postPayLob} lineOfBuss: ${lineOfBuss} LOBDirectory: ${LOBDirectory} targetQueueQRL: ${targetQueueQRL}`)
            } else {
                console.log(`Received file ${fileName} does not belong to any of the LOB.`)
                return 'SUCCESS'
            }

            if ( unZipService ) {
                transID = await getUnid(fileName, lineOfBuss, LOBDirectory, postgresSQLService, pool)
                let s3UnzipService = S3UnzipService.getInstance();
                response = await s3UnzipService.fileUnzip(transID, bucketName, fullFileName, LOBDirectory, lineOfBuss)
                console.log(`${transID},classifyLOB,unZipService response: ${JSON.stringify(response)}`)
            } else {
                const fileValidation = await FileValidationService.getInstance().processFileValidation (transID, lineOfBuss, fileName, fileSize, postgresSQLService, pool)
                console.log(`fileValidation ${fileValidation}`)
                if ( fileValidation === 'SUCCESS' ) {
                    let s3CopyObjService = S3Service.getInstance();
                    response = await s3CopyObjService.copyObj(transID, bucketName, fullFileName, LOBDirectory, lineOfBuss)
                    console.log(`${transID},classifyLOB,copyObj response: ${JSON.stringify(response)}`)
                //TBD to insert the record into esmd table esmd_data.INBND_OTBND_DOC_RSPNS with the file object
                } else {
                    return 'FAILURE'
                }
            }

            if (response) {
                const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(transID, response, targetQueueQRL);
                if (sendMsgRes) {
                // TBD: Audit Event to be add //NEW Audit Events
                    console.log(`${transID},classifyLOB,copyObj response: ${JSON.stringify(sendMsgRes)}`)
                    return 'SUCCESS'
                } else {
                // TBD: Failure DLQ
                    return 'FAILURE'
                }
                
            } else {
                //Notes: NO need to send the message to DLQ
                return 'FAILURE'
            }

        } catch (err) {
            console.error(`LOBClassificationService.classifyLOB,ERROR in getUnid catch ${JSON.stringify(err.stack)}`)
            throw Error(`LOBClassificationService.classifyLOB, Failed to get guid from esmd. Error: ${JSON.stringify(err)}`);
        }
        
    }
}

async function getUnid(fileName, lineOfBuss, LOBDirectory, postgresSQLService, pool) {
    try {
        if ( lineOfBuss === '17' ) {
            let text = process.env.ref_sql_to_get_new_guid
            let transID = await postgresSQLService.getNewGUID(text, pool)
            console.log(`${transID},getUnid,transID: ${transID}`)
            return transID
        } else {
            let text = process.env.ref_sql_to_get_guid
            let valuesToReplace = [fileName, lineOfBuss]
            console.log(`-,getUnid,valuesToReplace: ${JSON.stringify(valuesToReplace)}`)
            let transID = await postgresSQLService.getGUID(text, valuesToReplace, pool)
            console.log(`${transID},getUnid,transID: ${transID}`)
            return transID
        }
    } catch (err) {
        console.error(`LOBClassificationService.getUnid,ERROR in getUnid catch ${JSON.stringify(err.stack)}`)
        throw Error(`LOBClassificationService.getUnid, Failed to get guid from esmd. Error: ${JSON.stringify(err)}`);
    }
}

module.exports = LOBClassificationService;