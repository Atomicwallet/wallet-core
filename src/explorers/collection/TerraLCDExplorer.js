import { LCDClient } from '@terra-money/terra.js';

import Explorer from '../Explorer';

const BALANCES_BY_COINS = 0;

const MAX_RETRY_FOR_FAILED_TX = 4;
const RETRY_TX_TIMEOUT = 4 * 1000;
const SUCCESS_TX_CODE = 0;
const FALLBACK_CHAIN_ID = 'phoenix-1';
const FALLBACK_BASEURL = 'https://terra20-lcd.atomicwallet.io';

export default class TerraLCDExplorer extends Explorer {
  constructor({ wallet, config }) {
    super(...arguments);

    this.lcdClient = new LCDClient({
      chainID: config.options?.chainID || FALLBACK_CHAIN_ID,
      URL: config.baseUrl || FALLBACK_BASEURL,
      isClassic: false,
    });
  }

  getAllowedTickers() {
    return ['LUNA', 'LUNC'];
  }

  async getBalance(address, useSatoshis, denom = this.wallet.denom) {
    const coinBalances = await this.lcdClient.bank.balance(address);

    return coinBalances[BALANCES_BY_COINS].get(denom)?.amount.toString() || '0';
  }

  waitForTx(txhash) {
    return new Promise((resolve) => {
      let txResult;
      let attemptsLeft = MAX_RETRY_FOR_FAILED_TX;

      const intervalId = setInterval(async () => {
        attemptsLeft -= 1;

        try {
          txResult = await this.wallet.coreLibrary.tx.txInfo(txhash);

          if (txResult.code === SUCCESS_TX_CODE) {
            clearInterval(intervalId);

            resolve(txResult);
          }
        } catch (error) {
          console.warn(`${this.wallet.ticker} can't find tx!`);
        }

        if (!attemptsLeft) {
          clearInterval(intervalId);

          resolve(null);
        }
      }, RETRY_TX_TIMEOUT);
    });
  }

  async sendTransaction(rawtx) {
    const txResult = await this.lcdClient.tx.broadcastSync(rawtx);

    return { txid: txResult.txhash };
  }

  async estimateFee(signers, options) {
    return this.lcdClient.tx.estimateFee(signers, options);
  }

  async calculateTax(coin) {
    return this.lcdClient.utils.calculateTax(coin);
  }

  getAccountInfo(address) {
    return this.lcdClient.auth.accountInfo(address);
  }

  async getValidators(address) {
    return this.lcdClient.staking.bondedValidators(address);
  }

  async getStakingInfo(address) {
    const validators = await this.getValidators(address);

    return {
      validators,
    };
  }

  async getStakedDelegations(address) {
    const [delegations] = await this.lcdClient.staking.delegations(address);

    return delegations;
  }

  async getRewardsBalance(address) {
    return this.lcdClient.distribution.rewards(address);
  }

  async getUnbondingDelegations(address) {
    const [delegations] = await this.lcdClient.staking.unbondingDelegations(address);

    return delegations;
  }

  getLcdWallet(privateKey) {
    return this.lcdClient.wallet(privateKey);
  }
}
