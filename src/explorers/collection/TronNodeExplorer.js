import BN from 'bn.js';
import TronWeb from 'tronweb';

import { getTokenId } from '../../utils';
import { GET_BALANCE_TYPE, ONE_MINUTE } from '../../utils/const';
import { toCurrency } from '../../utils/convert';
import Explorer from '../Explorer';
import Transaction from '../Transaction';

/**
 * Full tron node api
 *
 */
class TronNodeExplorer extends Explorer {
  getAllowedTickers() {
    return ['TRX', 'BTT', 'USDT', 'WIN', 'USDC', 'BTTOLD'];
  }

  getInfoUrl(address) {
    return 'wallet/getaccount';
  }

  getInfoMethod() {
    return 'post';
  }

  getInfoParams(address) {
    return {
      address: TronWeb.address.toHex(address),
    };
  }

  getRewardUrl() {
    return 'wallet/getReward';
  }

  getRewardMethod() {
    return 'post';
  }

  getRewardParams(address) {
    return {
      address,
    };
  }

  getTransactionUrl(txid) {
    return `wallet/gettransactionbyid?value=${txid}`;
  }

  getTxHash(tx) {
    return tx.txID;
  }

  getTxValue(selfAddress, tx) {
    let amount = null;

    if (tx.raw_data.contract[0].type === 'FreezeBalanceContract') {
      amount = tx.raw_data.contract[0].parameter.value.frozen_balance;
    } else if (tx.raw_data.contract[0].type === 'UnfreezeBalanceContract') {
      amount = tx.raw_data.contract[0].parameter.value.frozen_balance;
    } else {
      amount = tx.raw_data.contract[0].parameter.value.amount;
    }

    return toCurrency(amount, this.wallet.decimal);
  }

  getTxDirection(selfAddress, tx) {
    return (
      TronWeb.address.fromHex(
        tx.raw_data.contract[0].parameter.value.owner_address,
      ) !== selfAddress
    );
  }

  getTxOtherSideAddress(selfAddress, tx) {
    const from = TronWeb.address.fromHex(
      tx.raw_data.contract[0].parameter.value.owner_address,
    );
    let to = null;

    if (tx.raw_data.contract[0].type === 'VoteWitnessContract') {
      to = TronWeb.address.fromHex(
        tx.raw_data.contract[0].parameter.value.votes[0].vote_address,
      );
    } else if (tx.raw_data.contract[0].type === 'FreezeBalanceContract') {
      to = 'Freeze balance';
    } else if (tx.raw_data.contract[0].type === 'UnfreezeBalanceContract') {
      to = 'Unfreeze balance';
    } else if (tx.raw_data.contract[0].type === 'WithdrawBalanceContract') {
      to = 'Reward';
    } else {
      to = TronWeb.address.fromHex(
        tx.raw_data.contract[0].parameter.value.to_address,
      );
    }

    return this.getTxDirection(selfAddress, tx) ? from : to;
  }

  getTxDateTime(tx) {
    return new Date(tx.raw_data.timestamp);
  }

  getTxConfirmations(tx) {
    return 1;
  }

  getTxAsset(tx, tokens) {
    if (tx.raw_data.contract[0].parameter.value.asset_name) {
      const contract = TronWeb.toAscii(
        tx.raw_data.contract[0].parameter.value.asset_name,
      );

      return tokens[contract] && tokens[contract].ticker;
    }

    return this.wallet.ticker;
  }

  getTxAssetId(tx) {
    if (tx.raw_data.contract[0].parameter.value.asset_name) {
      const contract = TronWeb.toAscii(
        tx.raw_data.contract[0].parameter.value.asset_name,
      );

      return getTokenId({
        ticker: this.wallet.tokens()[contract].ticker,
        contract,
        parent: this.wallet.parent,
      });
    }

    return this.wallet.id;
  }

  modifyTransactionResponse(tx, selfAddress, tokens) {
    return new Transaction({
      ticker: this.getTxAsset(tx, tokens),
      name: this.wallet.name,
      alias: this.wallet.alias,
      walletid: this.getTxAssetId(tx),
      explorer: this.constructor.name,
      txid: this.getTxHash(tx),
      fee: this.getTxFee(tx),
      feeTicker: this.wallet.parent,
      direction: this.getTxDirection(selfAddress, tx),
      otherSideAddress: this.getTxOtherSideAddress(selfAddress, tx),
      amount: this.getTxValue(selfAddress, tx),
      datetime: this.getTxDateTime(tx),
      memo: this.getTxMemo(tx),
      confirmations: this.getTxConfirmations(tx),
    });
  }

  async getInfo(address) {
    if (!address || typeof address !== 'string') {
      throw this.createError('getInfo: address must be string with length > 0');
    }
    if (
      this.defaultRequestTimeout &&
      Date.now() - this.defaultRequestTimeout * ONE_MINUTE <
        this.lastGetInfoRequestTime
    ) {
      return this.modifyInfoResponse(undefined);
    }

    if (
      this.defaultRequestTimeout &&
      Date.now() - this.defaultRequestTimeout * ONE_MINUTE >
        this.lastGetInfoRequestTime
    ) {
      this.lastGetInfoRequestTime = Date.now();
    }

    const response = await this.request(
      this.getInfoUrl(address),
      this.getInfoMethod(),
      this.getInfoParams(address),
      GET_BALANCE_TYPE,
      this.getInfoOptions(),
    );

    const rewardResponse = await this.request(
      this.getRewardUrl(),
      this.getRewardMethod(),
      this.getRewardParams(address),
      GET_BALANCE_TYPE,
      this.getInfoOptions(),
    );

    if (response && rewardResponse) {
      response.reward = rewardResponse.reward;
    }

    return this.modifyInfoResponse(response);
  }

  modifyInfoResponse(response) {
    if (response.Error) {
      throw new Error(response.Error);
    }

    const {
      balance = 0,
      frozen = [],
      votes = [],
      account_resource: accountResource = {},
      reward = '0',
      assetV2,
    } = response || {};
    const {
      frozen_balance_for_energy: {
        frozen_balance: frozenBalanceForEnergy = 0,
      } = {},
    } = accountResource;

    const balanceFormatted = new BN(balance).toString();

    return {
      balance: balanceFormatted,
      assetV2,
      stakingInfo: {
        frozen,
        votes,
        reward,
        accountResource,
        frozenBalanceForEnergy,
      },
    };
  }
}

export default TronNodeExplorer;
