'use strict';

const PostgresSQLService = require('../../../sharedLib/db/postgre-sql-service');
let instance = null;

class FileDuplicateCheckService {
    static getInstance() {
        if (!instance) {
            instance = new FileDuplicateCheckService();
        }
        return instance;
    }

    async fileDuplicateCheck(transID, fileName, pool) {
        try {
            console.log(`${transID},-,fileDuplicateCheck,is invoked for fileName:${fileName}`);
            const queryToChkDuplicate = process.env.ref_sql_for_file_dup_chk
            let valuesToReplace = [fileName, '1']
            let postgresSQLService = PostgresSQLService.getInstance();
            let isDuplicateFile = await postgresSQLService.fileAlreadyExist (transID, queryToChkDuplicate, valuesToReplace, pool)
            //let isDuplicateFile = postgresSQLService.fileAlreadyExist (transID, queryToChkDuplicate, valuesToReplace, pool)
            console.log(`${transID},-,fileDuplicateCheck, isDuplicateFile: ${isDuplicateFile}`);

            if ( isDuplicateFile ) {
                //TBD AUDIT Event and Email Notification
                return isDuplicateFile
            } else {
                return isDuplicateFile
            }
           
        } catch(err) {
            console.error(`${transID},-,fileDuplicateCheck,ERROR in catch: ${err.stack}`);
        }
    }
}

module.exports = FileDuplicateCheckService;