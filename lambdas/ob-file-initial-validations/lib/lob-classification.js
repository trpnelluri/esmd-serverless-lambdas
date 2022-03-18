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
    async classifyLOB(transID, fileName ) {
        console.log(`${transID},-,classifyLOB,is invoked for fileName:${fileName}`);
        const fileIdentifiationArray = fileName.split('.')
        let lobIdetification = fileIdentifiationArray[indexOFLOB];
        console.log (`${transID},-,classifyLOB,lobIdetification: ${lobIdetification} DCF: ${DCF} ICDT: ${ICDT} EMDRPREPAY: ${EMDRPREPAY} EMDRPOSTPAY: ${EMDRPOSTPAY}`)
        
        if ( lobIdetification.indexOf(DCF) > -1 ) {
            let lengthOfLOBIdentify = lobIdetification.length
            let dcfLob = lengthOfLOBIdentify.substr(1,lengthOfLOBIdentify)
            const DCFLOB = dcfLob.replace('_', '.')
            console.log (`${transID},-,classifyLOB,DCF>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} dcfLob: ${dcfLob} DCFLOB: ${DCFLOB}`)

        } else if (lobIdetification.indexOf(ICDT) > -1) {
            let lengthOfLOBIdentify = lobIdetification.length
            let icdtLob = lengthOfLOBIdentify.substr(1,lengthOfLOBIdentify)
            const ICDTLOB = icdtLob.replace('_', '.')
            console.log (`${transID},-,classifyLOB,ICDT>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} icdtLob: ${icdtLob} ICDTLOB: ${ICDTLOB}`)

        } else if (lobIdetification.indexOf(EMDRPREPAY) > -1) {
            let lengthOfLOBIdentify = lobIdetification.length
            let prePayLob = lengthOfLOBIdentify.substr(1,lengthOfLOBIdentify)
            const EMDRPrePayLOB = prePayLob.replace('_', '.')
            console.log (`${transID},-,classifyLOB,EMDRPREPAY>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} icdtLob: ${icdtLob} EMDRPrePayLOB: ${EMDRPrePayLOB}`)

        } else if (lobIdetification.indexOf(EMDRPOSTPAY) > -1) {
            let lengthOfLOBIdentify = lobIdetification.length
            let postPayLob = lengthOfLOBIdentify.substr(1,lengthOfLOBIdentify)
            const EMDRPostPayLOB = postPayLob.replace('_', '.')
            console.log (`${transID},-,classifyLOB,EMDRPOSTPAY>>lengthOfLOBIdentify: ${lengthOfLOBIdentify} icdtLob: ${icdtLob} EMDRPostPayLOB: ${EMDRPostPayLOB}`)

        } else {
            console.log(`Received file ${fileName} does not belong to any of the LOB.`)
        }
    }
}

module.exports = FileSizeValidationService;