'use strict';

let instance = null;
const EventName = 'BuildInsertQueryService'

class BuildInsertQueryService {
    
    static getInstance() {
        if (!instance) {
            instance = new BuildInsertQueryService();
        }
        return instance;
    }

    async buildInsertQuery(transID, fileName, lineOfBuss) {

        try {
            console.log(`${EventName},${transID},buildInsertQuery,is invoked for fileName:${fileName}`);
            let colDataObj = new Object;
            colDataObj.glbl_uniq_id = transID
            colDataObj.pkg_name_title_txt = fileName
            colDataObj.pgm_line_of_busns_id = lineOfBuss
            const tableName = process.env.dcf_rec_insert_tbl_name
            const columns = process.env.dcf_rec_insert_cols
            const columnsObj = columns.split(',');
            console.log(`${EventName},${transID},buildInsertQuery,columnsObj: ${columnsObj.length}`);
            let values = '';
            let dbColumnNames = '';
            columnsObj.forEach((element) => {
                console.log(`buildInsertQuery,columnsObj element: ${element}`);
                const dbAttribute = element.trim();
                const dbAttrArray = dbAttribute.split('^');
                if (dbColumnNames !== '') {
                    dbColumnNames += ', ';
                }
                dbColumnNames += dbAttrArray[0];
                if (values !== '') {
                    values += ', ';
                }
                // This Condition is for Formula columns
                // nextval('esmd_data.seq_actn_audt_log_id')~formula
                if (dbAttrArray[1].indexOf('~') > -1) {
                    const valuesArry = dbAttrArray[1].split('~');
                    values += `${valuesArry[0]}`;
                } else {
                    let attributeName = dbAttrArray[1]
                    if ( colDataObj[attributeName] !== undefined ) {
                        values += `'${colDataObj[attributeName]}'`;
                    } else {
                        values += `'${attributeName}'`;
                    }
                }

            });

            console.log(`buildInsertQuary,dbColumnNames: ${dbColumnNames} values: ${values}`);
            const insertQuery = `INSERT INTO ${tableName}(${dbColumnNames}) VALUES(${values})`;
            console.log(`buildInsertQuary,insertQuery: ${insertQuery}`);
            return insertQuery

        } catch(err) {
            console.error(`${EventName},${transID},buildInsertQuery,ERROR in catch: ${err.stack}`);
        }
    }
}

module.exports = BuildInsertQueryService;