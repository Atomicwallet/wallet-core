import { Token } from '../abstract';

class BNBToken extends Token {
  constructor(args) {
    super(args);
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

  // async getTransactions () {
  //   return this.transactions
  // }

  getUserTicker() {
    return this.ticker.split('-')[0];
  }

  // Rewards calculation draft
  //
  // get reward () {
  //   if (this.getUserTicker() !== 'AWC') {
  //     return undefined
  //   }
  //   const reward = this.rewards.find(
  //     (item) => this.staked >= item.min && this.staked <= item.max
  //   )
  //
  //   if (!reward) {
  //     const maxReward = this.rewards[this.rewards.length - 1]
  //
  //     return this.staked >= maxReward.min
  //       ? maxReward.persent
  //       : this.staking.reward
  //   }
  //
  //   return reward.persent
  // }
  //
  // get stakingComputed () {
  //   return {
  //     available: this.available,
  //     staked: this.staked,
  //     total: this.total,
  //     reward: this.reward,
  //   }
  // }
}

export default BNBToken;
