import Explorer from '../Explorer';
import Transaction from '../Transaction';
import { convertTimestampToDateTime, getStringWithEnsuredEndChar, toCurrency } from '@/utils/convert';

const TX_TIMESTAMPS_IN_ONE_SECOND = 1;
const TX_MODULE_PARAM = 'account';
const TX_ACTION_PARAM = 'txlist';

/**
 * Class FtmExplorer
 *
 */
class FtmExplorer extends Explorer {
  constructor({ wallet, config }) {
    super({ wallet, config });

    this.baseUrl = getStringWithEnsuredEndChar(config.baseUrl, '/');
    this.ticker = wallet.ticker;
  }

  /**
   * Gets allowed tickers
   *
   * @returns {string[]}
   */
  getAllowedTickers() {
    return ['FTM'];
  }

  /** @typedef GetTransactionParamsResponse
   * @type {object}
   * @property {'account'} module
   * @property {'txlist'} action
   * @property {string} address - Wallet address.
   * @property {string} page - Page number.
   * @property {string} offset - Used here as Items limit on page.
   * @property {'asc'|'desc'} sort - Sort order.
   **/

  /**
   * Gets transaction list params
   *
   * @param {string} address - Wallet address.
   * @param {number} [offset] - Not used here.
   * @param {number} [limit] - Items limit on page.
   * @param {number} [pageNum=1] - Page number.
   * @return {GetTransactionParamsResponse} - Here offset used as a limit.
   */
  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit, pageNum = 1) {
    return {
      module: TX_MODULE_PARAM,
      action: TX_ACTION_PARAM,
      address,
      page: String(pageNum),
      offset: String(limit),
      sort: 'desc',
    };
  }

  /**
   * Gets transaction url
   *
   * @param {string} address  - Wallet address.
   * @returns {string}
   */
  getTransactionsUrl(address) {
    return '';
  }

  /**
   * @typedef ParsedRawTransactionObject
   * @type object
   * @property {string} timeStamp
   * @property {string} hash
   * @property {string} from
   * @property {string} to
   * @property {string} value
   * @property {string} gas
   * @property {string} gasPrice
   * @property {boolean} isError
   * @property {string} cumulativeGasUsed
   * @property {string} gasUsed
   * @property {string} confirmations
   */

  /**
   * Creates transactions from parsed transactions for wallet address
   *
   * @param {object} response
   * @param {ParsedRawTransactionObject[] | string} response.result - Parsed transactions - array or Error message .
   * @param {string} selfAddress - Coin Address.
   * @param {string} [asset='FTM'] - Basically it's a coin ticker.
   * @returns {Transaction[]}
   */
  modifyTransactionsResponse(response, selfAddress, asset = this.wallet.ticker) {
    const txs = Array.isArray(response?.result) ? response.result : [];

    return txs.reduce((transactionList, tx, index) => {
      try {
        const direction = this.getTxDirection(selfAddress, tx);

        transactionList.push(
          new Transaction({
            ticker: asset,
            name: this.wallet.name,
            alias: this.wallet.alias,
            walletid: this.wallet.id,
            explorer: this.constructor.name,
            txid: tx.hash,
            direction,
            otherSideAddress: direction ? tx.from : tx.to,
            amount: toCurrency(tx.value, this.wallet.decimal),
            datetime: this.getTxDateTime(tx),
            memo: '',
            confirmations: tx.confirmations,
            fee: this.getTxFee(tx),
            feeTicker: asset,
          }),
        );

        return transactionList;
      } catch (error) {
        console.warn('[FTM] tx parse failed');
        console.error(error);

        return transactionList;
      }
    }, []);
  }

  /**
   * Gets the transaction direction.
   *
   * @param {object} tx - The transaction response.
   * @return {boolean} - True if we accept transaction.
   */
  getTxDirection(selfAddress, tx) {
    return tx.to.toLowerCase() === selfAddress.toLowerCase();
  }

  /**
   * Gets the transaction datetime.
   *
   * @param {object} tx - The transaction response.
   * @return {Date}
   */
  getTxDateTime(tx) {
    return convertTimestampToDateTime(Number(tx.timeStamp), TX_TIMESTAMPS_IN_ONE_SECOND);
  }

  /**
   * Gets the transaction fee.
   *
   * @param {ParsedRawTransactionObject} tx
   * @return {string}
   */
  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(BigInt(tx.gasUsed) * BigInt(tx.gasPrice));
  }
}

export default FtmExplorer;
