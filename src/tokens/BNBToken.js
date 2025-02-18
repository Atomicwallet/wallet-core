import { Token } from '../abstract';

export default class BNBToken extends Token {
  constructor(config, db, configManager) {
    super(config, db, configManager);
    this.fields.paymentId = true;
    this.balances = {};
  }

  /**
   * Gets the available balance.
   *
   * @return {Promise<String>} The balance.
   */
  async availableBalance() {
    if (this.balances && this.balances.available) {
      return this.balances.available;
    }

    return this.divisibleBalance ? String(this.divisibleBalance) : '0';
  }

  async getInfo() {
    await this.getBalance();

    return {
      balance: String(this.balance),
      transactions: this.transactions,
    };
  }

  /* @TODO DEPRECATED
   * should be used `createTransaction method from Token.js
   * wich proxied to parent `createTransaction
   * */
  async createTransaction({ address, amount, memo }) {
    return { address, amount, memo, asset: this.ticker };
  }

  async getBalance() {
    return this.balance;
  }

  getUserTicker() {
    return this.ticker.split('-')[0];
  }
}
