export default InsightExplorer;
declare class InsightExplorer extends Explorer {
    constructor(...args: any[]);
    /**
     * hook for bitcoin cash address
     * @return {string}
     */
    getWalletAddress(address: any): string;
    getApiPrefix(): "insight-api/" | "api/YEC/mainnet/" | "insight-api-komodo/" | "api/";
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getTransactionUrl(txId: any): string;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: any, limit: any, pageNum: any): {
        pageNum: any;
    };
    modifyTransactionsResponse(response: any, address: any): Transaction[] | Promise<any[]>;
    getUnspentOutputsParams(): {
        unspent: boolean;
        limit: number;
    } | {
        unspent?: undefined;
        limit?: undefined;
    };
    modifyUnspentOutputsResponse(selfAddress: any, response: any): any;
    modifyUnspentAddress(address: any): any;
    getSendTransactionParam(): "rawTx" | "rawtx";
    sendTransaction(rawtx: any): Promise<any>;
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
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
