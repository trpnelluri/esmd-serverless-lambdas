'use strict';

const S3UnzipService = require('./s3-unzip-service');

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
        if ( lobIdetification.indexOf(DCF) > -1 ) {
            lengthOfLOBIdentify = lobIdetification.length
            let dcfLob = lobIdetification.slice(1,lengthOfLOBIdentify)
            const DCFLOB = dcfLob.replace('_', '.')
            console.log (`${transID},-,classifyLOB,DCF>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} dcfLob: ${dcfLob} DCFLOB: ${DCFLOB}`)

            return 'SUCCESS'

        } else if (lobIdetification.indexOf(ICDT) > -1) {
            lengthOfLOBIdentify = lobIdetification.length
            let icdtLob = lobIdetification.slice(1,lengthOfLOBIdentify)
            const ICDTLOB = icdtLob.replace('_', '.')
            console.log (`${transID},-,classifyLOB,ICDT>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} icdtLob: ${icdtLob} ICDTLOB: ${ICDTLOB}`)

            let s3UnzipService = S3UnzipService.getInstance();
            let response = await s3UnzipService.fileUnzip(transID, bucketName, fullFileName, fileName, 'icdt/')

            console.log(`${transID},-,classifyLOB,ICDT>>response: ${JSON.stringify(response)}`)

            return 'SUCCESS'

        } else if (lobIdetification.indexOf(EMDRPREPAY) > -1) {
            lengthOfLOBIdentify = lobIdetification.length
            let prePayLob = lobIdetification.slice(1,lengthOfLOBIdentify)
            const EMDRPrePayLOB = prePayLob.replace('_', '.')
            console.log (`${transID},-,classifyLOB,EMDRPREPAY>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} icdtLob: ${icdtLob} EMDRPrePayLOB: ${EMDRPrePayLOB}`)

            return 'SUCCESS'

        } else if (lobIdetification.indexOf(EMDRPOSTPAY) > -1) {
            lengthOfLOBIdentify = lobIdetification.length
            let postPayLob = lobIdetification.slice(1,lengthOfLOBIdentify)
            const EMDRPostPayLOB = postPayLob.replace('_', '.')
            console.log (`${transID},-,classifyLOB,EMDRPOSTPAY>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} icdtLob: ${icdtLob} EMDRPostPayLOB: ${EMDRPostPayLOB}`)

            return 'SUCCESS'

        } else {

            console.log(`Received file ${fileName} does not belong to any of the LOB.`)
            return 'SUCCESS'

        }
    }
}

module.exports = LOBClassificationService;