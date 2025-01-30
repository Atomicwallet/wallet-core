export default VergeNodeExplorer;
declare class VergeNodeExplorer extends Explorer {
    getSendTransactionUrl(): any;
    getSendTransactionParams(rawtx: any): {
        method: string;
        params: any[];
    };
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
}
import Explorer from '../../explorers/explorer.js';
