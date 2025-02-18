export default FtmExplorer;
/**
 * Class FtmExplorer
 *
 */
declare class FtmExplorer extends Explorer {
    constructor({ wallet, config }: {
        wallet: any;
        config: any;
    });
    baseUrl: string;
    ticker: any;
    /** @typedef GetTransactionParamsResponse
     * @type {object}
     * @property {'account'} module
     * @property {'txlist'} action
     * @property {string} address - Wallet address.
     * @property {string} page - Page number.
     * @property {string} offset - Used here as Items limit on page.
     * @property {'asc'|'desc'} sort - Sort order.
     **/
    /**
     * Gets transaction list params
     *
     * @param {string} address - Wallet address.
     * @param {number} [offset] - Not used here.
     * @param {number} [limit] - Items limit on page.
     * @param {number} [pageNum=1] - Page number.
     * @return {GetTransactionParamsResponse} - Here offset used as a limit.
     */
    getTransactionsParams(address: string, offset?: number, limit?: number, pageNum?: number): {
        module: "account";
        action: "txlist";
        /**
         * - Wallet address.
         */
        address: string;
        /**
         * - Page number.
         */
        page: string;
        /**
         * - Used here as Items limit on page.
         */
        offset: string;
        /**
         * - Sort order.
         */
        sort: "asc" | "desc";
    };
    /**
     * Gets transaction url
     *
     * @param {string} address  - Wallet address.
     * @returns {string}
     */
    getTransactionsUrl(address: string): string;
    /**
     * @typedef ParsedRawTransactionObject
     * @type object
     * @property {string} timeStamp
     * @property {string} hash
     * @property {string} from
     * @property {string} to
     * @property {string} value
     * @property {string} gas
     * @property {string} gasPrice
     * @property {boolean} isError
     * @property {string} cumulativeGasUsed
     * @property {string} gasUsed
     * @property {string} confirmations
     */
    /**
     * Creates transactions from parsed transactions for wallet address
     *
     * @param {object} response
     * @param {ParsedRawTransactionObject[] | string} response.result - Parsed transactions - array or Error message .
     * @param {string} selfAddress - Coin Address.
     * @param {string} [asset='FTM'] - Basically it's a coin ticker.
     * @returns {Transaction[]}
     */
    modifyTransactionsResponse(response: {
        result: {
            hash: string;
            from: string;
            to: string;
            value: string;
            gas: string;
            gasPrice: string;
            isError: boolean;
            cumulativeGasUsed: string;
            gasUsed: string;
            confirmations: string;
        }[] | string;
    }, selfAddress: string, asset?: string): Transaction[];
    /**
     * Gets the transaction direction.
     *
     * @param {object} tx - The transaction response.
     * @return {boolean} - True if we accept transaction.
     */
    getTxDirection(selfAddress: any, tx: object): boolean;
    /**
     * Gets the transaction datetime.
     *
     * @param {object} tx - The transaction response.
     * @return {Date}
     */
    getTxDateTime(tx: object): Date;
    /**
     * Gets the transaction fee.
     *
     * @param {ParsedRawTransactionObject} tx
     * @return {string}
     */
    getTxFee(tx: {
        hash: string;
        from: string;
        to: string;
        value: string;
        gas: string;
        gasPrice: string;
        isError: boolean;
        cumulativeGasUsed: string;
        gasUsed: string;
        confirmations: string;
    }): string;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
