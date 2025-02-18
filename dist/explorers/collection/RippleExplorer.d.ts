export default RippleExplorer;
/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
declare class RippleExplorer extends Explorer {
    constructor(...args: any[]);
    requestId: number;
    getInitParams(): {
        baseURL: any;
        headers: {
            'Content-Type': string;
        };
        credentials: boolean;
    };
    checkStatusTransaction(txId: any): Promise<any>;
    getInfoParams(address: any): {
        account: any;
    };
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
        sequence: any;
    };
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any): {
        account: any;
        limit: number;
    };
    modifyTransactionsResponse(response: any, address: any): any;
    currentLedgerVersion: any;
    getTransactionUrl(txId: any): string;
    getTransactionParams(txId: any): {
        transaction: any;
        binary: boolean;
    };
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxMemo(tx: any): any;
    getTxConfirmations(tx: any): number;
    /**
     * Sends a transaction.
     *
     * @param {String} rawtx The rawtx
     * @return {Promise<Object>} The transaction data
     */
    sendTransaction(rawtx: string): Promise<Object>;
    /**
     * Gets trasnaction fee
     *
     * @return {Promise<void>}
     */
    getFee(): Promise<void>;
    /**
     * Return last ledger version
     *
     * @return {Promise<number>}
     */
    getCurrentLedger(): Promise<number>;
    /**
     *
     * @return {Promise<number>}
     */
    getServerInfo(): Promise<number>;
    /**
     * The request to the explorer
     *
     * @param {String} url Url
     * @param {String} method The method
     * @param {Object} data The data
     * @param {String} type Request type
     * @return {Promise}
     */
    request(url: string, method: string, data?: Object, type?: string): Promise<any>;
    getTxFee(tx: any): any;
}
import Explorer from '../../explorers/explorer.js';
