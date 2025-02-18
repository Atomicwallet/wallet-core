export default TzktIoV1Explorer;
declare class TzktIoV1Explorer extends TzktAbstractExplorer {
    getTransactionsUrl(address: any): string;
    getTransactionUrl(txid: any): string;
    /**
     * Get the request extra parameter
     *
     * @param pageNumber {Number} the page number
     * @param txsPerPage {Number} the number of txs per page
     * @return {Number}
     */
    getExtraParam(pageNumber: number, txsPerPage: number): number;
    setExtraParam(): void;
    /**
     * Get transaction list params
     *
     * @return {Object}
     */
    getTransactionsParams(address: any, limit: any, offset: any): Object;
}
import TzktAbstractExplorer from './TzktAbstractExplorer.js';
