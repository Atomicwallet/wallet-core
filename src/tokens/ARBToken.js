import { Token } from '../abstract';

export default class ARBToken extends Token {
  constructor(...args) {
    super(...args);

    this.gasLimit = '150000';
    this.coefficient = 1;
  }

  async getInfo() {
    return {
      balance: String(this.balance),
      transactions: this.transactions,
    };
  }

  async createTransaction({ address, amount, custom, userGasPrice, gasLimit, multiplier = this.multiplier, nonce }) {
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
