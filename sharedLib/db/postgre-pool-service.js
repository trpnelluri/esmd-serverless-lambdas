'use strict'

const { Pool } = require('pg');
const SecretManagerService = require('../aws/secret-manager-service');

let instance = null;

class PostgresPoolService {

    static getInstance() {
        if (!instance) {
            instance = new PostgresPoolService();
        }
        return instance;
    }

    async connectToPostgresDB () {

        console.log(`connectToPostgresDB,process.env.SM_PGS_DB_AUTH: ${process.env.SM_PGS_DB_AUTH}`)
    
        try{
            const params = {
                SecretId: process.env.SM_PGS_DB_AUTH,
            };
            let secretManagerService = SecretManagerService.getInstance();
            const resScrectManger = await secretManagerService.getSecretValue(params)
            const dbConnDetails = JSON.parse(resScrectManger)
            const connTimeout = process.env.pgs_conn_time_out;
            const idleTimeout = process.env.pgs_idle_time_out;
            
            console.log(`dbConnDetails: ${JSON.stringify(dbConnDetails)} connTimeout: ${connTimeout} idleTimeout: ${idleTimeout}`)
    
            let pool = new Pool({
                user: dbConnDetails.username,
                host: dbConnDetails.host,
                database: dbConnDetails.dbname,
                password: dbConnDetails.password,
                port: dbConnDetails.port,
                idleTimeoutMillis: idleTimeout, // 30 sec
                connectionTimeoutMillis: connTimeout, // 5 sec
                max: 10
            });
    
            return pool;
    
        } catch(err) {
            console.error(`connectToPostgresDB,ERROR: ${err.stack}`);
            throw new Error(`connectToPostgresDB,Error getting pool ${err.stack}`);
        }
    }
}

module.exports = PostgresPoolService;
