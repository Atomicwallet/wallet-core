/**
 * Official NEAR Wallet reference:
 * https://github.com/near/near-wallet/blob/0da7e823492fb9411717d62a3363849ab7e02e15/packages/frontend/src/utils/explorer-api.js#L7
 */
import Explorer from 'src/explorers/explorer';

const TRANSFER_ACTION = 'TRANSFER';

class NearHelperExplorer extends Explorer {
  getAllowedTickers() {
    return ['NEAR'];
  }

  async getTransactions(...args) {
    try {
      const txs = await super.getTransactions(...args);

      return txs;
    } catch (error) {
      // @TODO implement logger

      return [];
    }
  }

  getTransactionsUrl(address) {
    return `account/${address}/activity`;
  }

  getTransactionsMethod() {
    return 'get';
  }

  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit, pageNum) {
    return { limit };
  }

  modifyTransactionsResponse(txs, address) {
    return super.modifyTransactionsResponse(txs, address).filter(Boolean);
  }

  getTransactionsModifiedResponse(tx, selfAddress) {
    return tx.action_kind === TRANSFER_ACTION ? super.getTransactionsModifiedResponse(tx, selfAddress) : null;
  }

  getTxDirection(selfAddress, tx) {
    return tx.receiver_id === selfAddress;
  }

  getTxDateTime(tx) {
    return new Date(new this.wallet.BN(tx.block_timestamp).div(new this.wallet.BN(1000 ** 2)).toNumber());
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return tx.receiver_id === selfAddress ? tx.signer_id : tx.receiver_id;
  }

  getTxValue(selfAddress, tx) {
    return this.wallet.toCurrencyUnit(tx.args.deposit);
  }

  getTxHash(tx) {
    return tx.hash;
  }

  getTxFee() {
    return null;
  }

  getTxConfirmations() {
    return 2;
  }
}

export default NearHelperExplorer;
