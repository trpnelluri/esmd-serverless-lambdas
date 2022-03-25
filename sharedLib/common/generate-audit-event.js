'use strict'

const SQSServiceShared = require('../aws/sqs-service');

const EventName = 'GenerateAuditEventService'
const SUCCESS = 'Success'
const FAILURE = 'Failure'

let instance = null;

class GenerateAuditEventService {

    static getInstance()
    {
        if(!instance){
            instance = new GenerateAuditEventService();
        }
        return instance;
    }

    async generateAuditEvent ( glblUniqId, requiredEnvData ) {

        try {
            let auditEventArray = [];
            let auditEventObj = new Object;
            const auditEventAttributes = requiredEnvData.auditeventdata
            const targetQueueQRL = requiredEnvData.auditqueueurl
            const auditEventAttributesObj = auditEventAttributes.split(',');
            auditEventAttributesObj.forEach((element) => {
                console.log(`${EventName},${glblUniqId},generateAuditEvent,element: ${element}`)
                const auditEventAttribute = element.toLowerCase().trim()
                const auditEventAttrArray = auditEventAttribute.split('^')
                const auditEventAttri = auditEventAttrArray[0]
                const auditEventAttriVal = auditEventAttrArray[1]
                if (auditEventAttriVal !== 'null' ) {
                    if (auditEventAttriVal === 'transaction_id') {
                        auditEventObj[auditEventAttri] = glblUniqId
                    } else if (auditEventAttriVal === 'date_timestamp') {
                        auditEventObj[auditEventAttri] = new Date();
                    } else {
                        auditEventObj[auditEventAttri] = auditEventAttriVal.toUpperCase()
                    }
                } else {
                    auditEventObj[auditEventAttri] = ''
                }
            })
            auditEventArray.push(auditEventObj)
            console.log(`${EventName},${glblUniqId},generateAuditEvent,auditEventArray: ${JSON.stringify(auditEventArray)}`)
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(glblUniqId, auditEventArray, targetQueueQRL);
            console.log(`${EventName},${glblUniqId},generateAuditEvent,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
            if ( sendMsgRes ) {
                console.log(`${EventName},${glblUniqId},generateAuditEvent,sendMsgRes: ${SUCCESS}`)
                return SUCCESS
            } else {
                console.log(`${EventName},${glblUniqId},generateAuditEvent,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
                return FAILURE
            }
        } catch (err) {
            console.error(`${EventName},${glblUniqId},generateAuditEvent,ERROR catch: ${err.stack}`)
        }
    }

}

module.exports = GenerateAuditEventService;
