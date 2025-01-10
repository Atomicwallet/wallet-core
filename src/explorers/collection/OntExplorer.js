import { CONST, RestClient } from 'ontology-ts-sdk';
import { ExplorerRequestError } from 'src/errors';

import { GET_TRANSACTIONS_TYPE, SEND_TRANSACTION_TYPE } from '../../utils/const';
import Explorer from '../Explorer';
import Transaction from '../Transaction';

class OntExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.rest = new RestClient(CONST.MAIN_ONT_URL.REST_URL);
  }

  getAllowedTickers() {
    return ['ONT', 'ONG'];
  }

  getApiPrefix() {
    return '/v2';
  }

  modifyGeneralResponse(response) {
    if (
      (typeof response.Error !== 'undefined' && response.Error !== 0) ||
      (response.data && (response.data.code !== 0 || response.data.result === null))
    ) {
      throw new Error(`${response.data.msg}`);
    }

    if (response.data && response.data.result) {
      return response.data.result;
    }

    return response;
  }

  /**
   * Gets the information url.
   *
   * @return {String} The information url.
   */
  getInfoUrl(address) {
    return `${this.getApiPrefix()}/addresses/${address}/native/balances`;
  }

  /**
   * Gets the information about a wallet.
   *
   * @return {Promise<Object>} The information data.
   */
  async getInfo(address) {
    const response = await this.request(this.getInfoUrl(address));

    const balances = {
      unbonding: '0',
      rewards: '0',
    };

    response.forEach((info) => {
      if (['ont', 'ong'].includes(info.asset_name)) {
        balances[info.asset_name] = info.balance;
      }

      if (info.asset_name === 'unboundong') {
        balances.rewards = info.balance;
      }

      if (info.asset_name === 'waitboundong') {
        balances.unbonding = info.balance;
      }
    });

    return {
      balances,
    };
  }

  getTransactionsUrl(address) {
    const limit = 20;
    const page = 1;

    // get last 20 tx
    // eslint-disable-next-line max-len
    return `${this.getApiPrefix()}/addresses/${address}/${this.wallet.ticker.toLowerCase()}/transactions?page_size=${limit}&page_number=${page}`;
  }

  getTokenTransactionsUrl(address, asset = 'ong') {
    const limit = 20;
    const page = 1;

    // get last 20 tx
    return `${this.getApiPrefix()}/addresses/${address}/${asset}/transactions?page_size=${limit}&page_number=${page}`;
  }

  /**
   * Gets the transactions.
   *
   * @param  {Number} offset The offset (default: 0)
   * @param  {Number} limit The limit (default: this.defaultTxLimit)
   * @return {Promise} The transactions.
   */
  async getTransactions({ address, offset = 0, limit = this.defaultTxLimit }) {
    this.latestBlock = await this.getLatestBlock();

    const ontTxs = await super.getTransactions({ address, offset, limit });

    const ongTxs = await this.getTokenTransactions({ address, offset, limit });

    return [...ontTxs, ...ongTxs];
  }

  async getTokenTransactions({ address, offset = 0, limit = this.defaultTxLimit, asset = 'ong' }) {
    const response = await this.request(
      this.getTokenTransactionsUrl(address),
      this.getTransactionsMethod(),
      this.getTransactionsParams(address, offset || 0, limit || this.defaultTxLimit),
      GET_TRANSACTIONS_TYPE,
      this.getTransactionsOptions(),
    );

    return this.modifyTokenTransactionsResponse(response, address, asset);
  }

  modifyTransactionsResponse(response, address, asset = 'ont') {
    const filteredAssetTxs = response
      .map((tx) => {
        tx.transfers = tx.transfers.filter((transfer) => transfer.asset_name === asset);

        return tx;
      })
      .filter((tx) => tx.transfers.length !== 0);

    return super.modifyTransactionsResponse(filteredAssetTxs, address);
  }

  modifyTokenTransactionsResponse(filteredAssetTxs, address, asset) {
    return filteredAssetTxs.map(
      (tx) =>
        new Transaction({
          ticker: asset.toUpperCase(),
          txid: this.getTxHash(tx),
          walletid: asset.toUpperCase(),
          fee: this.getTxFee(tx),
          feeTicker: this.getTxFeeTicker(),
          direction: this.getTxDirection(address, tx),
          otherSideAddress: this.getTxOtherSideAddress(address, tx),
          amount: this.getTxValue(address, tx),
          datetime: this.getTxDateTime(tx),
          memo: this.getTxMemo(tx),
          confirmations: this.getTxConfirmations(tx),
          nonce: this.getTxNonce(tx),
          alias: this.wallet.alias,
        }),
    );
  }

  getLatestBlockUrl() {
    return `${this.getApiPrefix()}/latest-blocks?count=1`;
  }

  modifyLatestBlockResponse([response]) {
    return response;
  }

  getTxHash(tx) {
    return tx.tx_hash;
  }

  getTxDirection(selfAddress, tx) {
    return tx.transfers[0].to_address === selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.transfers[0].from_address : tx.transfers[0].to_address;
  }

  getTxValue(selfAddress, tx) {
    return tx.transfers[0].amount.replace(/(\.\d*[1-9])0+$|\.0*$/, '$1');
  }

  getTxDateTime(tx) {
    return new Date(Number(`${tx.tx_time}000`));
  }

  getTxConfirmations(tx) {
    return this.latestBlock.block_height - tx.block_height;
  }

  async sendTransaction(rawtx) {
    let response;

    try {
      response = await this.rest.sendRawTransaction(rawtx);

      if (response.Error !== 0) {
        throw new Error(`${response.Desc} : ${response.Result}`);
      }
    } catch (error) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error,
        instance: this,
      });
    }

    // this.wallet.getInfo()

    return {
      txid: response.Result,
    };
  }

  getTxFee(tx) {
    return (tx && tx.fee) || 0;
  }

  getTxFeeTicker() {
    return 'ONG';
  }
}

export default OntExplorer;
