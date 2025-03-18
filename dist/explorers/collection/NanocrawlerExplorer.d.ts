export default NanocrawlerExplorer;
declare class NanocrawlerExplorer extends Explorer {
    modifyInfoResponse(response: any): {
        balance: any;
        account_state: any;
    };
    getTransactionUrl(txId: any): string;
    requestedTxId: any;
    modifyTransactionResponse(tx: any): import("../Transaction.js").default;
    getTransactionsUrl(address: any): string;
    getPendingTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset?: number, limit?: any): {};
    getTransactions(address: any, offset?: number, limit?: any): Promise<import("../Transaction.js").default[]>;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): number;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    getSendTransactionParams(rawtx: any): {
        transactions: any[];
    };
    modifySendTransactionResponse(response: any): {
        txid: any;
    };
}
import Explorer from '../../explorers/explorer.js';
