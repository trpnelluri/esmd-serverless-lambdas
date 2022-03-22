'use strict';

const PostgresPoolService = require('../../sharedLib/db/postgre-pool-service');
const PostgresSQLService = require('../../sharedLib/db/postgre-sql-service');
const FileSizeValidationService = require('./lib/file-size-validation');
const FileDuplicateCheckService = require('./lib/file-duplicate-chack');

class FileValidationService {

    static getInstance() {
        if (!instance) {
            instance = new FileValidationService();
        }
        return instance;
    }

    async processFileValidation () {
        
    }
}

module.exports = FileValidationService;