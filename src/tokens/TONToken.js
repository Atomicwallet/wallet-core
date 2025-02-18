import { HISTORY_WALLET_UPDATED } from 'src/utils/eventTopics';

import { Token } from '../abstract';

class TONToken extends Token {
  #parent;

  /** @type {string} */
  _jettonWalletAddress = null;

  fields = { paymentId: true };

  constructor(config, db, configManager) {
    super(config, db, configManager);
    this.#parent = config.parent;
    this.mint = config.mint;

    this._getJettonWalletAddress();
  }

  async _getJettonWalletAddress() {
    if (this._jettonWalletAddress) {
      return this._jettonWalletAddress;
    }

    this._jettonWalletAddress = await this.#parent.getJettonWalletAddress(this.mint);

    return this._jettonWalletAddress;
  }

  /**
   * Gets the information about a wallet.
   * @return {Promise<{ balance: string }>} The information data.
   */
  async getInfo() {
    const balance = await this.#parent.getTokenInfo({ mint: this.mint });

    if (balance) {
      this.balance = balance;
    }

    return {
      balance: this.balance,
    };
  }

  /* @TODO DEPRECATED
   * should be used `createTransaction method from Token.js
   * wich proxied to parent `createTransaction
   * */
  async createTransaction({ address, amount }) {
    return {
      mint: this.mint,
      address,
      amount,
      decimals: this.decimal,
      transfer: true,
    };
  }

  /**
   * @param {number} offset
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getTransactions(offset, limit) {
    try {
      const txs = await this.#parent.getTokenTransactions({
        jettonWalletAddress: this._jettonWalletAddress,
      });

      if (txs.length > 0) {
        const tokenTransactions = txs.filter((tx) => tx.walletId === this.id);

        const db = this.getDbTable('transactions');

        await db.batchPut(tokenTransactions);

        const { topic, payload } = HISTORY_WALLET_UPDATED(this.id, tokenTransactions);

        this.eventEmitter.emit(topic, payload);
        this.transactions = tokenTransactions;
      }

      return txs;
    } catch (error) {
      return this.transactions;
    }
  }
}

export default TONToken;
