export default EthplorerExplorer;
/**
 * Class for explorer.
 *
 * @abstract
 * @class {Explorer}
 */
declare class EthplorerExplorer extends Explorer {
    /**
     * Gets the balance.
     *
     * @return {string}
     */
    getBalance(): string;
    getInfo(address: any): Promise<{
        balance: any;
        transactions: never[];
    } | {
        balance: any;
    }>;
    getInfoParams(address: any): {
        data: any;
        apiKey: string | undefined;
        page: string;
    };
    modifyInfoResponse(response: any): {
        balance: any;
        transactions: never[];
    };
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any, offset: any, limit: any): {
        data: any;
        apiKey: string | undefined;
        page: string;
    };
    modifyTransactionsResponse(response: any): any;
    /**
     * Modify transaction response
     *
     * @param {Object} response
     * @return {Transaction}
     */
    modifyTokenTransactionResponse(tx: any, token: any, address: any): Transaction;
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    getTxDirection(selfAddress: any, tx: any): boolean;
    getTxOtherSideAddress(selfAddress: any, tx: any): any;
    getTxValue(selfAddress: any, tx: any): any;
    /**
     * Returns user token list url
     * @returns {String}
     */
    getUserTokenListUrl(address: any): string;
    modifyTokenListResponse(response: any): any;
    /**
     * Returns all token list data
     * @returns {Array}
     */
    getTokenList(): any[];
    /**
     * Returns user token list data
     * @param {String} address
     * @returns {Array}
     */
    getUserTokenList(address: string): any[];
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
