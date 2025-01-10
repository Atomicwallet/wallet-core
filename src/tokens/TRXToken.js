import { Token } from '../abstract';

class TRXToken extends Token {
  /* @TODO DEPRECATED
   * should be used `createTransaction method from Token.js
   * wich proxied to parent `createTransaction
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @return {Promise<Object>} Raw transaction
   */
  async createTransaction({ address, amount, userFee }) {
    return {
      address,
      amount,
      contract: this.contract,
      transfer: true,
      userFee,
    };
  }

  getUserTicker() {
    return this.ticker.indexOf('-') !== -1
      ? this.ticker.split('-')[1] || this.ticker
      : this.ticker;
  }
}

export default TRXToken;
