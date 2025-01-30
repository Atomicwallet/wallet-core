import TzktAbstractExplorer from './TzktAbstractExplorer.js';
class TzktExplorer extends TzktAbstractExplorer {
    getTransactionsUrl(address) {
        return `${this.config.baseUrl}accounts/${address}/operations`;
    }
    getTransactionUrl(txid) {
        return `${this.config.baseUrl}explorer/op/${txid}`;
    }
    /**
     * Get the request extra parameter
     *
     * @return {string}
     */
    getExtraParam() {
        return this.lastTxId;
    }
    /**
     * Set the request extra parameter
     *
     * @param lastTx {Object} the last tx got
     */
    setExtraParam(lastTx) {
        this.lastTxId = lastTx?.id;
    }
    /**
     * Get transaction list params
     *
     * @return {Object}
     */
    getTransactionsParams(address, limit, lastId) {
        return { lastId, limit };
    }
}
export default TzktExplorer;
//# sourceMappingURL=TzktExplorer.js.map