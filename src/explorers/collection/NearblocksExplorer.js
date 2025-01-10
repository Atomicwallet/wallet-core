import { getNumberWithoutENotation as getNumberStringWithoutENotation } from 'src/utils/convert';

import Explorer from '../Explorer';
import Transaction from '../Transaction';

const TX_TYPE_UNSTAKE = 'UNSTAKE';

class NearblocksExplorer extends Explorer {
  constructor(...args) {
    super(...args);
    this.defaultTxLimit = 25; // 25 is max supported limit in nearblocks
  }

  getTxLimit() {
    return this.defaultTxLimit;
  }

  /**
   * @returns {Array<string>} List of tickers.
   */
  getAllowedTickers() {
    return ['NEAR'];
  }

  /**
   * @returns {string} An url one can use to return list of transactions by given address.
   */
  getTransactionsUrl(address, offsetUnused, limit = this.defaultTxLimit, pageNum = 0) {
    return `account/${address}/txns?page=${pageNum + 1}&per_page=${limit}&order=desc`;
  }

  /**
   * @returns {'GET'|'POST'} HTTP method used in getTransactions call.
   */
  getTransactionsMethod() {
    return 'GET';
  }

  /**
   * @param {string} address
   * @param {number} offset
   * @param {number} limit
   * @returns {object} describing getTransactions url parameters.
   */
  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
    return { address, offset, limit };
  }

  /**
   * Maps an result array from server to internal data structure format.
   *   suitable for history
   * @param {object} response an object, received from server
   * @param {string} address a current wallet address
   * @returns <Array<Transaction>> modified response
   */
  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(response.txns, address).filter(Boolean);
  }

  /**
   * Parses single tx from a server.
   * @param {object} tx tx object from server
   * @param {string} selfAddress current wallet address
   * @returns <Transaction> parsed tx
   */
  getTransactionsModifiedResponse(tx, selfAddress) {
    try {
      const direction = this.getTxDirection(selfAddress, tx);

      return new Transaction({
        walletid: this.wallet.id,
        ticker: this.wallet.ticker,
        name: this.wallet.name,
        alias: this.wallet.alias,
        explorer: this.constructor.name,
        txid: this.getTxHash(tx),
        direction,
        otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx, direction),
        amount: this.getTxValue(selfAddress, tx),
        fee: this.getTxFee(tx),
        feeTicker: this.wallet.parent,
        datetime: this.getTxDateTime(tx),
        memo: this.getTxMemo(tx),
        confirmations: this.getTxConfirmations(),
      });
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * Get direction of a single tx.
   * @param {string} selfAddress current wallet address
   * @param {object} tx tx object from server
   * @returns <true|false> true - incoming, false - outgoing
   */
  getTxDirection(selfAddress, tx) {
    return tx.actions[0].action === TX_TYPE_UNSTAKE ? true : tx.receiver_account_id === selfAddress;
  }

  /**
   * Get date of a single tx.
   * @param {object} tx tx object from server
   * @returns {Date} tx date
   */
  getTxDateTime(tx) {
    try {
      return new Date(Number(String(tx.block_timestamp).substr(0, 13)));
    } catch (error) {
      console.error(error);
      return new Date();
    }
  }

  /**
   * Get other address of tx - not the current wallet are.
   * @param {address} selfAddress current wallet address
   * @param {object} tx tx object from server
   * @param {boolean} direction result of getDirection
   * @returns {string}
   */
  getTxOtherSideAddress(selfAddress, tx, direction) {
    return direction ? tx.predecessor_account_id : tx.receiver_account_id;
  }

  /**
   * Get a value for a tx.
   * @param {string} selfAddress
   * @param {object} tx
   * @returns {string}
   */
  getTxValue(selfAddress, tx) {
    try {
      return this.wallet.toCurrencyUnit(getNumberStringWithoutENotation(tx.actions_agg.deposit));
    } catch (error) {
      console.error(error);
      return '0';
    }
  }

  /**
   * Get hash of a tx
   * @param {object} tx
   * @returns {string} hash
   */
  getTxHash(tx) {
    return tx.transaction_hash;
  }

  /**
   * Get fee of a tx
   * @param {object} tx
   * @returns {string} fee
   */
  getTxFee(tx) {
    try {
      return this.wallet.toCurrencyUnit(getNumberStringWithoutENotation(tx.outcomes_agg.transaction_fee));
    } catch (error) {
      console.error(error);
      return '0';
    }
  }

  /**
   * Get number of confirmations of a tx
   * @returns {number}
   */
  getTxConfirmations() {
    return 2;
  }
}

export default NearblocksExplorer;
