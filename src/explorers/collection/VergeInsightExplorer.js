import { GET_TRANSACTIONS_TYPE } from '../../utils/const';
import Explorer from '../Explorer';
import Transaction from '../Transaction';

class VergeInsightExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.canPaginate = true;
  }

  getAllowedTickers() {
    return ['XVG'];
  }

  getApiPrefix() {
    return 'api/XVG/mainnet/';
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}address/${address}/balance`;
  }

  modifyInfoResponse(response) {
    return {
      balance: response.confirmed,
    };
  }

  getTransactionUrl(txId) {
    return `${this.getApiPrefix()}tx/${txId}/coins`;
  }

  getTransactionsUrl(address) {
    return `${this.getApiPrefix()}address/${address}/txs`;
  }

  getTransactionsParams(address, offset, limit, pageNum) {
    return {
      pageNum,
    };
  }

  modifyTransactionsResponse(response, transactions, selfAddress) {
    return transactions.map((tx) => {
      const direction = this.getTxDirection(selfAddress, tx);

      return new Transaction({
        ticker: this.wallet.ticker,
        name: this.wallet.name,
        walletid: this.wallet.id,
        txid: this.getTxHash(tx),
        direction,
        otherSideAddress: this.getTxOtherSideAddress(
          selfAddress,
          tx,
          direction,
        ),
        amount: this.getTxValue(selfAddress, tx, direction),
        datetime: this.getTxDateTime(tx),
        alias: this.wallet.alias,
      });
    });
  }

  getUnspentOutputsUrl(address) {
    return `${this.getApiPrefix()}address/${address}`;
  }

  getUnspentOutputsParams() {
    return {
      unspent: true,
    };
  }

  modifyUnspentOutputsResponse(selfAddress, response) {
    return response.map(({ value, script, mintTxid, mintIndex, address }) => {
      return {
        satoshis: value,
        value,
        script,
        txid: mintTxid,
        vout: mintIndex,
        address,
      };
    });
  }

  getSendTransactionUrl() {
    return `${this.getApiPrefix()}tx/send`;
  }

  getSendTransactionParam() {
    return 'rawTx';
  }

  /**
   * Gets the transaction datetime.
   *
   * @param {Object} tx The transaction response
   * @return {Date} The transaction datetime.
   */
  getTxDateTime(tx) {
    return new Date(tx.blockTimeNormalized);
  }

  /**
   * Gets the trasaction amount.
   *
   * @param {Object} tx The trasaction
   * @return {Number} The trasaction amount.
   */
  getTxValue(selfAddress, tx, direction) {
    const filterFn = direction
      ? (output) => output.address === selfAddress
      : (output) => output.address !== selfAddress;

    const value = tx.outputs.filter(filterFn).reduce((prev, cur) => {
      return prev.add(new this.wallet.BN(cur.value));
    }, new this.wallet.BN(0));

    return this.wallet.toCurrencyUnit(value);
  }

  /**
   * Gets the trasaction direction.
   *
   * @param {Object} tx The trasaction
   * @return {Boolean} The trasaction direction.
   */
  getTxDirection(selfAddress, tx) {
    return tx.inputs.every((input) => input.address !== selfAddress);
  }

  /**
   * Gets the trasaction recipient.
   *
   * @param {Object} tx The transaction response.
   * @return {(Boolean|String)} The transaction recipient.
   */
  getTxOtherSideAddress(selfAddress, tx, direction) {
    if (direction) {
      return tx.inputs[0].address;
    }

    const foreignOutput = tx.outputs.find(
      (output) => output.address !== selfAddress,
    );

    return foreignOutput?.address || selfAddress;
  }

  /**
   * Calculates the balance.
   *
   * @param {Object[]} utxos The utxos
   * @return {BN} The balance.
   */
  calculateBalance(utxos = []) {
    return utxos.reduce(
      (acc, { value }) => new this.wallet.BN(value).add(acc),
      new this.wallet.BN('0'),
    );
  }

  /**
   * Modify transaction response
   *
   * @param {Object} tx
   * @return {Transaction}
   */
  modifyTransactionResponse(tx, selfAddress) {
    const direction = this.getTxDirection(selfAddress, tx);

    return new Transaction({
      ticker: this.wallet.ticker,
      name: this.wallet.name,
      walletid: this.wallet.id,
      txid: this.getTxHash(tx),
      fee: this.getTxFee(tx),
      feeTicker: this.wallet.parent,
      direction,
      otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx, direction),
      amount: this.getTxValue(selfAddress, tx, direction),
      datetime: this.getTxDateTime(tx),
      confirmations: this.getTxConfirmations(tx),
      alias: this.wallet.alias,
    });
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(tx?.fee || this.wallet.feeDefault || 0);
  }

  getTxConfirmations(tx) {
    return tx.confirmations;
  }

  getTxHash(tx) {
    return tx.txid;
  }

  async getTransactionCoins(txid) {
    return this.request(`${this.getApiPrefix()}tx/${txid}/coins`);
  }

  async getTransaction(txid) {
    return this.request(`${this.getApiPrefix()}tx/${txid}`);
  }

  async getTransactions({
    address,
    offset = 0,
    limit = this.defaultTxLimit,
    pageNum,
  }) {
    const response = await this.request(
      this.getTransactionsUrl(address),
      this.getTransactionsMethod(),
      this.getTransactionsParams(
        address,
        offset || 0,
        limit || this.defaultTxLimit,
        pageNum,
      ),
      GET_TRANSACTIONS_TYPE,
      this.getTransactionsOptions(),
    );

    const txIds = [];

    response.forEach((utxo) => {
      if (
        utxo.mintTxid &&
        txIds.findIndex((tx) => tx === utxo.mintTxid) === -1
      ) {
        txIds.push(utxo.mintTxid);
      }
      if (
        utxo.spentTxid &&
        txIds.findIndex((tx) => tx === utxo.spentTxid) === -1
      ) {
        txIds.push(utxo.spentTxid);
      }
    });

    return Promise.all(
      txIds.map(async (txid) => {
        const tx = await this.getTransaction(txid);
        const coins = await this.getTransactionCoins(txid);

        return this.modifyTransactionResponse(
          { txid, ...tx, ...coins },
          address,
        );
      }),
    );
  }
}

export default VergeInsightExplorer;
