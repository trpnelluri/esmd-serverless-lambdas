'use strict'

/**
 *  This is an esMD postgreSQL connection service to insert the data into appropriate tables in postgre-sql database.
 * 
 *  @author Siva Nelluri
 *	@date 03/15/2021
 *	@version 1.0.0
 * 
*/

const { Pool } = require('pg');
const SecretManagerService = require('../aws/secret-manager-service');

let count = 0;
const EventName = 'POSTGRES_DB_SERVICE'
const SUCCESS = 'Success'
const FAILURE = 'Failure'
let instance = null;

/*
The following function is used to establish the connection to the postgreSQL database from Audit worker and the connection details will
from AWS Secrect Manager serveice.
*/

class PostgresDBService {

    static getInstance() {
        if (!instance) {
            instance = new PostgresDBService();
        }
        return instance;
    }

    async getRequiredRefData (query, callback) {
        console.log(`getRequiredRefData,Query to execute: ${query}`);
        try {
            let pool = await _connectToPostgresDB ()
            const client = await pool.connect();
            let rowsFound = false;
            client.query(query, (err, res) => {
                if (err) {
                    console.error(`getRequiredRefData,Error getting ref data: ${err.stack}`);
                    callback(err, 0, null);
                } else {
                    console.info(`getRequiredRefData,res result to send: ${JSON.stringify(res)} res.rowCount: ${res.rowCount}`);
                    client.release();
                    count -= 1;
                    console.debug(`getRequiredRefData,client connections count: ${count}`);
                    if ( res.rowCount > 0 ) {
                        rowsFound = true
                    }
                    callback(null, rowsFound, res.rows)
                }
            });
    
        } catch(error) {
            console.error(`getRequiredRefData,Catch block error: ${error.stack}`);
            callback(error, 0);
        }
    }
}

async function _connectToPostgresDB () {

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
            max: 1,
            min: 0
        });

        return pool;

    } catch(err) {
        console.error(`connectToPostgresDB,ERROR: ${err.stack}`);
    }
}

module.exports = PostgresDBService;
