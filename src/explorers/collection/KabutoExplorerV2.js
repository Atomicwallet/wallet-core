import { GET_BALANCE_TYPE } from '../../utils/const';
import { toCurrency } from '../../utils/convert';
import Explorer from '../Explorer';
import Transaction from '../Transaction';

const HEDERA_ACCOUNT = '0.0.98';

/**
 * Class KabutoExplorerV2.
 *
 */
class KabutoExplorerV2 extends Explorer {
  getAllowedTickers() {
    return ['HBAR'];
  }

  getApiPrefix() {
    return '';
  }

  async getInfo(address) {
    if (!address) {
      throw new Error('[HBAR] KabutoExplorerV2: address is not defined');
    }
    const response = await this.request(
      this.getInfoUrl(address),
      this.getInfoMethod(),
      this.getInfoParams(),
      GET_BALANCE_TYPE,
      this.getInfoOptions(),
    );

    return this.modifyInfoResponse(response, address);
  }

  getInfoUrl(address) {
    return `id/${address}`;
  }

  getTransactionsUrl(address) {
    return `/transaction?filter[entityId]=${address}`;
  }

  getTxValue(selfAddress, tx) {
    const direction = this.getTxDirection(selfAddress, tx);
    const otherSideAddress = this.getTxOtherSideAddress(selfAddress, tx);
    const transfer = direction ? this.getTransferFromTx(otherSideAddress, tx) : this.getTransferFromTx(selfAddress, tx);

    return toCurrency(transfer.amount, this.wallet.decimal);
  }

  /**
   * Gets the transaction datetime.
   *
   * @param {Object} transaction
   * @return {Date} The transaction datetime.
   */
  getTxDateTime(tx) {
    return new Date(tx.consensusAt);
  }

  /**
   * Gets the transaction direction
   *
   * @param {String} wallet address
   * @param {Object} transaction
   * @return {Boolean} The transaction direction.
   */
  getTxDirection(selfAddress, tx) {
    const transferTo = this.getTransferFromTx(selfAddress, tx);

    return transferTo.amount < 0;
  }

  /**
   * Gets the transaction hash id
   *
   * @param {Object} transaction
   * @return {String} hash id
   */
  getTxHash(tx) {
    return tx.hash;
  }

  getTxMemo(tx) {
    return tx.memo || '';
  }

  /**
   * Return transfer from transaction transfers array
   *
   *
   * @param {String} Exclusion address. The method will return the address of
   * the other side if the parameter contains its own address
   * @param {Object} transaction
   * @return {Object} transfer
   */
  getTransferFromTx(excludedAddress, tx) {
    const excludeFromOtherside = [excludedAddress, tx.nodeAccountId, HEDERA_ACCOUNT];

    return tx.transfers.find((transfer) => {
      return !excludeFromOtherside.includes(transfer.accountId);
    });
  }

  /**
   * Return transfer from transaction transfers array
   *
   * @param {String} self address
   * @param {Object} transaction
   * @return {String} opposite address
   */
  getTxOtherSideAddress(selfAddress, tx) {
    const transferTo = this.getTransferFromTx(selfAddress, tx);

    return transferTo.accountId;
  }

  modifyInfoResponse(response) {
    return {
      balance: response.balance.amount,
      transactions: [],
    };
  }

  async getTransaction(selfAddress, txid) {
    const response = await this.request(`transaction/${txid}`);

    return this.modifyTransactionResponse(response, selfAddress);
  }

  async getTransactions({ address }) {
    if (!address) {
      throw new Error('KabutoExplorerV2: no address');
    }
    const response = await this.request(this.getTransactionsUrl(address));

    return this.modifyTransactionsResponse(response, address);
  }

  modifyTransactionsResponse(response, selfAddress) {
    const txs = response.data
      .filter((tx) => tx.type === 'TRANSFER')
      .map((tx) => {
        return {
          ticker: this.wallet.ticker,
          name: this.wallet.name,
          alias: this.wallet.alias,
          walletid: this.wallet.id,
          explorer: 'KabutoExplorerV2',
          txid: this.getTxHash(tx),
          fee: this.getTxFee(tx),
          feeTicker: 'HBAR',
          direction: this.getTxDirection(selfAddress, tx),
          otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
          amount: this.getTxValue(selfAddress, tx),
          datetime: this.getTxDateTime(tx),
          memo: this.getTxMemo(tx),
          confirmations: 1,
        };
      });
    const modifiedTxs = txs.map((tx) => new Transaction(tx));

    return modifiedTxs;
  }

  getTxFee(tx) {
    return toCurrency((tx && tx.fee) || 0, this.wallet.decimal);
  }
}

export default KabutoExplorerV2;
