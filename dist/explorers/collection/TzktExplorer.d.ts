export default TzktExplorer;
declare class TzktExplorer extends TzktAbstractExplorer {
    getTransactionsUrl(address: any): string;
    getTransactionUrl(txid: any): string;
    /**
     * Get the request extra parameter
     *
     * @return {string}
     */
    getExtraParam(): string;
    /**
     * Set the request extra parameter
     *
     * @param lastTx {Object} the last tx got
     */
    setExtraParam(lastTx: Object): void;
    lastTxId: any;
    /**
     * Get transaction list params
     *
     * @return {Object}
     */
    getTransactionsParams(address: any, limit: any, lastId: any): Object;
}
import TzktAbstractExplorer from './TzktAbstractExplorer.js';
