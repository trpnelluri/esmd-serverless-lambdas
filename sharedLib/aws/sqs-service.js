'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' })
const IdServiceShared = require('../common/id-service')

//const EventName = 'SQS_SERVICE'
const messageGroupId = 'esMD-OB-FILE-VALIDATION'
let sqs = new AWS.SQS({ apiVersion: '2012-11-05' })

let instance = null;

class SqsService{
    static getInstance()
    {
        if(!instance){
            instance = new SqsService();
        }
        return instance;
    }
    
    async sendMessage(transID, msgBody, targetQueueQRL) {
        try {
            const messageDeduplicationId = IdServiceShared.getInstance().getId();
            console.log(`${transID},sendMessage,targetQueueQRL ${targetQueueQRL} msgBody: ${JSON.stringify(msgBody)}  new messageDeduplicationId: ${messageDeduplicationId}`)
            const sendMsgParams = {
                MessageBody: JSON.stringify(msgBody),
                QueueUrl: targetQueueQRL,
                MessageGroupId: messageGroupId,
                MessageDeduplicationId: messageDeduplicationId,
            }
            console.log(`${transID},sendMessage,sendMsgParams: ${JSON.stringify(sendMsgParams)}`)
            const messageAcknowledge = await sqs.sendMessage(sendMsgParams).promise();
            console.log(`${transID},sendMessage,messageAcknowledge: ${JSON.stringify(messageAcknowledge)}`)
            return messageAcknowledge;
        } catch (err) {
            console.error(`${transID},sendMessage,ERROR in sendMessage catch ${JSON.stringify(err.stack)} `)
            throw new Error(`SqsService,Failed to sendMessage to Queue ${targetQueueQRL}, Error: ${JSON.stringify(err)}`);
        }
    }
}

module.exports = SqsService;