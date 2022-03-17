let instance = null;

const DCF = 'LDCF'
const ICDT = 'L15'
const EMDRPREPAY = 'L1_5'
const EMDRPOSTPAY = 'L1_6'

class LOBClassificationService {

    static getInstance() {
        if (!instance) {
            instance = new LOBClassificationService();
        }
        return instance;
    }
    async classifyLOB(transID, fileName ) {
        console.log(`${transID},-,classifyLOB,is invoked for fileName:${fileName}`);
        
        
    }
}

module.exports = FileSizeValidationService;