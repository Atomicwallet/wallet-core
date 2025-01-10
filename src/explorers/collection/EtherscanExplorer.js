import { ETHERSCAN_API_KEY } from 'src/env';
import { ExplorerRequestError } from 'src/errors';
import { getTokenId } from 'src/utils';
import { GET_BALANCE_TYPE, GET_TRANSACTIONS_TYPE, ONE_MINUTE, SEND_TRANSACTION_TYPE } from 'src/utils/const';

import Explorer from '../Explorer';

const getApiKey = (walletId) => (walletId === 'ETH' ? ETHERSCAN_API_KEY : null);

/**
 * Class for explorer.
 *
 * @abstract
 * @class {EtherscanExplorer}
 */
class EtherscanExplorer extends Explorer {
  modifyGeneralResponse(response) {
    if (response.data && response.data.status === '1') {
      return response.data;
    }

    throw new ExplorerRequestError({
      type: GET_BALANCE_TYPE,
      error: new Error(JSON.stringify(response)),
      instance: this,
    });
  }

  getTransactionsUrl(address) {
    return '';
  }

  #getTransactionsParamsForAction(address, action) {
    const params = {
      module: 'account',
      action,
      address,
      startblock: 0,
      endblock: 99999999,
      sort: 'desc',
    };

    const apikey = getApiKey(this.wallet.id);

    if (apikey) {
      params.apikey = apikey;
    }
    return params;
  }

  getTransactionsParams(address) {
    return this.#getTransactionsParamsForAction(address, 'txlist');
  }

  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(
      response.result.filter(({ value }) => value > 0),
      address,
    );
  }

  /**
   * Sends a transaction.
   *
   * @param {String} rawtx The rawtx
   * @return {Promise<Object>} The transaaction data
   */
  async sendTransaction(rawtx) {
    const response = await this.request('submit', null, { tx_blob: rawtx });

    if (!response.engine_result === 'tesSUCCESS') {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(response.engine_result),
        instance: this,
      });
    }

    return { txid: response.tx_json.hash };
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDateTime(tx) {
    return new Date(Number(`${tx.timeStamp}000`));
  }

  getTxConfirmations(tx) {
    return Number(tx.confirmations);
  }

  /**
   * Gets the transaction direction.
   *
   * @param {string} selfAddress - Wallet address.
   * @param {object} tx - The transaction.
   * @return {boolean} The transaction direction.
   */
  getTxDirection(selfAddress, tx) {
    return selfAddress.toLowerCase() !== tx.from.toLowerCase();
  }

  /**
   * @param tx
   * @return {string}
   */
  getTxOtherSideAddress(selfAddress, tx) {
    return selfAddress.toLowerCase() === tx.from.toLowerCase() ? tx.to : tx.from;
  }

  /**
   * @param tx
   * @return {string}
   */
  getTxValue(selfAddress, tx) {
    return this.wallet.toCurrencyUnit(tx.value);
  }

  getTxFeeTicker() {
    return this.wallet.feeTicker;
  }

  getTxFee(tx) {
    // For the L2 network the fee will not be correct
    return this.wallet.l2Name ? null : super.getTxFee(tx);
  }

  /**
   * @typedef TokenTransaction
   * @type {object}
   * @property {string} contract - Token contract.
   * @property {string} alias
   * @property {string} explorer
   * @property {string} txid
   * @property {boolean} direction
   * @property {string} otherSideAddress
   * @property {string} value
   * @property {Date} datetime
   * @property {string} memo
   * @property {number} confirmations
   */

  /**
   * Get a token's transaction list for a wallet
   *
   * @return {Promise<{tokenTransactions: TokenTransaction[]}>}
   */
  async getTokensTransactions({ address, offset, limit, pageNum }) {
    if (
      this.defaultRequestTimeout &&
      Date.now() - this.defaultRequestTimeout * ONE_MINUTE < this.lastGetTxsRequestTime
    ) {
      return [];
    }

    if (
      this.defaultRequestTimeout &&
      Date.now() - this.defaultRequestTimeout * ONE_MINUTE > this.lastGetTxsRequestTime
    ) {
      this.lastGetTxsRequestTime = Date.now();
    }

    const response = await this.request(
      this.getTransactionsUrl(),
      this.getTransactionsMethod(),
      this.getTokensTransactionsParams(address),
      GET_TRANSACTIONS_TYPE,
      this.getTransactionsOptions(),
    );

    return this.modifyTokenTransactionsResponse(response, address);
  }

  getTokensTransactionsParams(address) {
    return this.#getTransactionsParamsForAction(address, 'tokentx');
  }

  /**
   * Modifies response to get token transactions
   *
   * @param {object} response
   * @param {string} selfAddress - Wallet address.
   * @returns {{tokenTransactions: TokenTransaction[]}}
   */
  modifyTokenTransactionsResponse(response, selfAddress) {
    const { result: rawTxs } = response ?? { result: [] };

    const tokenTransactions = rawTxs.reduce((txs, tx, index) => {
      const direction = this.getTxDirection(selfAddress, tx);
      const ticker = tx.tokenSymbol;
      const contract = tx.contractAddress;

      txs.push({
        // Calculate some values in the coin because these not known here
        contract,
        alias: this.wallet.alias,
        explorer: this.constructor.name,
        txid: this.getTxHash(tx),
        direction,
        otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
        amount: this.getTxValue(selfAddress, tx),
        datetime: this.getTxDateTime(tx),
        memo: '',
        confirmations: this.getTxConfirmations(tx),
        ticker,
        name: tx.tokenName,
        walletid: getTokenId({ ticker, contract, parent: this.wallet.id }),
      });

      return txs;
    }, []);

    return { tokenTransactions };
  }
}

export default EtherscanExplorer;
