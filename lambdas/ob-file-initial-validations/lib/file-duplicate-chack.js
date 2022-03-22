'use strict';

let instance = null;

class FileDuplicateCheckService {
    
    static getInstance() {
        if (!instance) {
            instance = new FileDuplicateCheckService();
        }
        return instance;
    }

    async fileDuplicateCheck(transID, fileName, lineOfBuss, postgresSQLService, pool) {

        try {
            console.log(`${transID},fileDuplicateCheck,is invoked for fileName:${fileName}`);
            const queryToChkDuplicate = process.env.ref_sql_for_file_dup_chk
            let valuesToReplace = [fileName, lineOfBuss]
            let isDuplicateFile = await postgresSQLService.fileAlreadyExist (transID, queryToChkDuplicate, valuesToReplace, pool)
            console.log(`${transID},fileDuplicateCheck,isDuplicateFile: ${isDuplicateFile}`);
            return isDuplicateFile
        } catch(err) {
            console.error(`${transID},fileDuplicateCheck,ERROR in catch: ${err.stack}`);
        }
    }
}

module.exports = FileDuplicateCheckService;