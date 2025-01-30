export default TezosExplorer;
declare class TezosExplorer extends Explorer {
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    sendTransaction(rawtx: any): Promise<any>;
}
import Explorer from '../../explorers/explorer.js';
