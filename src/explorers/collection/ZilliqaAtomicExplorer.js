import { TxTypes } from 'src/explorers/enum';
import { GET_TRANSACTIONS_TYPE } from 'src/utils/const';

import ZilliqaAbstractExplorer from './ZilliqaAbstractExplorer.js';

const TXS_NOT_FOUND_ERROR = 'Transactions not found';

class ZilliqaAtomicExplorer extends ZilliqaAbstractExplorer {
  handleRequestError(error, reqArgs) {
    if (reqArgs.type === GET_TRANSACTIONS_TYPE && error.response?.data?.error === TXS_NOT_FOUND_ERROR) {
      return [];
    }
    return super.handleRequestError(error, reqArgs);
  }

  getTransactionsModifiedResponse(tx, selfAddress, asset = this.wallet.ticker) {
    return Object.assign(
      {
        txType: this.getTxType(tx),
      },
      super.getTransactionsModifiedResponse(tx, selfAddress, asset),
    );
  }

  getTransactionsParams(address, offset = 0, limit = this.defaultTxLimit) {
    return { address, limit, offset };
  }

  getTransactionsUrl(address) {
    return 'transactions';
  }

  getTransactionParams(txId) {
    return { txId };
  }

  getTransactionUrl(txId) {
    return 'transaction';
  }

  getTxDateTime(tx) {
    return new Date(tx.timestamp);
  }

  getTxDirection(selfAddress, tx) {
    return tx.toAddr === this.getValidChecksumAddress(selfAddress);
  }

  getTxHash(tx) {
    return tx.txId;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getBech32Address(this.getTxDirection(selfAddress, tx) ? tx.fromAddr : tx.toAddr);
  }

  getTxType(tx) {
    switch (tx.operation) {
      case 'Claim rewards':
        return TxTypes.CLAIM;
      case 'Stake':
        return TxTypes.STAKE;
      case 'Unstake':
        return TxTypes.UNSTAKE;
      case 'Withdraw stake':
        return TxTypes.WITHDRAW;
      default:
        return TxTypes.TRANSFER;
    }
  }

  getTxValue(selfAddress, tx) {
    return this.wallet.toCurrencyUnit(new this.wallet.BN(tx.amount));
  }

  getTxConfirmations(tx) {
    return tx?.isConfirmed ? 1 : 0;
  }
}

export default ZilliqaAtomicExplorer;
