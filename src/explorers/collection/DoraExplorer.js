import Explorer from '../Explorer';
import Transaction from '../Transaction';

const MS = 1000;

class DoraExplorer extends Explorer {
  constructor(config) {
    super(config);
    this.ticker = this.wallet.ticker.toUpperCase().substr(0, 3);
    this.height = 0;
  }

  getAllowedTickers() {
    return ['NEO', 'GAS'];
  }

  getInitParams() {
    const parentParams = super.getInitParams();

    return {
      ...parentParams,
      headers: { 'X-Referer': 'https://atomicwallet.io' },
    };
  }

  async getInfo(address) {
    let apiBalances = [];

    this.request('height').then((response) => {
      this.height = Number(response.height);
    });

    try {
      apiBalances = await this.request(`balance/${address}`);
    } catch (error) {
      console.error(error);
    }

    const balances = {
      NEO: '0',
      GAS: '0',
    };
    let balance;

    apiBalances.forEach(({ symbol: assetName, balance: apiBalance }) => {
      if (assetName === this.ticker) {
        balance = apiBalance;
      }
      if (['NEO', 'GAS'].includes(assetName)) {
        balances[assetName] = apiBalance;
      }
    });

    return { balance, balances };
  }

  async getTransactions({ address }) {
    const response = await this.request(`transfer_history/${address}/1`);

    return this.modifyTransactionsResponse(response, address);
  }

  modifyTransactionsResponse(response, selfAddress) {
    const gasTxsRes = response.items.filter((tx) => tx.symbol === 'GAS');
    const neoTxsRes = response.items.filter((tx) => tx.symbol === 'NEO');

    const neoTxs = neoTxsRes.map((tx) => {
      return new Transaction({
        ticker: this.ticker,
        name: this.wallet.name,
        alias: this.wallet.alias,
        txid: this.getTxHash(tx),
        walletid: this.wallet.id,
        datetime: this.getTxDateTime(tx),
        amount: this.getTxValue(selfAddress, tx),
        direction: this.getTxDirection(selfAddress, tx),
        confirmations: this.getTxConfirmations(tx),
        otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
      });
    });

    const gasTxs = gasTxsRes.map((tx) => {
      return new Transaction({
        ticker: tx.symbol,
        name: tx.symbol,
        alias: this.wallet.alias,
        txid: this.getTxHash(tx),
        walletid: 'GAS3',
        datetime: this.getTxDateTime(tx),
        amount: this.getTxValue(selfAddress, tx),
        direction: this.getTxDirection(selfAddress, tx),
        confirmations: this.getTxConfirmations(tx),
        otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
      });
    });

    return [...neoTxs, ...gasTxs];
  }

  getTxConfirmations(tx) {
    return this.height ? this.height - tx.block : 1;
  }

  getTxHash(tx) {
    return tx.txid;
  }

  getTxDirection(selfAddress, tx) {
    return tx.to === selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.from : tx.to;
  }

  getTxValue(selfAddress, tx) {
    return tx.amount;
  }

  getTxDateTime(tx) {
    return new Date(Number(tx.time.split('.')[0]) * MS);
  }
}

export default DoraExplorer;
