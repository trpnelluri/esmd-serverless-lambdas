'use strict'

const PostgresDBService = require('../db/postgre-sql-pool');
const EventName = 'GET_AVAILABLE_DATA_FROM_DB'

let instance = null;

class GetReqDataFromDBService {

    static getInstance() {
        if (!instance) {
            instance = new GetReqDataFromDBService();
        }
        return instance;
    }
    
    async getReqDataFromDB(requiredEnvData){

        return new Promise((resolve, reject) => {
            const sqlToGetRequiredInfo = requiredEnvData.refsql
            console.log(`getReqDataFromDB,sqlToGetRequiredInfo: ${sqlToGetRequiredInfo}`)
            let postgresDBService = PostgresDBService.getInstance()
            postgresDBService.getRequiredRefData(sqlToGetRequiredInfo, (err, isDataAvailable, data) => {
                console.log( `getReqDataFromDB,isDataAvailable: ${isDataAvailable}`);
                if (err) {
                    console.error(`getReqDataFromDB,ERROR: getReqDataFromDB: ${err.stack}`);
                } else {
                    resolve(data)
                }
            });
        }).catch((error) => {
            console.error(`getReqDataFromDB,ERROR catch: ${error}` )
            throw new Error(`getReqDataFromDB,Error getting the required data from database ${error.stack}`);
        });
    }

}

module.exports = GetReqDataFromDBService;