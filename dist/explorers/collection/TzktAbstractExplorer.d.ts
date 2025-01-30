export default TzktAbstractExplorer;
declare class TzktAbstractExplorer extends Explorer {
    /**
     * Modify transaction list response
     *
     * @param {Object[]} txs
     */
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    getTxConfirmations(tx: any): 0 | 1;
    getTxHash(tx: any): any;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): string;
    getTransaction(selfAddress: any, txid: any): Promise<import("../Transaction.js").default>;
    getTransactions({ address, pageNum, limit }: {
        address: any;
        pageNum: any;
        limit?: any;
    }): Promise<import("../Transaction.js").default[]>;
    getTxFee(): any;
}
import Explorer from '../../explorers/explorer.js';
