import { POLYSCAN_API_KEY } from '../../env';
import { ExplorerRequestError } from '../../errors/index.js';
import { getTokenId } from '../../utils';
import { GET_BALANCE_TYPE, GET_TRANSACTIONS_TYPE } from '../../utils/const';
import { toCurrency } from '../../utils/convert';
import Explorer from '../Explorer';
import Transaction from '../Transaction';

const SECONDS_TO_MILLISECONDS = 1000;
const MODULE_FOR_REQUESTS = 'account';
const ACTION_TX_LIST = 'txlist';
const ACTION_TOKEN_TX_LIST = 'tokentx';
const ACTION_BALANCE = 'balance';
const REQUEST_TX_STARTBLOCK = 0;
const REQUEST_TX_ENDBLOCK = 99999999;
const SORT_TYPE_TX = 'desc';
const SUCCESSFUL_RESPONSE = '1';
const IGNORED_ERROR_MESSAGES = ['No transactions found'];

/**
 * Class for explorer.
 *
 * @class {PolyscanExplorer}
 */
class PolyscanExplorer extends Explorer {
  constructor({ wallet, config }) {
    super({ wallet, config });
  }

  /**
   * @override
   */
  getAllowedTickers() {
    return ['MATIC'];
  }

  modifyGeneralResponse(response) {
    const { status, message } = response?.data || {};

    // For empty lists of transactions, the external API returns a response:
    // status = 0 and the message "No transactions found" which is not an error.
    if (
      status === SUCCESSFUL_RESPONSE ||
      IGNORED_ERROR_MESSAGES.includes(message)
    ) {
      return response.data;
    }

    throw new ExplorerRequestError({
      type: GET_BALANCE_TYPE,
      error: new Error(JSON.stringify(response)),
      instance: this,
    });
  }

  /**
   * @override
   */
  getTransactionsUrl(address) {
    return '';
  }

  /**
   * @override
   */
  getTransactionsParams(address) {
    return {
      module: MODULE_FOR_REQUESTS,
      action: ACTION_TX_LIST,
      address,
      startblock: REQUEST_TX_STARTBLOCK,
      endblock: REQUEST_TX_ENDBLOCK,
      sort: SORT_TYPE_TX,
      apikey: POLYSCAN_API_KEY,
    };
  }

  /**
   * @override
   */
  async getBalance(address) {
    const balanceParams = {
      module: MODULE_FOR_REQUESTS,
      action: ACTION_BALANCE,
      address,
      apikey: POLYSCAN_API_KEY,
    };

    const response = await this.request('', 'get', balanceParams);

    return this.modifyGeneralResponse(response);
  }

  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(response.result, address);
  }

  getTransactionsModifiedResponse(...args) {
    return new Transaction(super.getTransactionsModifiedResponse(...args));
  }

  /**
   * @override
   */
  getTxHash(tx) {
    return tx.hash;
  }

  /**
   * @override
   */
  getTxDateTime(tx) {
    return new Date(Number(tx.timeStamp) * SECONDS_TO_MILLISECONDS);
  }

  /**
   * @override
   */
  getTxFee(tx) {
    const fee = new this.wallet.BN(tx.gasPrice).mul(
      new this.wallet.BN(tx.gasUsed),
    );

    return this.wallet.toCurrencyUnit(fee);
  }

  /**
   * @override
   */
  getTxConfirmations(tx) {
    return Number(tx.confirmations);
  }

  /**
   * Gets the trasaction direction.
   * @override
   * @param {Transaction} tx The trasaction
   * @return {Boolean} The trasaction direction.
   */
  getTxDirection(selfAddress, tx) {
    return selfAddress.toLowerCase() !== tx.from.toLowerCase();
  }

  /**
   * @param tx
   * @return {string}
   * @override
   */
  getTxOtherSideAddress(selfAddress, tx) {
    return selfAddress.toLowerCase() === tx.from.toLowerCase()
      ? tx.to
      : tx.from;
  }

  /**
   * @param tx
   * @return {string}
   * @override
   */
  getTxValue(selfAddress, tx) {
    return this.wallet.toCurrencyUnit(tx.value);
  }

  async getTokenTransactions({ address }) {
    const tokenTXRequesParams = {
      module: MODULE_FOR_REQUESTS,
      action: ACTION_TOKEN_TX_LIST,
      address,
      startblock: REQUEST_TX_STARTBLOCK,
      endblock: REQUEST_TX_ENDBLOCK,
      sort: SORT_TYPE_TX,
      apikey: POLYSCAN_API_KEY,
    };

    const response = await this.request(
      this.getTransactionsUrl(address),
      this.getTransactionsMethod(),
      tokenTXRequesParams,
      GET_TRANSACTIONS_TYPE,
      this.getTransactionsOptions(),
    );

    return response.result.map((tx) => {
      return new Transaction({
        ticker: tx.tokenSymbol,
        name: tx.tokenName,
        walletid: getTokenId({
          ticker: tx.tokenSymbol,
          contract: tx.contractAddress,
          parent: this.wallet.parent,
        }),
        txid: this.getTxHash(tx),
        direction: this.getTxDirection(address, tx),
        otherSideAddress: this.getTxOtherSideAddress(address, tx),
        amount: this.getTokenTxAmount(tx),
        datetime: this.getTxDateTime(tx),
        confirmations: this.getTxConfirmations(tx),
        nonce: this.getTxNonce(tx),
        alias: this.wallet.alias,
        fee: this.getTxFee(tx),
        feeTicker: this.getTxFeeTicker(),
      });
    });
  }

  getTokenTxAmount(tx) {
    return toCurrency(tx.value, Number(tx.tokenDecimal));
  }
}

export default PolyscanExplorer;
