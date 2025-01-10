import axios from 'axios';
import bitcoinCashAddressTools from 'bchaddrjs';
import { ExplorerRequestError } from 'src/errors';
import { SEND_TRANSACTION_TYPE } from 'src/utils/const';

import Explorer from '../Explorer';
import Transaction from '../Transaction';

// workaround to send signed transaction to specific url by currency
// const sendTransactionTo = {
//   DASH: 'http://insight.dash.show/api/tx/send',
// }

class InsightExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.canPaginate = true;
  }

  getAllowedTickers() {
    return [
      'BTC',
      'LTC',
      'ZEC',
      'DGB',
      'DASH',
      'DOGE',
      'BTG',
      'QTUM',
      'BCH',
      'BSV',
      'SMART',
      'DCR',
      'GRS',
      'YEC',
      'RVN',
      'KMD',
      'BCD',
    ];
  }

  /**
   * hook for bitcoin cash address
   * @return {string}
   */
  getWalletAddress(address) {
    if (['BCH', 'BSV'].includes(this.wallet.ticker)) {
      return bitcoinCashAddressTools.isCashAddress(address)
        ? bitcoinCashAddressTools.toLegacyAddress(address)
        : address;
    }

    return address;
  }

  getApiPrefix() {
    if (['BTG', 'BCD'].includes(this.wallet.ticker)) {
      return 'insight-api/';
    }
    if (this.wallet.ticker === 'YEC') {
      return 'api/YEC/mainnet/';
    }
    if (this.wallet.ticker === 'KMD') {
      return 'insight-api-komodo/';
    }
    return 'api/';
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}addr/${address}`;
  }

  modifyInfoResponse(response) {
    return {
      balance: response.balanceSat,
      transactions: [],
    };
  }

  getTransactionUrl(txId) {
    return `${this.getApiPrefix()}tx/${txId}`;
  }

  getTransactionsUrl(address) {
    if (this.wallet.ticker === 'DCR') {
      return `${this.getApiPrefix()}addr/${address}/txs`;
    }
    return `${this.getApiPrefix()}txs?address=${address}`;
  }

  getTransactionsParams(address, offset, limit, pageNum) {
    return {
      pageNum,
    };
  }

  modifyTransactionsResponse(response, address) {
    if (this.wallet.ticker === 'DCR') {
      return Promise.all(response.transactions.map(async (txId) => this.getTransaction(txId)));
    }

    return super.modifyTransactionsResponse(response.txs, address);
  }

  getUnspentOutputsUrl(address) {
    if (this.wallet.ticker === 'YEC') {
      return `${this.getApiPrefix()}address/${address}/`;
    }
    return `${this.getApiPrefix()}addr/${address}/utxo`;
  }

  getUnspentOutputsParams() {
    if (this.wallet.ticker === 'YEC') {
      return { unspent: true, limit: 1000 };
    }
    return {};
  }

  modifyUnspentOutputsResponse(selfAddress, response) {
    // In some responses can apper `amount` instead of `value`
    if (this.wallet.ticker === 'YEC') {
      return response.map(({ address, mintTxid: txid, mintIndex: vout, script, value }) => ({
        txid,
        vout,
        script,
        value,
        address,
        outputIndex: vout, // BTC
        satoshis: value,
      }));
    }

    return response.map(({ address, txid, vout, scriptPubKey: script, satoshis: value, amount }) => ({
      txid,
      txId: txid, // DGB
      vout,
      script,
      value: value || amount,
      address: this.modifyUnspentAddress(address),
      outputIndex: vout, // BTC
      satoshis: this.wallet.ticker === 'DGB' ? Number(this.wallet.toMinimalUnit(value || amount)) : value || amount,
      // DBG wants utxo amount in satoshis
      atoms: Number(value), // DCR
    }));
  }

  modifyUnspentAddress(address) {
    if (['BCH', 'BSV'].includes(this.wallet.ticker)) {
      return bitcoinCashAddressTools.isCashAddress(address) ? address : bitcoinCashAddressTools.toCashAddress(address);
    }

    return address;
  }

  getSendTransactionUrl() {
    return `${this.getApiPrefix()}tx/send`;
  }

  getSendTransactionParam() {
    return this.wallet.ticker === 'YEC' ? 'rawTx' : 'rawtx';
  }

  async sendTransaction(rawtx) {
    let response;
    const urlToSend = `${this.config.baseUrl}${this.getSendTransactionUrl()}`;

    try {
      if (this.wallet.ticker === 'BTG') {
        response = await axios.post(urlToSend, `${this.getSendTransactionParam()}=${rawtx}`, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } else {
        // const hasWorkaroundSendUrl = Object.keys(sendTransactionTo).includes(this.wallet.ticker)
        // const urlToSend = hasWorkaroundSendUrl
        //   ? sendTransactionTo[this.wallet.ticker]
        //   : `${this.config.baseUrl}${this.getSendTransactionUrl()}`

        response = await axios.post(urlToSend, {
          [this.getSendTransactionParam()]: rawtx,
        });
      }
    } catch (error) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error,
        url: urlToSend,
        instance: this,
      });
    }

    return this.modifyGeneralResponse(this.modifySendTransactionResponse(response));
  }

  /**
   * Gets the transaction datetime.
   *
   * @param {Object} tx The transaction response
   * @return {Date} The transaction datetime.
   */
  getTxDateTime(tx) {
    return tx.time ? new Date(Number(`${tx.time}000`)) : new Date();
  }

  /**
   * Gets the trasaction amount.
   *
   * @param {Object} tx The trasaction
   * @return {Number} The trasaction amount.
   */
  getTxValue(selfAddress, tx) {
    let valueIn = new this.wallet.BN(0);
    let valueOut = new this.wallet.BN(0);

    if (!tx.vin || !tx.vout) {
      return 0;
    }

    tx.vin.forEach((input) => {
      if (input.addr === selfAddress) {
        valueIn = valueIn.add(new this.wallet.BN(input.valueSat));
      }
    });

    tx.vout.forEach((output) => {
      if (output.scriptPubKey.addresses && output.scriptPubKey.addresses.length > 0) {
        if (output.scriptPubKey.addresses[0] === selfAddress) {
          valueOut = valueOut.add(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)));
        }
      }
    });

    const valueDiff = valueIn.sub(valueOut);
    const isInbound = valueDiff.lt(new this.wallet.BN(0));
    const value = valueDiff.abs();

    return Number(
      this.wallet.toCurrencyUnit(isInbound ? value : value.sub(new this.wallet.BN(this.wallet.toMinimalUnit(tx.fees)))),
    );
  }

  /**
   * Gets the trasaction direction.
   *
   * @param {Object} tx The trasaction
   * @return {Boolean} The trasaction direction.
   */
  getTxDirection(selfAddress, tx) {
    return tx.vin && !tx.vin.find(({ addr }) => addr === selfAddress);
  }

  /**
   * Gets the trasaction recipient.
   *
   * @param {Object} tx The transaction response.
   * @return {(Boolean|String)} The transaction recipient.
   */
  getTxOtherSideAddress(selfAddress, tx) {
    if (!tx.vin) {
      return '...';
    }

    if (this.getTxDirection(selfAddress, tx)) {
      return tx.vin[0].addr;
    }

    let valueOutPrev = new this.wallet.BN(0);
    let addressTo = '...';

    tx.vout.forEach((output) => {
      if (output.scriptPubKey && output.scriptPubKey.addresses && output.scriptPubKey.addresses.length > 0) {
        if (output.scriptPubKey.addresses[0] !== selfAddress) {
          if (valueOutPrev.lt(new this.wallet.BN(this.wallet.toMinimalUnit(output.value)))) {
            valueOutPrev = new this.wallet.BN(this.wallet.toMinimalUnit(output.value));
            addressTo = output.scriptPubKey.addresses[0];
          }
        }
      }
    });

    return addressTo;
  }

  /**
   * Calculates the balance.
   *
   * @param {Object[]} utxos The utxos
   * @return {BN} The balance.
   */
  calculateBalance(utxos = []) {
    return utxos.reduce((acc, { value }) => new this.wallet.BN(value).add(acc), new this.wallet.BN('0'));
  }

  /**
   * Modify transaction response
   *
   * @param {Object} tx
   * @return {Transaction}
   */
  modifyTransactionResponse(tx, selfAddress) {
    return new Transaction({
      ticker: this.wallet.ticker,
      name: this.wallet.name,
      walletid: this.wallet.id,
      txid: this.getTxHash(tx),
      fee: this.getTxFee(tx),
      feeTicker: this.wallet.parent,
      direction: this.getTxDirection(selfAddress, tx),
      otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
      amount: this.getTxValue(selfAddress, tx),
      datetime: this.getTxDateTime(tx),
      memo: this.getTxMemo(tx),
      confirmations: this.getTxConfirmations(tx),
      alias: this.wallet.alias,
      locktime: tx.locktime,
    });
  }

  getTxFee(tx) {
    if (this.wallet.ticker === 'SMART') {
      return (tx && tx.fees) || 0;
    }

    return this.wallet.toCurrencyUnit((tx && tx.fees) || 0);
  }
}

export default InsightExplorer;
