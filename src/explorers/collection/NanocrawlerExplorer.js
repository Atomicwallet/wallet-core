import { ExplorerRequestError } from 'src/errors';

import { GET_TRANSACTIONS_TYPE, SEND_TRANSACTION_TYPE } from '../../utils/const';
import Explorer from '../Explorer';

class NanocrawlerExplorer extends Explorer {
  getAllowedTickers() {
    return ['NANO'];
  }

  getApiPrefix() {
    return 'v2';
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}/accounts/${address}`;
  }

  modifyInfoResponse(response) {
    return {
      balance: response.account.balance,
      account_state: response.account,
    };
  }

  getTransactionUrl(txId) {
    this.requestedTxId = txId;

    return `${this.getApiPrefix()}/blocks/${txId}`;
  }

  modifyTransactionResponse(tx) {
    tx.hash = this.requestedTxId;

    return super.modifyTransactionResponse(tx);
  }

  getTransactionsUrl(address) {
    return `${this.getApiPrefix()}/accounts/${address}/history`;
  }

  getPendingTransactionsUrl(address) {
    return `${this.getApiPrefix()}/accounts/${address}/pending`;
  }

  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
    return {};
  }

  async getTransactions(address, offset = 0, limit = this.defaultTxLimit) {
    const transactions = await this.request(
      this.getTransactionsUrl(address),
      this.getTransactionsMethod(),
      this.getTransactionsParams(offset, limit),
      GET_TRANSACTIONS_TYPE,
    );

    return this.modifyTransactionsResponse(transactions, address);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(selfAddress, tx) {
    return tx.subtype === 'receive';
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return tx.account;
  }

  getTxValue(selfAddress, tx) {
    return Number(this.wallet.toCurrencyUnit(tx.amount));
  }

  getTxDateTime(tx) {
    return new Date(Number(`${tx.timestamp}`));
  }

  getSendTransactionUrl() {
    return `${this.getApiPrefix()}/transactions`;
  }

  getTxConfirmations(tx) {
    return Number(tx.type === 'state');
  }

  getSendTransactionParams(rawtx) {
    return { transactions: [rawtx] };
  }

  modifySendTransactionResponse(response) {
    if (response.data.invalid.length > 0) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(response.data.invalid[0]),
        instance: this,
      });
    }

    if (response.data.broadcast.length === 0) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error('Not found broadcast transaction'),
        instance: this,
      });
    }

    return {
      txid: response.data.broadcast[0],
    };
  }
}

export default NanocrawlerExplorer;
