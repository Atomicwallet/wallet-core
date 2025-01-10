import { Token } from '../abstract';

class EVMToken extends Token {
  constructor(...args) {
    super(...args);

    this.gasLimit = '150000';
    this.coefficient = 1;
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

export default EVMToken;
