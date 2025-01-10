import Explorer from '../Explorer';

class TzktAbstractExplorer extends Explorer {
  getAllowedTickers() {
    return ['XTZ'];
  }

  /**
   * Modify transaction list response
   *
   * @param {Object[]} txs
   */
  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(response, address);
  }

  getTxConfirmations(tx) {
    return tx.status === 'applied' ? 1 : 0;
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(selfAddress, tx) {
    return tx.sender.address !== selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    if (this.getTxDirection(selfAddress, tx)) {
      return tx.sender.address;
    }

    return (tx.target && tx.target.address) || '';
  }

  getTxValue(selfAddress, tx) {
    return this.wallet.toCurrencyUnit(tx.amount);
  }

  getTxDateTime(tx) {
    return new Date(tx.timestamp);
  }

  getTxMemo(tx) {
    return '';
  }

  async getTransaction(selfAddress, txid) {
    const response = await this.request(
      this.getTransactionUrl(txid),
      this.getTransactionsMethod(),
      this.getTransactionsParams(selfAddress, undefined, 0),
      'tx',
      this.getTransactionsOptions(),
    );

    return this.modifyTransactionResponse(response, selfAddress);
  }

  async getTransactions({ address, pageNum, limit = this.defaultTxLimit }) {
    const txs = await this.request(
      this.getTransactionsUrl(address),
      this.getTransactionsMethod(),
      this.getTransactionsParams(address, limit, this.getExtraParam(pageNum, limit)),
      'txs',
      this.getTransactionsOptions(),
    );

    this.setExtraParam(txs[txs.length - 1]);

    return this.modifyTransactionsResponse(txs, address);
  }

  getTxFee() {
    return this.wallet.toCurrencyUnit(this.wallet.feeDefault);
  }
}

export default TzktAbstractExplorer;
