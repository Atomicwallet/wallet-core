import BN from 'bn.js';
import Explorer from 'src/explorers/explorer';
import Transaction from 'src/explorers/Transaction';

class GuardaMoneroProxy extends Explorer {
  getAllowedTickers() {
    return ['XMR'];
  }

  /**
   * Gets the information about a wallet.
   *
   * @return {Promise<Object>} The information data.
   */
  async getAccount(address) {
    return this.request(`account/${address}`, 'GET', undefined, undefined, {
      headers: {
        'api-key': this.config.apiKey,
      },
    });
  }

  async postAccount(address) {
    return this.request('account', 'POST', {
      address,
      API_key: this.config.apiKey,
    });
  }

  async balance(address, viewKey) {
    if (!address) {
      throw new Error('XMR: GuardaMoneroProxy: no address');
    }
    if (!viewKey) {
      throw new Error('XMR: GuardaMoneroProxy: no viewKey');
    }
    return this.request('balance', 'POST', {
      address,
      viewKey,
      API_key: this.config.apiKey,
    });
  }

  async random(params) {
    return this.request('random', 'POST', {
      ...params,
      API_key: this.config.apiKey,
    });
  }

  async resync(address, viewKey) {
    return this.request('resync', 'POST', {
      address,
      viewKey,
      API_key: this.config.apiKey,
    });
  }

  async submit({ tx, address, viewKey }) {
    return this.request('submit', 'POST', {
      tx,
      address,
      viewKey,
      API_key: this.config.apiKey,
    });
  }

  async txData(hash) {
    return this.request(`tx/data/${hash}`, 'GET', undefined, undefined, {
      headers: {
        API_key: this.config.apiKey,
      },
    });
  }

  async unspent({ address, secViewKey, mixin, dustThreshold, useDust = false, amount = '0' }) {
    return this.request('unspend', 'POST', {
      address,
      viewKey: secViewKey,
      amount,
      useDust,
      mixin,
      dustThreshold: String(dustThreshold),
      API_key: this.config.apiKey,
    });
  }

  async txs(address, viewKey) {
    if (!address) {
      throw new Error('XMR: GuardaMoneroProxy: no address');
    }
    if (!viewKey) {
      throw new Error('XMR: GuardaMoneroProxy: no viewKey');
    }
    return this.request('txs', 'POST', {
      address,
      viewKey,
      API_key: this.config.apiKey,
    });
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(tx) {
    return typeof tx.spent_outputs === 'undefined';
  }

  getTxOtherSideAddress(tx) {
    return tx.tx_pub_key;
  }

  getTxValue(tx) {
    return Number(
      this.wallet.toCurrencyUnit(
        this.getTxDirection(tx) // TODO: clean after ref merge
          ? tx.total_received
          : new BN(tx.total_sent).sub(new BN(tx.total_received)),
      ),
    );
  }

  getTxDateTime(tx) {
    return new Date(Number(`${tx.timestamp}`));
  }

  getTxConfirmations(tx, lastHeight) {
    return lastHeight - tx.height;
  }

  async getTransactions({ address, viewKey, lastHeight }) {
    const response = await this.txs(address, viewKey);

    return this.modifyTransactionsResponse(address, response, lastHeight);
  }

  /**
   *
   * @param {Object[]} txs
   */
  modifyTransactionsResponse(selfAddress, response, lastHeight) {
    if (!response || !Array.isArray(response.transactions)) {
      throw new Error('Wrong response');
    }
    return response.transactions.filter(this.wallet.filterTransactions).map(
      (tx) =>
        new Transaction({
          walletid: this.wallet.id,
          ticker: this.wallet.ticker,
          name: this.wallet.name,
          alias: this.wallet.alias,
          explorer: this.constructor.name,
          txid: this.getTxHash(tx),
          direction: this.getTxDirection(tx),
          otherSideAddress: this.getTxOtherSideAddress(tx),
          amount: this.getTxValue(tx),
          datetime: this.getTxDateTime(tx),
          memo: this.getTxMemo(tx),
          confirmations: this.getTxConfirmations(tx, lastHeight),
        }),
    );
  }

  async getInfo({ address, viewKey }) {
    return this.balance(address, viewKey);
  }

  async request(...args) {
    const key = `XMR:GuardaMoneroProxy:${args[0]}`;

    // if we have a request to endpoint
    // all next queued requsests will be
    // resolved with the result of first
    // one all one at once
    return new Promise((resolve, reject) => {
      const isRequesting = this.eventEmitter._events[key];

      this.eventEmitter.once(key, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });

      if (!isRequesting) {
        super
          .request(...args)
          .then((requestResult) => {
            this.eventEmitter.emit(key, requestResult);
          })
          .catch((error) => {
            this.eventEmitter.emit(key, error);
          });
      }
    });
  }
}

export default GuardaMoneroProxy;
