import Explorer from '../Explorer';

const CONFIRMATIONS = 10;

class TezosExplorer extends Explorer {
  getAllowedTickers() {
    return ['XTZ'];
  }

  getInfoUrl(address) {
    return `v1/node_account/${address}`;
  }

  getTransactionUrl(txId) {
    return `v1/operation/${txId}`;
  }

  getTransactionsUrl(address) {
    return `v1/operations/${address}?type=Transaction&p=0&number=99`;
  }

  modifyInfoResponse(response) {
    return {
      balance: response.balance,
      transactions: [],
    };
  }

  modifyTransactionsResponse(response, address) {
    return super.modifyTransactionsResponse(response, address);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxDirection(selfAddress, tx) {
    return tx.type.operations[0].destination.tz === selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return tx.type.operations[0].destination.tz === selfAddress
      ? selfAddress
      : tx.type.operations[0].destination.tz;
  }

  getTxValue(selfAddress, tx) {
    return this.wallet.toCurrencyUnit(tx.type.operations[0].amount);
  }

  getTxDateTime(tx) {
    return new Date(tx.type.operations[0].timestamp);
  }

  getTxConfirmations(tx) {
    return CONFIRMATIONS;
  }

  async sendTransaction(rawtx) {
    return this.wallet.sendTransaction(rawtx);
  }
}

export default TezosExplorer;
