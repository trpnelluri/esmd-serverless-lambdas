'use strict'

const SQSServiceShared = require('../../../sharedLib/aws/sqs-service');

const EventName = 'DupEmailNotificationService'
const SUCCESS = 'Success'
const FAILURE = 'Failure'

let instance = null;

const notification_SQS_url = process.env.notification_queue_url

class DupEmailNotificationService {

    static getInstance()
    {
        if(!instance){
            instance = new DupEmailNotificationService();
        }
        return instance;
    }

    async sendDupEmailNotification ( transID, fileName ) {

        try {
            const notificationType = process.env.dup_pcg_notification.toUpperCase()

            let notificationObj = new Object;
            let emailPlaceHolderArray = [];
            let files = new Object
            notificationObj.guid = transID
            notificationObj.request_type = 'OUTBOUND'
            notificationObj.email_alert_notification_type = notificationType
            notificationObj.environment_type = process.env.environment
            notificationObj.submission_timestamp = new Date();
            files.key = 'fileName'
            files.value = fileName
            emailPlaceHolderArray.push(files)
            notificationObj.email_place_holder_list = emailPlaceHolderArray
            
            console.log(`${EventName},${transID},sendDupEmailNotification,notificationObj : ${JSON.stringify(notificationObj)}`)
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(transID, notificationObj, notification_SQS_url);
            console.log(`${EventName},${transID},sendDupEmailNotification,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)

            if ( sendMsgRes ) {
                return SUCCESS
            } else {
                return FAILURE
            }

        } catch (err) {
            console.error(`${EventName},${transID},sendDupEmailNotification,ERROR catch: ${err.stack}`)
        }
    }

}

module.exports = DupEmailNotificationService;