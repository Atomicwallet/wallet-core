import { ExplorerRequestError, WalletError } from 'src/errors';
import Explorer from 'src/explorers/explorer';
import { GET_UTXO_TYPE, SEND_TRANSACTION_TYPE } from 'src/utils/const';

/**
 * @deprecated constructor signature is not supported
 */
class CardanoliteExplorer extends Explorer {
  /**
   * Constructs the object.
   *
   * @param {Coin|Token} wallet The wallet
   * @param {String} baseUrl The base url
   * @param {String} webUrl The web url
   */
  constructor(wallet, baseUrl, webUrl, submitUrl) {
    super(...arguments);

    this.submitUrl = submitUrl;
  }

  getAllowedTickers() {
    return ['ADA'];
  }

  getInfoUrl(address) {
    return `/addresses/summary/${address}`;
  }

  modifyInfoResponse(response) {
    return {
      balance: response.Right.caBalance.getCoin,
      transactions: [],
    };
  }

  getUTXOUrl() {
    return '/v2/txs/utxoForAddresses';
  }

  getTransactionsUrl(address) {
    return '/v2/txs/history';
  }

  getTransactionsMethod() {
    return 'post';
  }

  getTransactionsParams(address, offset, limit) {
    return {
      addresses: [address],
      dateFrom: 1483228800000, // from 2017
      txLimit: limit || this.defaultTxLimit,
    };
  }

  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(response, address);
  }

  getSendTransactionUrl() {
    return '/v2/txs/signed';
  }

  getSendTransactionMethod() {
    return 'post';
  }

  getSendTransactionParams(rawtx) {
    return {
      signedTx: Buffer.from(rawtx.txBody, 'hex').toString('base64'),
      txHash: rawtx.txHash,
    };
  }

  modifySendTransactionResponse(response, hash) {
    let modifiedResponse;

    if (response === 'Transaction sent successfully!') {
      modifiedResponse = {
        txid: hash,
      };
    } else {
      throw new WalletError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(`[ADA] ${response}`),
        instance: this,
      });
    }

    return modifiedResponse;
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(selfAddress, tx) {
    return !tx.inputs_address.find((address) => selfAddress === address);
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx)
      ? tx.inputs_address.find((address) => selfAddress !== address)
      : tx.outputs_address.find((address) => selfAddress !== address) || selfAddress;
  }

  getTxDate(tx) {
    return this.getTxDateTime(tx).toDateString().slice(4);
  }

  getTxTime(tx) {
    return this.getTxDateTime(tx).toTimeString().slice(0, 5);
  }

  getTxValue(selfAddress, tx) {
    const isIncoming = this.getTxDirection(selfAddress, tx);
    const indexes = [];

    tx.outputs_address.forEach((address, idx) => {
      if (isIncoming && address === selfAddress) {
        indexes.push(idx);
      } else if (!isIncoming && address !== selfAddress) {
        indexes.push(idx);
      }
    });

    const sentToMyself = tx.inputs_address.concat(tx.outputs_address).every((address) => address === selfAddress);

    let value;

    if (sentToMyself) {
      const outputsAmount = tx.outputs_amount.reduce(
        (prev, cur) => prev.add(new this.wallet.BN(cur)),
        new this.wallet.BN(0),
      );

      const inputsAmount = tx.inputs_amount.reduce(
        (prev, cur) => prev.add(new this.wallet.BN(cur)),
        new this.wallet.BN(0),
      );

      value = inputsAmount.sub(outputsAmount).toString();
    } else {
      value = indexes
        .reduce((acc, cur) => acc.add(new this.wallet.BN(tx.outputs_amount[cur])), new this.wallet.BN(0))
        .toString();
    }

    return this.wallet.toCurrencyUnit(value);
  }

  getTxDateTime(tx) {
    return new Date(tx.time);
  }

  getTxConfirmations(tx) {
    return 1;
  }

  /**
   * Gets the balance.
   *
   * @returns {Promise<BN>}
   */
  async getBalance(address) {
    const response = await this.getInfo(address);

    return response && response.balance;
  }

  async sendTransaction(rawtx) {
    const response = await this.request(
      this.getSendTransactionUrl(),
      this.getSendTransactionMethod(),
      this.getSendTransactionParams(rawtx),
      SEND_TRANSACTION_TYPE,
      this.getSendOptions(),
    );

    return this.modifySendTransactionResponse(response, rawtx.txHash);
  }

  /**
   * Gets the utxo.
   *
   * @return {Promise} The utxo.
   */
  async getUnspentOutputs(address) {
    const result = await this.request(this.getUTXOUrl(), 'post', {
      addresses: [address],
    }).catch((error) => {
      throw new ExplorerRequestError({
        type: GET_UTXO_TYPE,
        error,
        url: this.getUTXOUrl(),
        instance: this,
      });
    });

    return result;
  }
}

export default CardanoliteExplorer;
