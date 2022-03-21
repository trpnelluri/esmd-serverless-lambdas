'use strict';

const S3UnzipService = require('../../../sharedLib/aws/s3-unzip-service');
const SQSServiceShared = require('../../../sharedLib/aws/sqs-service');

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

    async classifyLOB(transID, bucketName, fullFileName, fileName) {
        console.log(`${transID},-,classifyLOB,is invoked for fileName:${fileName}`);
        const fileIdentifiationArray = fileName.split('.')
        let lobIdetification = fileIdentifiationArray[indexOFLOB];
        console.log (`${transID},-,classifyLOB,lobIdetification: ${lobIdetification} DCF: ${DCF} ICDT: ${ICDT} EMDRPREPAY: ${EMDRPREPAY} EMDRPOSTPAY: ${EMDRPOSTPAY}`)
        let lengthOfLOBIdentify = ''
        let LOBDirectory = ''
        let lineOfBuss = ''
        let targetQueueQRL = ''

        if ( lobIdetification.indexOf(DCF) > -1 ) {
            lengthOfLOBIdentify = lobIdetification.length
            let dcfLob = lobIdetification.slice(1,lengthOfLOBIdentify)
            LOBDirectory = 'dcf/'
            lineOfBuss = dcfLob.replace('_', '.')
            targetQueueQRL = process.env.process_dcf_queue
            console.log (`${transID},-,classifyLOB,DCF>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} dcfLob: ${dcfLob} lineOfBuss: ${lineOfBuss} LOBDirectory: ${LOBDirectory} targetQueueQRL: ${targetQueueQRL}`)

        } else if (lobIdetification.indexOf(ICDT) > -1) {
            lengthOfLOBIdentify = lobIdetification.length
            let icdtLob = lobIdetification.slice(1,lengthOfLOBIdentify)
            LOBDirectory = 'icdt/'
            lineOfBuss = icdtLob.replace('_', '.')
            targetQueueQRL = process.env.process_icdt_queue
            console.log (`${transID},-,classifyLOB,ICDT>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} icdtLob: ${icdtLob} lineOfBuss: ${lineOfBuss} LOBDirectory: ${LOBDirectory} targetQueueQRL: ${targetQueueQRL}`)

        } else if (lobIdetification.indexOf(EMDRPREPAY) > -1) {
            lengthOfLOBIdentify = lobIdetification.length
            let prePayLob = lobIdetification.slice(1,lengthOfLOBIdentify)
            LOBDirectory = 'emdr-prepay/'
            lineOfBuss = prePayLob.replace('_', '.')
            targetQueueQRL = process.env.process_emdr_prepay_queue
            console.log (`${transID},-,classifyLOB,EMDRPREPAY>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} prePayLob: ${prePayLob} lineOfBuss: ${lineOfBuss} LOBDirectory: ${LOBDirectory} targetQueueQRL: ${targetQueueQRL}`)

        } else if (lobIdetification.indexOf(EMDRPOSTPAY) > -1) {
            lengthOfLOBIdentify = lobIdetification.length
            let postPayLob = lobIdetification.slice(1,lengthOfLOBIdentify)
            LOBDirectory = 'emdr-postpay/'
            lineOfBuss = postPayLob.replace('_', '.')
            targetQueueQRL = process.env.process_emdr_postpay_queue
            console.log (`${transID},-,classifyLOB,EMDRPOSTPAY>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} postPayLob: ${postPayLob} lineOfBuss: ${lineOfBuss} LOBDirectory: ${LOBDirectory} targetQueueQRL: ${targetQueueQRL}`)

        } else {

            console.log(`Received file ${fileName} does not belong to any of the LOB.`)
            return 'SUCCESS'

        }

        let s3UnzipService = S3UnzipService.getInstance();
        let response = await s3UnzipService.fileUnzip(transID, bucketName, fullFileName, LOBDirectory, lineOfBuss)
        console.log(`${transID},-,classifyLOB,response: ${JSON.stringify(response)}`)

        if (response) {
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(response, targetQueueQRL );
            console.log(`${transID},-,classifyLOB,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
            return 'SUCCESS'
        } else {
            return 'FAILURE'
        }

    }
}

module.exports = LOBClassificationService;