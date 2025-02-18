export default DgbInsightExplorer;
declare class DgbInsightExplorer extends Explorer {
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    modifyUnspentOutputsResponse(response: any): any;
    sendTransaction(rawtx: any): Promise<any>;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    calculateBalance(utxos?: any[]): any;
}
import Explorer from '../../explorers/explorer.js';
