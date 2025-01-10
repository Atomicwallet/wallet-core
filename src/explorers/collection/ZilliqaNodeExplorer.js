import { Transaction } from '@zilliqa-js/account';
import { RPCMethod } from '@zilliqa-js/core';
import { Zilliqa } from '@zilliqa-js/zilliqa';
import { ExplorerRequestError } from 'src/errors';

import ZilliqaAbstractExplorer from './ZilliqaAbstractExplorer.js';
import RewardCalculator from '../../coins/libs/ZilliqaRewardCalculator';
import { SEND_TRANSACTION_TYPE, GET_BALANCE_TYPE } from '../../utils/const';

const STAKING_PENGING_RANGE = 30800; // 50 testnet, 30800 mainnet
const ACCOUNT_NOT_CREATED_ERROR_CODE = -5;

class ZilliqaNodeExplorer extends ZilliqaAbstractExplorer {
  constructor(...args) {
    super(...args);
    this.zilliqa = new Zilliqa(this.config.baseUrl);
  }

  async sendTransaction({ rawtx, privateKey }) {
    const tx = new Transaction(rawtx);
    let response;

    try {
      this.zilliqa.wallet.addByPrivateKey(privateKey);

      const signedTx = await this.zilliqa.wallet.sign(tx);

      signedTx.amount = signedTx.amount.toString();
      signedTx.gasLimit = signedTx.gasLimit.toString();
      signedTx.gasPrice = signedTx.gasPrice.toString();

      response = await this.request(
        this.config.baseUrl,
        'POST',
        {
          id: 'atomic',
          jsonrpc: '2.0',
          method: RPCMethod.CreateTransaction,
          params: [
            {
              ...signedTx.txParams,
              priority: signedTx.toDS,
            },
          ],
        },
        GET_BALANCE_TYPE,
      );
    } catch (error) {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(error.message),
        instance: this,
      });
    }

    if (typeof response.error !== 'undefined') {
      throw new ExplorerRequestError({
        type: SEND_TRANSACTION_TYPE,
        error: new Error(response.error.message),
        instance: this,
      });
    }

    return {
      txid: response.result.TranID,
    };
  }

  async getBalance(address, contract) {
    const { balance, nonce = 0 } =
      (await this.getInfo(this.toValidChecksumAddress(address)).catch((error) =>
        console.warn(error),
      )) || {};

    return {
      balance,
      nonce: Number(nonce),
    };
  }

  async getStakingBalance(address, contract) {
    const ssnContract = this.toValidChecksumAddress(contract);

    const staking = await this.getStakedAmountFromContract(
      address,
      ssnContract,
    );
    const withdrawals = await this.getWithdrawalsFromContract(
      address,
      ssnContract,
    );

    return { staking, withdrawals };
  }

  async getRewards(address, contract, staking) {
    const ssnContract = this.toValidChecksumAddress(contract);

    const rewards = (await this.getRewardsFromContract(
      address,
      ssnContract,
      staking,
    )) || { total: '0' };

    return rewards;
  }

  async getTokenBalance(address, contracts) {
    const balances = contracts
      .map(async (contract) => {
        if (!contract) {
          return null;
        }

        const legacyAddr = `0x${this.toValidChecksumAddress(address)}`;

        const contractSubState = await this.request(
          this.config.baseUrl,
          'POST',
          {
            id: 'atomic',
            jsonrpc: '2.0',
            method: RPCMethod.GetSmartContractSubState,
            params: [
              this.toValidChecksumAddress(contract),
              'balances',
              [legacyAddr],
            ],
          },
          GET_BALANCE_TYPE,
        );

        const balance =
          contractSubState &&
          contractSubState.result &&
          contractSubState.result.balances[legacyAddr];

        return { contract, balance };
      })
      .filter(Boolean);

    return Promise.all(balances);
  }

  getInfoUrl(address) {
    return ''; // base url
  }

  getInfoMethod() {
    return 'POST';
  }

  getInfoParams(address) {
    return {
      id: 'atomic',
      jsonrpc: '2.0',
      method: RPCMethod.GetBalance,
      params: [address],
    };
  }

  /**
   * Returs rewars from all delegated validators
   * @param address
   * @param ssnContract
   * @param validators
   * @returns {Promise<{total: *, validators: {}}|undefined>}
   */
  async getRewardsFromContract(address, ssnContract, { validators }) {
    const calculator = new RewardCalculator(this.config.baseUrl, ssnContract);
    const legacyAddr = `0x${this.toValidChecksumAddress(address)}`;

    const validatorsAddr = Object.keys(validators);

    if (validatorsAddr.length === 0) {
      return undefined;
    }

    const rewards = {
      total: '0',
      validators: {},
    };

    for (let index = 0; index < validatorsAddr.length; index += 1) {
      const validator = validatorsAddr[index];
      const reward = await calculator.getRewards(validator, legacyAddr);

      rewards.total = new this.wallet.BN(rewards.total).add(reward).toString();

      rewards.validators[validator] = reward.toString();
    }

    rewards.total = rewards.total.toString();

    return rewards;
  }

  /**
   * Returns all delegations from specified address
   *
   * @param address
   * @param contract
   * @returns {Promise<{validators: { address, amount }}>}
   */
  async getStakedAmountFromContract(address, ssnContract) {
    const legacyAddr = `0x${this.toValidChecksumAddress(address)}`;

    const subStateDepositResponse = await this.request(
      this.config.baseUrl,
      'POST',
      {
        id: 'atomic',
        jsonrpc: '2.0',
        method: RPCMethod.GetSmartContractSubState,
        params: [ssnContract, 'deposit_amt_deleg', [legacyAddr]],
      },
      GET_BALANCE_TYPE,
    );

    const subStateBufferedResponse = await this.request(
      this.config.baseUrl,
      'POST',
      {
        id: 'atomic',
        jsonrpc: '2.0',
        method: RPCMethod.GetSmartContractSubState,
        params: [ssnContract, 'buff_deposit_deleg', [legacyAddr]],
      },
      GET_BALANCE_TYPE,
    );

    const { deposit_amt_deleg = {} } =
      (subStateDepositResponse && subStateDepositResponse.result) || {};
    const { buff_deposit_deleg = {} } =
      (subStateBufferedResponse && subStateBufferedResponse.result) || {};

    return Object.keys(deposit_amt_deleg[legacyAddr] || {}).reduce(
      (acc, validator) => {
        acc.validators[validator] = {
          address: this.getBech32Address(validator),
          amount: deposit_amt_deleg[legacyAddr][validator],
          buffered:
            Object.keys(buff_deposit_deleg).length > 0 &&
            buff_deposit_deleg[legacyAddr][validator]
              ? Object.keys(buff_deposit_deleg[legacyAddr][validator]).length >
                0
              : false,
        };
        acc.total = new this.wallet.BN(acc.total)
          .add(new this.wallet.BN(deposit_amt_deleg[legacyAddr][validator]))
          .toString();

        return acc;
      },
      { validators: {}, total: '0' },
    );
  }

  /**
   * Returns unbonding amounts for every validators
   * @param address
   * @param ssnContract
   * @returns {Promise<{total: *, availableWithdrawal: {total: *}, pendingWithdrawal: {total: *}}|{}>}
   */
  async getWithdrawalsFromContract(address, ssnContract) {
    const legacyAddr = `0x${this.toValidChecksumAddress(address)}`;

    const { CurrentMiniEpoch } = await this.getBlockchainInfo();

    const subState = await this.request(
      this.config.baseUrl,
      'POST',
      {
        id: 'atomic',
        jsonrpc: '2.0',
        method: RPCMethod.GetSmartContractSubState,
        params: [ssnContract, 'withdrawal_pending', [legacyAddr]],
      },
      GET_BALANCE_TYPE,
    );

    const { withdrawal_pending = {} } = (subState && subState.result) || {};

    const withdrawals = {
      availableWithdrawal: { total: '0' },
      pendingWithdrawal: { total: '0' },
    };

    if (!withdrawal_pending[legacyAddr]) {
      return { ...withdrawals, total: '0' };
    }

    Object.keys(withdrawal_pending[legacyAddr] || {}).forEach((block) => {
      const blocksRange = Number(CurrentMiniEpoch) - Number(block);
      const withdrawal = withdrawal_pending[legacyAddr][block];

      if (blocksRange < STAKING_PENGING_RANGE) {
        withdrawals.pendingWithdrawal[block] = withdrawal;
        withdrawals.pendingWithdrawal.total = new this.wallet.BN(
          withdrawals.pendingWithdrawal.total,
        )
          .add(new this.wallet.BN(withdrawal))
          .toString();
      } else {
        withdrawals.availableWithdrawal[block] = withdrawal;
        withdrawals.availableWithdrawal.total = new this.wallet.BN(
          withdrawals.availableWithdrawal.total,
        )
          .add(new this.wallet.BN(withdrawal))
          .toString();
      }
    });

    const total = Object.keys(withdrawal_pending[legacyAddr] || {}).reduce(
      (acc, block) => {
        acc = new this.wallet.BN(acc)
          .add(new this.wallet.BN(withdrawal_pending[legacyAddr][block]))
          .toString();

        return acc;
      },
      '0',
    );

    return { ...withdrawals, total };
  }

  async getBlockchainInfo() {
    const { result } = await this.request(
      this.config.baseUrl,
      'POST',
      {
        id: 'atomic',
        jsonrpc: '2.0',
        method: RPCMethod.GetBlockchainInfo,
        params: [],
      },
      GET_BALANCE_TYPE,
    );

    return result;
  }

  modifyInfoResponse(data) {
    if (data.error && data.error.code !== ACCOUNT_NOT_CREATED_ERROR_CODE) {
      throw new ExplorerRequestError({
        type: GET_BALANCE_TYPE,
        error: new Error(
          `[${this.wallet.ticker}] modifyInfoResponse error: ${JSON.stringify(data.error)}`,
        ),
        instance: this,
      });
    }

    const { balance = '0', nonce = 0 } = data.result ?? {};

    return {
      balance,
      nonce,
    };
  }
}

export default ZilliqaNodeExplorer;
