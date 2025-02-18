export default NearblocksExplorer;
declare class NearblocksExplorer extends Explorer {
    constructor(...args: any[]);
    defaultTxLimit: number;
    getTxLimit(): number;
    /**
     * @returns {string} An url one can use to return list of transactions by given address.
     */
    getTransactionsUrl(address: any, offsetUnused: any, limit?: number, pageNum?: number): string;
    /**
     * @returns {'GET'|'POST'} HTTP method used in getTransactions call.
     */
    getTransactionsMethod(): "GET" | "POST";
    /**
     * @param {string} address
     * @param {number} offset
     * @param {number} limit
     * @returns {object} describing getTransactions url parameters.
     */
    getTransactionsParams(address: string, offset?: number, limit?: number): object;
    /**
     * Maps an result array from server to internal data structure format.
     *   suitable for history
     * @param {object} response an object, received from server
     * @param {string} address a current wallet address
     * @returns <Array<Transaction>> modified response
     */
    modifyTransactionsResponse(response: object, address: string): Transaction[];
    /**
     * Parses single tx from a server.
     * @param {object} tx tx object from server
     * @param {string} selfAddress current wallet address
     * @returns <Transaction> parsed tx
     */
    getTransactionsModifiedResponse(tx: object, selfAddress: string): Transaction | undefined;
    /**
     * Get direction of a single tx.
     * @param {string} selfAddress current wallet address
     * @param {object} tx tx object from server
     * @returns <true|false> true - incoming, false - outgoing
     */
    getTxDirection(selfAddress: string, tx: object): boolean;
    /**
     * Get date of a single tx.
     * @param {object} tx tx object from server
     * @returns {Date} tx date
     */
    getTxDateTime(tx: object): Date;
    /**
     * Get other address of tx - not the current wallet are.
     * @param {address} selfAddress current wallet address
     * @param {object} tx tx object from server
     * @param {boolean} direction result of getDirection
     * @returns {string}
     */
    getTxOtherSideAddress(selfAddress: address, tx: object, direction: boolean): string;
    /**
     * Get a value for a tx.
     * @param {string} selfAddress
     * @param {object} tx
     * @returns {string}
     */
    getTxValue(selfAddress: string, tx: object): string;
    /**
     * Get hash of a tx
     * @param {object} tx
     * @returns {string} hash
     */
    getTxHash(tx: object): string;
    /**
     * Get fee of a tx
     * @param {object} tx
     * @returns {string} fee
     */
    getTxFee(tx: object): string;
    /**
     * Get number of confirmations of a tx
     * @returns {number}
     */
    getTxConfirmations(): number;
}
import Explorer from '../../explorers/explorer.js';
import Transaction from '../../explorers/Transaction.js';
