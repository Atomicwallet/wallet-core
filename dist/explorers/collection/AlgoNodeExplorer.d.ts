export default AlgoNodeExplorer;
declare class AlgoNodeExplorer extends Explorer {
    getSendTransactionParams(rawtx: any): any;
    getSendOptions(): {
        headers: {
            'Content-Type': string;
        };
    };
    getTxFee(tx: any): any;
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
}
import Explorer from '../../explorers/explorer.js';
