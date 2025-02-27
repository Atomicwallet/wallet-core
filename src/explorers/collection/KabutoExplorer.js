import Explorer from 'src/explorers/explorer';
import Transaction from 'src/explorers/Transaction';
import { GET_BALANCE_TYPE } from 'src/utils';
import { toCurrency } from 'src/utils/convert';

class KabutoExplorer extends Explorer {
  getAllowedTickers() {
    return ['HBAR'];
  }

  getApiPrefix() {
    return '';
  }

  async getInfo(address) {
    if (!address) {
      throw new Error('[HBAR] KabutoExplorer: address is not defined');
    }
    const response = await this.request(
      this.getInfoUrl(address),
      this.getInfoMethod(),
      this.getInfoParams(),
      GET_BALANCE_TYPE,
      this.getInfoOptions(),
    );

    return this.modifyInfoResponse(response, address);
  }

  getInfoUrl(address) {
    return `account/${address}`;
  }

  getTxValue(selfAddress, tx) {
    return toCurrency(tx.value, this.wallet.decimal);
  }

  getTxDateTime(tx) {
    return new Date(tx.consensusAt);
  }

  getTxDirection(selfAddress, tx) {
    const transferTo = tx.transfers.find((transfer) => {
      return transfer.amount === tx.value;
    });

    return transferTo.account === selfAddress;
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxMemo(tx) {
    return tx.memo || '';
  }

  getTxOtherSideAddress(selfAddress, tx) {
    const transferTo = tx.transfers.find((transfer) => {
      return transfer.amount === tx.value;
    });

    return this.getTxDirection(selfAddress, tx) ? tx.operator : transferTo.account;
  }

  modifyInfoResponse(response) {
    return {
      balance: response.balance.amount,
      transactions: [],
    };
  }

  async getTransaction(selfAddress, txid) {
    const response = await this.request(`transaction/${txid}`);

    return this.modifyTransactionResponse(response, selfAddress);
  }

  async getTransactions({ address }) {
    if (!address) {
      throw new Error('KabutoExplorer: no address');
    }
    const response = await this.request(`account/${address}/transaction`);

    return this.modifyTransactionsResponse(response, address);
  }

  modifyTransactionsResponse(response, selfAddress) {
    const txs = response.transactions
      .filter((tx) => tx.type === 'CRYPTO_TRANSFER')
      .map((tx) => {
        return {
          ticker: this.wallet.ticker,
          name: this.wallet.name,
          alias: this.wallet.alias,
          walletid: this.wallet.id,
          explorer: 'KabutoExplorer',
          txid: this.getTxHash(tx),
          fee: this.getTxFee(tx),
          feeTicker: 'HBAR',
          direction: this.getTxDirection(selfAddress, tx),
          otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
          amount: this.getTxValue(selfAddress, tx),
          datetime: this.getTxDateTime(tx),
          memo: this.getTxMemo(tx),
          confirmations: 1,
        };
      });
    const modifiedTxs = txs.map((tx) => new Transaction(tx));

    return modifiedTxs;
  }

  getTxFee(tx) {
    return toCurrency((tx && tx.fee) || 0, this.wallet.decimal);
  }
}

export default KabutoExplorer;
