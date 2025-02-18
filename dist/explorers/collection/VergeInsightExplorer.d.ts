export default VergeInsightExplorer;
declare class VergeInsightExplorer extends Explorer {
    constructor(...args: any[]);
    modifyInfoResponse(response: any): {
        balance: any;
    };
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: any, limit: any, pageNum: any): {
        pageNum: any;
    };
    modifyTransactionsResponse(response: any, transactions: any, selfAddress: any): any;
    getUnspentOutputsParams(): {
        unspent: boolean;
    };
    modifyUnspentOutputsResponse(selfAddress: any, response: any): any;
    /**
     * Gets the transaction amount.
     *
     * @param {Object} tx The transaction
     * @return {Number} The transaction amount.
     */
    getTxValue(selfAddress: any, tx: Object, direction: any): number;
    /**
     * Gets the transaction recipient.
     *
     * @param {Object} tx The transaction response.
     * @return {(Boolean|String)} The transaction recipient.
     */
    getTxOtherSideAddress(selfAddress: any, tx: Object, direction: any): (boolean | string);
    /**
     * Calculates the balance.
     *
     * @param {Object[]} utxos The utxos
     * @return {BN} The balance.
     */
    calculateBalance(utxos?: Object[]): BN;
    /**
     * Modify transaction response
     *
     * @param {Object} tx
     * @return {Transaction}
     */
    modifyTransactionResponse(tx: Object, selfAddress: any): Transaction;
    getTxFee(tx: any): any;
    getTxConfirmations(tx: any): any;
    getTxHash(tx: any): any;
    getTransactionCoins(txid: any): Promise<object>;
    getTransaction(txid: any): Promise<object>;
    getTransactions({ address, offset, limit, pageNum }: {
        address: any;
        offset?: number | undefined;
        limit?: any;
        pageNum: any;
    }): Promise<Transaction[]>;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
