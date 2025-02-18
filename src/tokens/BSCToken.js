import { Token } from '../abstract';

class BSCToken extends Token {
  constructor(config, db, configManager) {
    super(config, db, configManager);

    this.gasLimit = '150000';
    this.coefficient = 1;
  }

  async getInfo() {
    return {
      balance: String(this.balance),
      transactions: this.transactions,
    };
  }

  async getFee({ amount = 0, isSendAll, gasPrice, gasLimit }) {
    const gasPriceIncremented = Number(gasPrice.toString()) * Number(this.coefficient);
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

export default BSCToken;
