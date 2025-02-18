export default TzindexExplorer;
declare class TzindexExplorer extends Explorer {
    getTransactionsUrl(address: any): string;
    getTransactionUrl(txid: any): string;
    /**
     * Get transaction list params
     *
     * @return {Object}
     */
    getTransactionsParams(address: any, offset?: number, limit?: any): Object;
    /**
     * Modify transaction list response
     *
     * @param {Object[]} txs
     */
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): string;
    getTransaction(selfAddress: any, txid: any): Promise<import("../Transaction.js").default>;
    getTransactions({ address }: {
        address: any;
    }): Promise<any[]>;
}
import Explorer from '../../explorers/explorer.js';
