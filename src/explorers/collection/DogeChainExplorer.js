import { ExplorerRequestError } from 'src/errors';

import { GET_BALANCE_TYPE, SEND_TRANSACTION_TYPE } from '../../utils/const';
import Explorer from '../Explorer';

class DogeChainExplorer extends Explorer {
  getAllowedTickers() {
    return ['DOGE'];
  }

  getApiPrefix() {
    return 'api/v1/';
  }

  getInfoUrl(address) {
    return `${this.getApiPrefix()}address/balance/${address}`;
  }

  modifyInfoResponse(response) {
    if (response.success === 1) {
      return {
        balance: this.wallet.toMinimalUnit(response.balance),
        transactions: [],
      };
    }
    throw new ExplorerRequestError({
      type: GET_BALANCE_TYPE,
      error: new Error(response.error),
      instance: this,
    });
  }

  getSendTransactionUrl() {
    return `${this.getApiPrefix()}pushtx`;
  }

  getSendTransactionParam() {
    return 'tx';
  }

  modifySendTransactionResponse(response) {
    if (typeof response.tx_hash === 'undefined' || response.success === 0) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(response.error),
        instance: this,
      });
    }

    return {
      txid: response.tx_hash,
    };
  }

  /**
   * Gets a balance from a wallet info.
   *
   * @return {Promise<String>}
   */
  async getBalance() {
    const info = await this.getInfo();

    return this.wallet.toCurrencyUnit(info.balance);
  }

  getUnspentOutputsUrl(address) {
    return `${this.getApiPrefix()}unspent/${address}`;
  }

  modifyUnspentOutputsResponse(response) {
    return response.unspent_outputs.map(
      ({ address, tx_hash: txid, tx_output_n: vout, script, value }) => ({
        txid,
        vout,
        script,
        value,
        address,
      }),
    );
  }

  /**
   * Calculates the balance.
   *
   * @param {Object[]} utxos The utxos
   * @return {BN} The balance.
   */
  calculateBalance(utxos = []) {
    return utxos.reduce(
      (acc, { value }) => new this.wallet.BN(value).add(acc),
      new this.wallet.BN('0'),
    );
  }
}

export default DogeChainExplorer;
