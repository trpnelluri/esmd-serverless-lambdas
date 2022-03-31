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
            const queryToChkDuplicate = process.env.REF_SQL_FOR_FILE_DUP_CHK
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