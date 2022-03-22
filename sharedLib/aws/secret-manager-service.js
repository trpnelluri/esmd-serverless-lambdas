'use strict';

const aws = require('aws-sdk');
//const NodeCache = require('node-cache');
//const SecretKeyCache = new NodeCache();
//Use this region config when it doesn't work in your local(from SAM it works with out this)
const client = new aws.SecretsManager({
    region: process.env.AWS_REGION || 'us-east-1'
});

let instance = null;

class SecretManagerService {

    static getInstance() {
        if (!instance) {
            instance = new SecretManagerService();
        }
        return instance;
    }

    /**
     * This method will return Object with key and value of secret saved in secret manager. It takes secret name as paramer
     * @param secretName
     * @returns {Promise<string>}
     */
    async getSecretValue(params) {
        try {
            console.log(`secretName ${JSON.stringify(params)}`);
            const res = await client.getSecretValue(params).promise()
            console.log('res', res);
            return res.SecretString;
        } catch (err) {
            console.log('An error occurred during secret retrieval ', err.code);
            throw err;
        }
    }

}

module.exports = SecretManagerService;