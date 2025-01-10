import { ExplorerRequestError } from 'src/errors';
import { GET_BALANCE_TYPE, GET_TRANSACTIONS_TYPE, HTTP_STATUS_NOT_FOUND } from 'src/utils/const';
import { convertSecondsToDateTime } from 'src/utils/convert';

import Explorer from '../Explorer';
import Transaction from '../Transaction';

/**
 * Explorer for Algorand indexers
 *
 * Get balance and transactions info
 *
 */

const API_VERSION = 'v2';
const PAYMENT_TRANSACTION = 'payment-transaction';

class AlgoExplorer extends Explorer {
  getAllowedTickers() {
    return ['ALGO'];
  }

  getApiPrefix() {
    return API_VERSION;
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}/accounts/${address}`;
  }

  modifyInfoResponse(response) {
    return {
      balance: response.account.amount,
    };
  }

  getTransactionUrl(txId) {
    return `${this.getApiPrefix()}/transaction/${txId}`;
  }

  getTransactionsUrl(address) {
    return `${this.getApiPrefix()}/accounts/${address}/transactions`;
  }

  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
    return {};
  }

  async getTransactions(address, offset = 0, limit = this.defaultTxLimit) {
    return super.getTransactions(address, offset, limit);
  }

  handleRequestError(error, reqArgs) {
    if (error.response?.status === HTTP_STATUS_NOT_FOUND) {
      switch (reqArgs.type) {
        case GET_BALANCE_TYPE:
          return {
            account: {
              amount: '0',
            },
          };
        case GET_TRANSACTIONS_TYPE:
          return {
            transactions: [],
          };
      }
    }
    return super.handleRequestError(error, reqArgs);
  }

  modifyTransactionsResponse(response, address) {
    if (Array.isArray(response?.transactions) === false) {
      throw new ExplorerRequestError({
        type: GET_TRANSACTIONS_TYPE,
        error: response,
        instance: this,
      });
    }
    const currentBlock = response['current-round'];

    return response.transactions.map(
      (tx) =>
        new Transaction({
          walletid: this.wallet.id,
          ticker: this.wallet.ticker,
          name: this.wallet.name,
          alias: this.wallet.alias,
          explorer: this.constructor.name,
          txid: this.getTxHash(tx),
          direction: this.getTxDirection(address, tx),
          otherSideAddress: this.getTxOtherSideAddress(address, tx),
          amount: this.getTxValue(address, tx),
          fee: this.wallet.toCurrencyUnit(tx.fee),
          feeTicker: this.wallet.parent,
          datetime: this.getTxDateTime(tx),
          memo: this.getTxMemo(tx),
          confirmations: this.getTxConfirmations(currentBlock, tx),
        }),
    );
  }

  getTxHash(tx) {
    return tx.id;
  }

  getTxDirection(selfAddress, tx) {
    return tx[PAYMENT_TRANSACTION].receiver === selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.sender : tx[PAYMENT_TRANSACTION].receiver;
  }

  getTxValue(selfAddress, tx) {
    return Number(
      this.wallet.toCurrencyUnit(
        this.getTxDirection(selfAddress, tx)
          ? tx[PAYMENT_TRANSACTION].amount
          : new this.wallet.BN(tx[PAYMENT_TRANSACTION].amount).add(new this.wallet.BN(tx.fee)),
      ),
    );
  }

  getTxDateTime(tx) {
    return convertSecondsToDateTime(tx['round-time']);
  }

  getTxConfirmations(currentBlock, tx) {
    return currentBlock - tx['confirmed-round'];
  }
}

export default AlgoExplorer;
