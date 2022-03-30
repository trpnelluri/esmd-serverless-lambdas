'use strict';

const FileDuplicateCheckService = require('./file-duplicate-chack');
const S3Service = require('../../../sharedLib/aws/s3-service');
const BuildInsertQueryService = require('./build-insert-query');
const GenerateAuditEventService = require('../../../sharedLib/common/generate-audit-event');
const SQSServiceShared = require('../../../sharedLib/aws/sqs-service');
const DupEmailNotificationService = require('./generate-dup-email-notification')

const EventName = 'ProcessDCFFileService'
const SUCCESS = 'Success'
const FAILURE = 'Failure'
let instance = null;

class ProcessDCFFileService {
    
    static getInstance() {
        if (!instance) {
            instance = new ProcessDCFFileService();
        }
        return instance;
    }

    async processDCFFile(transID, bucketName, fullFileName, fileName, LOBDirectory, lineOfBuss, targetQueueQRL, postgresSQLService, pool) {
        try {
            const fileDupChkService = FileDuplicateCheckService.getInstance();
            let isDuplicateFile = await fileDupChkService.fileDuplicateCheck(transID, fileName, lineOfBuss, postgresSQLService, pool)
            console.log(`${transID},processDCFFile,isDuplicateFile: ${isDuplicateFile}`);
            if ( ! isDuplicateFile ) {
                let s3CopyObjService = S3Service.getInstance();
                let dcfMsgData = await s3CopyObjService.copyObj(transID, bucketName, fullFileName, LOBDirectory, lineOfBuss)
                if ( dcfMsgData ) {
                    console.log(`${EventName},${transID},processDCFFile,copyObj response: ${JSON.stringify(dcfMsgData)}`)
                    const insertQuery = await BuildInsertQueryService.getInstance().buildInsertQuery(transID, fileName, lineOfBuss)
                    if ( insertQuery ) {
                        const resStatus = await postgresSQLService.insertData (transID, insertQuery, pool)
                        console.log(`${EventName},${transID},processDCFFile,resStatus: ${resStatus}`);
                        if ( resStatus === SUCCESS ) {
                            let msgResponseStatus = await _processResponse(transID, dcfMsgData, targetQueueQRL, resStatus)
                            return msgResponseStatus
                        } else {
                            throw new Error('processDCFFile, insertData Failed');
                        }
                    } else {
                        console.log(`${EventName},${transID},processDCFFile, insertQuery Failed`)
                        return FAILURE
                    }
                } else {
                    let msgResponseStatus = await _processResponse(transID, dcfMsgData, targetQueueQRL, FAILURE)
                    return msgResponseStatus
                }
            } else {
                console.log(`${EventName},${transID},processDCFFile,${fileName} file is duplicate file.`)
                const notifyStatus = await DupEmailNotificationService.getInstance().sendDupEmailNotification(transID, fileName)
                console.log(`${EventName},${transID},processDCFFile,notifyStatus: ${notifyStatus} `)
                return notifyStatus
            }
        } catch(err) {
            console.error(`${EventName},${transID},processDCFFile,ERROR in catch: ${err.stack}`);
        }
    }
}

async function _processResponse (transID, response, targetQueueQRL, status) {
    try {
        let reqEnvAuditData = {
            auditqueueurl: process.env.audit_queue_url
        }
        if ( status === SUCCESS ) {
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(transID, response, targetQueueQRL);
            if (sendMsgRes) {
                reqEnvAuditData.auditeventdata = process.env.success_audit_event
                console.log(`${EventName},${transID},_processResponse,sendMsgRes response: ${JSON.stringify(sendMsgRes)} reqEnvAuditData: ${JSON.stringify(reqEnvAuditData)}`)
                let generateAuditEvent = await GenerateAuditEventService.getInstance().generateAuditEvent(transID, reqEnvAuditData)
                console.log(`${EventName},${transID},_processResponse,generateAuditEvent response: ${generateAuditEvent}`)
                return SUCCESS
            } else {
                reqEnvAuditData.auditeventdata = process.env.failure_audit_event
                console.log(`${EventName},${transID},_processResponse,sendMsgRes Data: ${JSON.stringify(sendMsgRes)} reqEnvAuditData: ${JSON.stringify(reqEnvAuditData)}`)
                let generateAuditEvent = await GenerateAuditEventService.getInstance().generateAuditEvent(transID, reqEnvAuditData)
                console.log(`${EventName},${transID},_processResponse,generateAuditEvent response: ${generateAuditEvent}`)
                throw Error(`SqsService,Failed to sendMessage to Queue ${targetQueueQRL}`);
            }
        } else {
            reqEnvAuditData.auditeventdata = process.env.failure_audit_event
            console.log(`${EventName},${transID},_processResponse,status: ${status} reqEnvAuditData: ${JSON.stringify(reqEnvAuditData)}`)
            let generateAuditEvent = await GenerateAuditEventService.getInstance().generateAuditEvent(transID, reqEnvAuditData)
            console.log(`${EventName},${transID},_processResponse,generateAuditEvent response: ${generateAuditEvent}`)
            return FAILURE
        }
    } catch(err) {
        console.error(`${transID},fileDuplicateCheck,ERROR in catch: ${err.stack}`);
        throw Error(`${EventName},${transID},_processResponse,Failed to Build Insert Query.}`);
    }
}

module.exports = ProcessDCFFileService;