import { COSMOS_MSG_TO_TYPE, TxTypes } from 'src/explorers/enum';
import Explorer from 'src/explorers/explorer';

export default class TerraFCDExplorer extends Explorer {
  constructor(...args) {
    super(...args);

    this.network = 'mainnet';
  }

  getAllowedTickers() {
    return ['LUNA'];
  }

  async getGasPrices() {
    const gasPrices = await this.request('/v1/txs/gas_prices', 'GET');

    return gasPrices;
  }

  getTransactionsUrl() {
    return '/v1/txs';
  }

  getTransactionsParams(address, offset, limit) {
    return { account: address, offset, limit };
  }

  modifyLatestBlockResponse(response) {
    return response.height;
  }

  getTxDenom(tx) {
    return tx.tx?.body.messages[0].amount.amount;
  }

  getTxCoins(selfAddress, tx) {
    const type = this.getTxType(tx);

    if (type === TxTypes.COSMOS_MSG_TO_TYPE.MsgWithdrawDelegatorReward) {
      const rewardReceived = tx.logs.reduce((sum, current) => {
        const coinReceived = current.events?.find((e) => {
          return (
            e.type === 'coin_received' &&
            e.attributes.find(({ key, value }) => key === 'receiver' && value === selfAddress)
          );
        });

        if (coinReceived) {
          const amounts = coinReceived.attributes?.find(({ key }) => key === 'amount')?.value;

          if (amounts) {
            const res = /(\d*)uluna/.exec(amounts);

            if (res !== null) {
              sum += BigInt(res[1]);
            }
          }
        }

        return sum;
      }, 0n);

      return { denom: 'uluna', amount: rewardReceived.toString() };
    }

    const coins = tx.tx?.body?.messages[0]?.amount;

    if (Array.isArray(coins)) {
      return coins.find(({ denom }) => ['uluna'].includes(denom));
    }

    return coins;
  }

  modifyTransactionsResponse(response, address) {
    return response.txs.reduce((list, tx) => {
      try {
        list.push(this.getTransactionModifiedResponse(tx, address));
      } catch (error) {
        console.error(error);
      }
      return list;
    }, []);
  }

  getTxType(tx) {
    const messages = Array.isArray(tx.tx?.body.messages) ? tx.tx?.body.messages : [];
    const txType = messages.map(({ '@type': nativeType }) => nativeType.split('.').pop())[0];

    if (COSMOS_MSG_TO_TYPE[txType] === undefined) {
      throw new Error(`[LUNA] txType ${txType} not found`);
    }

    return COSMOS_MSG_TO_TYPE[txType];
  }

  getTxConfirmations() {
    return 1;
  }

  getTxDateTime(tx) {
    return new Date(tx.timestamp);
  }

  getTxHash(tx) {
    return tx.txhash;
  }

  getTxDirection(selfAddress, tx) {
    const type = this.getTxType(tx);

    switch (type) {
      case COSMOS_MSG_TO_TYPE.MsgDelegate:
        return false;
      case COSMOS_MSG_TO_TYPE.MsgUndelegate:
        return true;
      case COSMOS_MSG_TO_TYPE.MsgWithdrawDelegatorReward:
        return true;

      default: {
        // should be transfer
        const { to_address: toAddress } = tx.tx?.body.messages[0] || {};

        return toAddress === selfAddress;
      }
    }
  }

  getTxOtherSideAddress(selfAddress, tx) {
    const type = this.getTxType(tx);

    const { validator_address: validator, from_address: from, to_address: to } = tx.tx?.body.messages[0] || {};

    switch (type) {
      case COSMOS_MSG_TO_TYPE.MsgDelegate:
      case COSMOS_MSG_TO_TYPE.MsgUndelegate:
      case COSMOS_MSG_TO_TYPE.MsgWithdrawDelegatorReward:
        return validator;

      default: // should be transfer
        return this.getTxDirection(selfAddress, tx) ? from : to;
    }
  }

  getTxValue(selfAddress, tx) {
    const txCoins = this.getTxCoins(selfAddress, tx);

    return this.wallet.toCurrencyUnit(txCoins.amount);
  }

  getTxFee(tx) {
    return this.wallet.toCurrencyUnit(tx.tx.auth_info.fee.amount[0].amount);
  }

  getTxFeeTicker() {
    return this.wallet.ticker;
  }

  getTxMemo(tx) {
    return tx.tx.body.memo;
  }
}
