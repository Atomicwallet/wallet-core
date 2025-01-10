// import { ConfigKey } from '../ConfigManager/ConfigManager.const'
// import configManager from '../ConfigManager'
import { Token } from '../abstract';

class FTMToken extends Token {
  constructor(...args) {
    super(...args);

    // @TODO WTF feeData not included!
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
    const gasPriceIncremented =
      Number(gasPrice.toString()) * Number(this.coefficient);
    const estimatedGasLimit = gasLimit || this.gasLimit;

    return new this.BN(estimatedGasLimit).mul(new this.BN(gasPriceIncremented));
  }

  /**
   * Get ERC20 fee settings
   * @return {Promise<Object>} The ERC20 fee settings
   * @see {@link https://atomicwallet.atlassian.net/wiki/spaces/DevOps/pages/343638041#%D0%94%D0%B5%D1%84%D0%BE%D0%BB%D1%82%D0%BD%D0%B0%D1%8F-%D0%BA%D0%BE%D0%BC%D0%B8%D1%81%D1%81%D0%B8%D1%8F-%D0%B4%D0%BB%D1%8F-ETH}
   */
  getFeeSettings() {
    return {}; // configManager.get(ConfigKey.FantomGasPrice)
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

export default FTMToken;
