import BN from 'bn.js';

import { Token } from '../abstract';

const TOKEN_GAS_LIMIT = '150000';

class MATICToken extends Token {
  constructor(...args) {
    super(...args);

    this.gasLimit = TOKEN_GAS_LIMIT;
    this.coefficient = 1;
    this.BN = BN;
  }

  async getInfo() {
    return {
      balance: String(this.balance),
      transactions: this.transactions,
    };
  }

  async getFee({ gasPrice, gasLimit }) {
    const gasPriceIncremented = new this.BN(gasPrice.toString()).mul(new this.BN(this.coefficient));
    const estimatedGasLimit = gasLimit || this.gasLimit;

    return new this.BN(estimatedGasLimit).mul(new this.BN(gasPriceIncremented));
  }

  /* @TODO DEPRECATED
   * should be used `createTransaction method from Token.js
   * wich proxied to parent `createTransaction
   * */
  async createTransaction({
    address,
    amount,
    custom,
    userGasPrice,
    gasLimit = this.gasLimit,
    multiplier = this.multiplier,
    nonce,
  }) {
    return {
      address,
      amount,
      custom,
      userGasPrice,
      gasLimit,
      contract: this.contract,
      multiplier,
      nonce,
    };
  }
}

export default MATICToken;
