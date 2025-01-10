import { Amount } from '../../utils';
import Explorer from '../Explorer';
import Transaction from '../Transaction';

const TX_TYPE = {
  delegate: 'stake',
  unDelegate: 'unstake',
  withdraw: 'withdraw',
  claimRewards: 'reward',
};

class ElrondApiExplorer extends Explorer {
  getAllowedTickers() {
    return ['EGLD'];
  }

  getInfoUrl(address) {
    return `/accounts/${address}`;
  }

  getTransactionsUrl(address) {
    return `/accounts/${address}/transactions`;
  }

  getTransactionsParams(
    address,
    offset = 0,
    limit = this.defaultTxLimit,
    pageNum,
  ) {
    return { from: offset, to: offset + limit, withScResults: true };
  }

  getTransfersrUrl(address) {
    return `/accounts/${address}/transfers`;
  }

  getStakingInfoUrl(address) {
    return `/accounts/${address}/delegation`;
  }

  getSendTransactionUrl() {
    return '/transactions';
  }

  getSendTransactionParams(rawtx) {
    return rawtx;
  }

  getTransactionUrl(txid) {
    return this.getTransactionsUrl(txid);
  }

  modifyInfoResponse(response) {
    const { balance, nonce } = response;

    return { balance, nonce };
  }

  modifySendTransactionResponse(response) {
    return { txid: response.txHash };
  }

  modifyTransactionsResponse(txs, selfAddress) {
    if (!Array.isArray(txs)) {
      return [];
    }

    return txs.map(
      (tx) =>
        new Transaction({
          ticker: this.wallet.ticker,
          name: this.wallet.name,
          txid: this.getTxHash(tx),
          walletid: this.wallet.id,
          fee: this.getTxFee(tx),
          feeTicker: this.wallet.parent,
          direction: this.getTxDirection(selfAddress, tx),
          otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
          amount: this.getTxValue(selfAddress, tx),
          datetime: this.getTxDateTime(tx),
          memo: this.getTxMemo(tx),
          confirmations: this.getTxConfirmations(tx),
          txType: this.getTransactionType(tx),
          alias: this.wallet.alias,
        }),
    );
  }

  getTransactionType(tx) {
    return TX_TYPE[tx.function] || 'transfer';
  }

  getTxConfirmations(tx) {
    return tx.round;
  }

  getTxHash(tx) {
    return tx.txHash;
  }

  getTxDirection(selfAddress, tx) {
    return tx.receiver === selfAddress;
  }

  getTxOtherSideAddress(selfAddress, tx) {
    return this.getTxDirection(selfAddress, tx) ? tx.sender : tx.receiver;
  }

  getTxValue(selfAddress, tx) {
    const txType = this.getTransactionType(tx);

    if (txType === 'unstake') {
      return this.wallet.toCurrencyUnit(tx.action.arguments.value);
    }

    return ['transfer', 'stake'].includes(txType)
      ? this.wallet.toCurrencyUnit(tx.value)
      : this.wallet.toCurrencyUnit(
          this.getValueFromSmartContractResults(selfAddress, tx),
        );
  }

  getValueFromSmartContractResults(selfAddress, { results = [] } = {}) {
    return results
      .reduce((value, miniTx) => {
        if (miniTx.receiver === selfAddress) {
          return value.add(new this.wallet.BN(miniTx.value));
        }

        return value;
      }, new this.wallet.BN('0'))
      .toString();
  }

  getTxNonce(tx) {
    return tx.nonce;
  }

  getTxDateTime(tx) {
    return new Date(Number(`${tx.timestamp}000`));
  }

  async fetchStakingInfo(address) {
    const response = await this.request(
      this.getStakingInfoUrl(address),
      this.getInfoMethod(),
    );

    return this.modifyFetchStakingInfo(response);
  }

  modifyFetchStakingInfo(response) {
    const validators = response.reduce(
      (
        validatorsObject,
        {
          contract: validator,
          userUnBondable: availableWithdrawals,
          userActiveStake: staked,
          claimableRewards: rewards,
          userUndelegatedList = [],
        },
      ) => {
        const unstaking = userUndelegatedList
          .filter(({ seconds }) => seconds > 0)
          .reduce((acc, { amount }) => {
            acc = acc.add(new this.wallet.BN(amount));
            return acc;
          }, new this.wallet.BN('0'));

        validatorsObject[validator] = {
          address: validator,
          staked: new Amount(staked, this.wallet),
          unstaking: new Amount(unstaking, this.wallet),
          rewards: new Amount(rewards, this.wallet),
          availableWithdrawals: new Amount(availableWithdrawals, this.wallet),
          pendingWithdrawals: new Amount(unstaking, this.wallet),
        };

        return validatorsObject;
      },
      {},
    );

    const [staked, availableWithdrawals, pendingWithdrawals, rewards] = [
      'staked',
      'availableWithdrawals',
      'pendingWithdrawals',
      'rewards',
    ].map((field) =>
      Object.values(validators).reduce((acc, validator) => {
        return new this.wallet.BN(acc).add(validator[field].toBN()).toString();
      }, '0'),
    );

    return {
      staked: new Amount(staked, this.wallet),
      unstaking: new Amount(pendingWithdrawals, this.wallet),
      pendingWithdrawals: new Amount(pendingWithdrawals, this.wallet),
      availableWithdrawals: new Amount(availableWithdrawals, this.wallet),
      rewards: new Amount(rewards, this.wallet),
      validators,
    };
  }
}

export default ElrondApiExplorer;
