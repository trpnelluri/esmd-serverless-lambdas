'use strict'

let instance = null;

/*
The following function is used to establish the connection to the postgreSQL database from Audit worker and the connection details will
from AWS Secrect Manager serveice.
*/

class PostgresSQLService {

    static getInstance() {
        if (!instance) {
            instance = new PostgresSQLService();
        }
        return instance;
    }

    async getGUID (queryToGenGUID, pool) {
        try {
            let client = await pool.connect();
            console.log(`-,-,getGUID,pool connected successfully queryToGenGUID: ${queryToGenGUID}`);
            let response = await client.query(queryToGenGUID);
            client.release();
            return response.rows;
        } catch (err) {
            console.log(`getGUID,ERROR in catch ${err.stack}`)
        }
    }

    async fileAlreadyExist (transID, text, valuesToReplace, pool) {
        try {
            let fileAvailableFlag = false
            let client = await pool.connect();
            console.log(`${transID},-,fileAlreadyExist,query to execute: ${text} valuesToReplace: ${valuesToReplace} pool connected Successfully`);
            let response = await client.query(text,valuesToReplace);
            console.log(`${transID},-,fileAlreadyExist, response: ${JSON.stringify(response.rows[0])}`);
            client.release();
            if ( response.rows[0].trans_count > 0 ) {
                fileAvailableFlag = true
                console.log(`${transID},-,fileAlreadyExist,fileAvailableFlag: ${fileAvailableFlag}`);
            }
            return fileAvailableFlag
        } catch (err) {
            console.log(`${transID},-,fileAlreadyExist,ERROR in catch ${err.stack}`)
        }
    }
    
}

module.exports = PostgresSQLService;
