import TzktAbstractExplorer from './TzktAbstractExplorer.js';

class TzktIoV1Explorer extends TzktAbstractExplorer {
  getTransactionsUrl(address) {
    return `${this.config.baseUrl}/operations/transactions`;
  }

  getTransactionUrl(txid) {
    return `${this.config.baseUrl}/operations/transactions/${txid}`;
  }

  /**
   * Get the request extra parameter
   *
   * @param pageNumber {Number} the page number
   * @param txsPerPage {Number} the number of txs per page
   * @return {Number}
   */
  getExtraParam(pageNumber, txsPerPage) {
    return pageNumber * txsPerPage;
  }

  setExtraParam() {}

  /**
   * Get transaction list params
   *
   * @return {Object}
   */
  getTransactionsParams(address, limit, offset) {
    return { 'anyof.sender.target': address, limit, offset, 'sort.desc': 'id' };
  }
}

export default TzktIoV1Explorer;
