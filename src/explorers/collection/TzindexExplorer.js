import Explorer from 'src/explorers/explorer';

class TzindexExplorer extends Explorer {
  getAllowedTickers() {
    return ['XTZ'];
  }

  getTransactionsUrl(address) {
    return `${this.config.baseUrl}explorer/account/${address}/op`;
  }

  getTransactionUrl(txid) {
    return `${this.config.baseUrl}explorer/op/${txid}`;
  }

  /**
   * Get transaction list params
   *
   * @return {Object}
   */
  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
    return { offset, limit };
  }

  /**
   * Modify transaction list response
   *
   * @param {Object[]} txs
   */
  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(response.ops, address);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(selfAddress, tx) {
    return tx.receiver === selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    if (this.getTxDirection(selfAddress, tx)) {
      return tx.sender;
    }

    return tx.receiver || tx.delegate;
  }

  getTxValue(selfAddress, tx) {
    return tx.volume;
  }

  getTxDateTime(tx) {
    return new Date(tx.time);
  }

  getTxMemo(tx) {
    return '';
  }

  async getTransaction(selfAddress, txid) {
    const response = await this.request(
      this.getTransactionUrl(txid),
      this.getTransactionsMethod(),
      this.getTransactionsParams(selfAddress, 0, 0),
      'tx',
      this.getTransactionsOptions(),
    );

    return this.modifyTransactionResponse(response, selfAddress);
  }

  async getTransactions({ address }) {
    const limit = 100;
    const MAX_TRIES = 5;

    const meta = await this.request(
      this.getTransactionsUrl(address),
      this.getTransactionsMethod(),
      this.getTransactionsParams(address, 0, 0),
      'txs',
      this.getTransactionsOptions(),
    );

    const totalOps = Number(meta.n_ops);
    const lastPage = Math.floor(totalOps / limit);
    const responses = [];
    let offset = lastPage * limit;
    let tries = 0;

    do {
      const response = await this.request(
        this.getTransactionsUrl(address),
        this.getTransactionsMethod(),
        this.getTransactionsParams(address, offset, limit),
        'txs',
        this.getTransactionsOptions(),
      );

      tries++;

      responses.push(response);

      offset -= limit;
    } while (offset >= 0 && tries < MAX_TRIES);

    let txs = [];

    responses.forEach((resp) => {
      txs = txs.concat(this.modifyTransactionsResponse(resp, address));
    });

    return txs;
  }
}

export default TzindexExplorer;
