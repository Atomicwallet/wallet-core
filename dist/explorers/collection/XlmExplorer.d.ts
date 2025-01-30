export default XlmExplorer;
/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
declare class XlmExplorer extends Explorer {
    constructor(...args: any[]);
    server: Server;
    defaultTxLimit: number;
    fee: any;
    getTransaction(selfAddress: any, txId: any): Promise<import("../Transaction.js").default | import("stellar-sdk").ServerApi.TransactionRecord | undefined>;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any): {
        account: any;
        limit: number;
    };
    getTransactionUrl(txId: any): string;
    getTransactionParams(txId: any): {};
    /**
     * Gets the trasaction amount.
     *
     * @param {Object} tx The trasaction
     * @return {string} The trasaction amount.
     */
    getTxValue(selfAddress: any, tx: Object): string;
    getTxMemo(tx: any): any;
    /**
     * Sends a transaction.
     *
     * @param {Object} txObject The tx object
     * @return {Promise<Object>} The transaction data
     */
    sendTransaction(txObject: Object, senderAddress: any, privateKey: any, fee: any): Promise<Object>;
    /**
     * Gets a balance from a wallet info.
     *
     * @return {Promise<String>}
     */
    getBalance(address: any): Promise<string>;
    parseCreateAccountOperation(currentLedgerVersion: any, tx: any, operation: any, selfAddress: any): {
        addressFrom: any;
        addressTo: any;
        isIncoming: boolean;
        confirmations: number;
        blockhash: any;
        timestamp: number;
        amount: string;
        txid: any;
        fee: any;
        memo: any;
    };
    parsePaymentOperation(currentLedgerVersion: any, tx: any, operation: any, selfAddress: any): {
        addressFrom: any;
        addressTo: any;
        isIncoming: boolean;
        confirmations: number;
        blockhash: any;
        timestamp: number;
        amount: string;
        txid: any;
        fee: any;
        memo: any;
    };
    /**
     * get last transaction list
     * limit - 999
     * minLedgerVersion get from server
     * @return {Promise<void>}
     */
    getTransactions({ address, offset, limit }: {
        address: any;
        offset?: number | undefined;
        limit?: number | undefined;
    }): Promise<void>;
    /**
     * Loads account from server.
     *
     * @return {Promise<any>}
     */
    loadAccount(address: any): Promise<any>;
    /**
     * Gets trasnaction fee
     *
     * @return {Promise<BN>}
     */
    getFee(): Promise<BN>;
    /**
     * Return last ledger version
     *
     * @return {Promise<number>}
     */
    getCurrentLedger(): Promise<number>;
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
import { Server } from 'stellar-sdk';
