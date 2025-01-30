export default EtherscanExplorer;
/**
 * Class for explorer.
 *
 * @abstract
 * @class {EtherscanExplorer}
 */
declare class EtherscanExplorer extends Explorer {
    modifyGeneralResponse(response: any): any;
    getTransactionsUrl(address: any): string;
    getTransactionsParams(address: any): {
        module: string;
        action: any;
        address: any;
        startblock: number;
        endblock: number;
        sort: string;
    };
    modifyTransactionsResponse(response: any, address: any): import("../Transaction.js").default[];
    /**
     * Sends a transaction.
     *
     * @param {String} rawtx The rawtx
     * @return {Promise<Object>} The transaaction data
     */
    sendTransaction(rawtx: string): Promise<Object>;
    getTxHash(tx: any): any;
    getTxDateTime(tx: any): Date;
    getTxConfirmations(tx: any): number;
    /**
     * Gets the transaction direction.
     *
     * @param {string} selfAddress - Wallet address.
     * @param {object} tx - The transaction.
     * @return {boolean} The transaction direction.
     */
    getTxDirection(selfAddress: string, tx: object): boolean;
    /**
     * @param tx
     * @return {string}
     */
    getTxOtherSideAddress(selfAddress: any, tx: any): string;
    /**
     * @param tx
     * @return {string}
     */
    getTxValue(selfAddress: any, tx: any): string;
    getTxFee(tx: any): number | null;
    /**
     * @typedef TokenTransaction
     * @type {object}
     * @property {string} contract - Token contract.
     * @property {string} alias
     * @property {string} explorer
     * @property {string} txid
     * @property {boolean} direction
     * @property {string} otherSideAddress
     * @property {string} value
     * @property {Date} datetime
     * @property {string} memo
     * @property {number} confirmations
     */
    /**
     * Get a token's transaction list for a wallet
     *
     * @return {Promise<{tokenTransactions: TokenTransaction[]}>}
     */
    getTokensTransactions({ address, offset, limit, pageNum }: {
        address: any;
        offset: any;
        limit: any;
        pageNum: any;
    }): Promise<{
        tokenTransactions: {
            /**
             * - Token contract.
             */
            contract: string;
            alias: string;
            explorer: string;
            txid: string;
            direction: boolean;
            otherSideAddress: string;
            value: string;
            datetime: Date;
            memo: string;
            confirmations: number;
        }[];
    }>;
    getTokensTransactionsParams(address: any): {
        module: string;
        action: any;
        address: any;
        startblock: number;
        endblock: number;
        sort: string;
    };
    /**
     * Modifies response to get token transactions
     *
     * @param {object} response
     * @param {string} selfAddress - Wallet address.
     * @returns {{tokenTransactions: TokenTransaction[]}}
     */
    modifyTokenTransactionsResponse(response: object, selfAddress: string): {
        tokenTransactions: {
            /**
             * - Token contract.
             */
            contract: string;
            alias: string;
            explorer: string;
            txid: string;
            direction: boolean;
            otherSideAddress: string;
            value: string;
            datetime: Date;
            memo: string;
            confirmations: number;
        }[];
    };
    #private;
}
import Explorer from '../../explorers/explorer.js';
