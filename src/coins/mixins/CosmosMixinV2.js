import { ExplorerRequestError, WalletError } from 'src/errors';

import StakingMixin from './StakingMixin';
import { LazyLoadedLib, Amount } from '../../utils';
import { ATOM_MSG_TYPES, GET_TRANSACTIONS_TYPE, WALLET_ERROR } from '../../utils/const';
import { CosmosTxTypes } from '../libs';

const GAS_PRICE = '0.025';
const ESTIMATED_GAS_COEFFICIENT = 2.0;

/** @enum */
const SEND_TYPE = {
  STAKE: 'Stake',
  UNSTAKE: 'Unstake',
  REDELEGATE: 'Redelegate',
  CLAIM: 'Claim',
};

const getMessagesForSendType = ({
  sendType,
  fromAddress,
  address: toAddress,
  delegatorAddress,
  validator,
  fromValidator = null,
  validatorsList = [],
  amount,
  denom,
}) => {
  const messagesForSendType = {
    [SEND_TYPE.STAKE]: [
      {
        typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
        value: {
          delegatorAddress,
          validatorAddress: validator,
          amount: { denom, amount },
        },
      },
    ],
    [SEND_TYPE.UNSTAKE]: [
      {
        typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
        value: {
          delegatorAddress,
          validatorAddress: validator,
          amount: { denom, amount },
        },
      },
    ],
    [SEND_TYPE.REDELEGATE]: [
      {
        typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
        value: {
          delegatorAddress,
          validatorSrcAddress: fromValidator,
          validatorDstAddress: validator,
          amount: { denom, amount },
        },
      },
    ],
    [SEND_TYPE.CLAIM]: validatorsList.map((validatorForClaim) => ({
      typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
      value: {
        delegatorAddress,
        validatorAddress: validatorForClaim,
      },
    })),
  };

  const messagesForSimpleSend = [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress,
        toAddress,
        amount: [{ denom, amount }],
      },
    },
  ];

  return messagesForSendType[sendType] ?? messagesForSimpleSend;
};

const CosmosMixinV2 = (superclass) =>
  class extends StakingMixin(superclass) {
    #privateKey;

    constructor(config) {
      config.dependencies = {
        bech32: new LazyLoadedLib(() => import('bech32')),
        proto: new LazyLoadedLib(() => import('@cosmjs/proto-signing')),
        stargate: new LazyLoadedLib(() => import('@cosmjs/stargate')),
        tx: new LazyLoadedLib(() => import('cosmjs-types/cosmos/tx/v1beta1/tx')),
        crypto: new LazyLoadedLib(() => import('@cosmjs/crypto')),
        bitcoinjsLib: new LazyLoadedLib(() => import('bitcoinjs-lib')),
        ...(config.dependencies || {}),
      };

      super(config);
      this.gasPrice = config.feeData.gasPrice || GAS_PRICE;
      this.useGasEstimate = config.feeData.useGasEstimate || false;
      this.estimatedGasCoefficient = config.feeData.estimatedGasCoefficient || ESTIMATED_GAS_COEFFICIENT;
    }

    async loadWallet(seed, mnemonic) {
      const bitcoinjsLib = await this.loadLib('bitcoinjsLib');

      const hdPrivateKey = bitcoinjsLib.bip32.fromSeed(seed);
      const bech32 = await this.loadLib('bech32');
      const key = hdPrivateKey.derivePath(this.derivation);

      if (!key) {
        throw new WalletError({
          type: WALLET_ERROR,
          error: new Error("can't get a privateKey!"),
          instance: this,
        });
      }

      const publicKeyHash = bitcoinjsLib.crypto.hash160(key.publicKey);

      const privateKeyHex = `0x${Buffer.from(key.privateKey).toString('hex')}`;

      this.#privateKey = privateKeyHex;
      this.address = bech32.encode(this.prefix, bech32.toWords(publicKeyHash));

      this.setPrivateKey(privateKeyHex, mnemonic);

      return {
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      };
    }

    /**
     * Validates wallet address
     *
     * @param {String} address The address
     * @return {Boolean}
     */
    async validateAddress(address) {
      const bech32 = await this.loadLib('bech32');

      try {
        const { prefix } = bech32.decode(address);

        return prefix === this.prefix;
      } catch (error) {
        // throw new Error(`Fail to validate ${this.ticker} address [${address}]`)
        return false;
      }
    }

    async getTransaction(txId) {
      return this.getProvider('history2').getTransaction(this.address, txId);
    }

    async getTransactions({ address = this.address, offset = 0, limit = this.explorer.defaultTxLimit, pageNum = 0 }) {
      this.transactions = await this.getProvider('history2')
        .getTransactions({ address, offset, limit, pageNum, denom: this.denom })
        .catch((error) => {
          throw new ExplorerRequestError({
            type: GET_TRANSACTIONS_TYPE,
            error,
            instance: this,
          });
        });

      return this.transactions;
    }

    async getTransactionBlueprint({ type, ...params }) {
      if (CosmosTxTypes[type]) {
        return CosmosTxTypes[type](params);
      }

      if (type === ATOM_MSG_TYPES.Withdraw) {
        return this.getProvider('send2').getTransactionRewardsBlueprint({
          from: this.address,
          ...params,
        });
      }

      throw new Error(`[${this.ticker}] no ${type} tx blueprint found`);
    }

    async sign(messages, fee, memo = '') {
      const { SigningStargateClient } = await this.loadLib('stargate');

      this.signer = this.signer || (await SigningStargateClient.offline(this.wallet));
      const signerData = await this.getProvider('send2').getSignerData(this.address);

      return this.signer.signDirect(this.address, messages, fee, memo, signerData);
    }

    async createTransaction({ address, amount, memo = '' }) {
      const { feeObj, messages } = await this.getFeeObjectWithMessages({
        address,
        amount,
        memo,
      });

      return this.sign(messages, feeObj, memo);
    }

    async sendTransaction(txRaw) {
      const { TxRaw } = await this.loadLib('tx');

      const txBytes = TxRaw.encode(txRaw).finish();

      return this.getProvider('send2').sendTransaction(txBytes);
    }

    async createDelegationTransaction(validator, amount, memo = '') {
      const { feeObj, messages } = await this.getFeeObjectWithMessages({
        sendType: SEND_TYPE.STAKE,
        validator,
        amount,
        memo,
      });

      return this.sign(messages, feeObj, memo);
    }

    async createRedelegationTransaction(fromValidator, validator, amount, memo = '') {
      const { feeObj, messages } = await this.getFeeObjectWithMessages({
        sendType: SEND_TYPE.REDELEGATE,
        fromValidator,
        validator,
        amount,
        memo,
      });

      return this.sign(messages, feeObj);
    }

    async createUnbondingDelegationTransaction(validator, amount) {
      const { feeObj, messages } = await this.getFeeObjectWithMessages({
        sendType: SEND_TYPE.UNSTAKE,
        validator,
        amount,
      });

      return this.sign(messages, feeObj);
    }

    async createWithdrawDelegationTransaction(unusedValidator) {
      const validatorsList = await this.getProvider('balance2').getValidators(this.address);

      const { feeObj, messages } = await this.getFeeObjectWithMessages({
        sendType: SEND_TYPE.CLAIM,
        validatorsList,
      });

      return this.sign(messages, feeObj);
    }

    async getInfo() {
      this.balance = this.calculateAvailableBalance(
        await this.getProvider('balance2').getTotalBalance(this.address),
      ).toBN();

      await this.getStakingInfo();

      return {
        balance: this.balance,
        balances: this.balances,
      };
    }

    async fetchStakingInfo() {
      const explorer = this.getProvider('balance2');

      await explorer.getLatestBlock();

      const stakedValidators = {};
      const staked = this.calculateStakedBalance(await explorer.getStakedDelegations(this.address), stakedValidators);

      return {
        rewards: this.calculateRewards(await explorer.getRewardsBalance(this.address)),
        staked,
        unstaking: this.calculateUnstakingBalance(await explorer.getUnbondingDelegations(this.address)),
        validators: stakedValidators,
      };
    }

    // @TODO `total` param is not passed from `StakingMixin::makeStakingInfoStruct::calculateAvailableForStake`
    // probably it should be `balance`?
    async calculateAvailableForStake({ balance }) {
      const fee = await this.getFee({ sendType: SEND_TYPE.STAKE });

      const available = balance.toBN().sub(new this.BN(fee)).sub(new this.BN(this.reserveForStake));

      return new Amount(available.isNeg() ? '0' : available, this);
    }

    calculateTotal({ balance, staked, unstaking, rewards }) {
      return new Amount(balance.toBN().add(staked.toBN()).add(unstaking.toBN()).add(rewards.toBN()).toString(), this);
    }

    calculateAvailableBalance(available) {
      return new Amount(available.find((balance) => balance.denom === this.denom)?.amount ?? '0', this);
    }

    calculateRewards(rewards) {
      return new Amount(rewards?.find((reward) => reward.denom === this.denom)?.amount?.split('.')[0] ?? '0', this);
    }

    calculateStakedBalance(delegations, stakedValidators) {
      return new Amount(
        delegations?.length > 0 ? this.getTotalDelegations(delegations, stakedValidators).toString() : '0',
        this,
      );
    }

    calculateUnstakingBalance(delegations) {
      const unbonding = { validators: {} };

      if (delegations?.length > 0) {
        const totalUnbonding = delegations.reduce((total, { entries, validator_address: validatorAddress }) => {
          const moniker = validatorAddress;

          unbonding.validators[moniker] = entries
            .map((entry) => new this.BN(entry.balance.split('.')[0]))
            .reduce((prev, cur) => prev.add(new this.BN(cur)), new this.BN('0'));

          return total.add(unbonding.validators[moniker]);
        }, new this.BN('0'));

        unbonding.total = totalUnbonding.toString().split('.')[0];
      }

      return new Amount(unbonding.total || '0', this);
    }

    getTotalDelegations(delegations, stakedValidators) {
      return delegations.reduce((total, { delegation, balance }) => {
        stakedValidators[delegation.validator_address] = {
          address: delegation.validator_address,
          staked: new Amount(new this.BN(balance.amount), this),
        };

        return total.add(new this.BN(balance.amount));
      }, new this.BN('0'));
    }

    /**
     * Sets the private key.
     *
     * @param {String} privateKey The private key WIF
     */
    async setPrivateKey(privateKey, mnemonic) {
      const { stringToPath } = await this.loadLib('crypto');
      const { DirectSecp256k1HdWallet } = await this.loadLib('proto');

      this.#privateKey = privateKey;
      const path = stringToPath(this.derivation);

      DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        hdPaths: [path],
        prefix: this.prefix,
      }).then((wallet) => {
        this.wallet = wallet;
      });
    }

    /**
     * Whether re-delegation to another validator is supported
     *
     * @returns {boolean}
     */
    isRedelegationSupported() {
      return true;
    }

    /**
     * @typedef AmountObj
     * @type {object}
     *  @property {string} denom
     *  @property {string} amount - Number in string
     */

    /**
     * @typedef FeeObj
     * @type {object}
     *  @property {AmountObj[]} amount
     *  @property {string} gas
     */

    /**
     * @typedef FeeObjWithMessages
     * @type {object}
     *  @property {FeeObj} feeObj
     *  @property {object[]} messages
     */

    /**
     * Gets gas estimation by transaction simulation
     * @param {object}[] messages
     * @param {string} [memo]
     * @returns {Promise<string>} - Number in string
     */
    async getGasEstimation(messages, memo) {
      const fee = {
        amount: [{ denom: this.denom, amount: '0' }],
        gas: '0',
      };
      const [signedRawTx, { TxRaw }] = await Promise.all([this.sign(messages, fee, memo), this.loadLib('tx')]);

      const txBytes = TxRaw.encode(signedRawTx).finish();

      const estimatedGas = Number(await this.getProvider('send2').getGasEstimation(txBytes));

      return String(Math.round(estimatedGas * this.estimatedGasCoefficient));
    }

    /**
     * @typedef FeeParams
     * @type object
     * @property {SEND_TYPE} sendType
     * @property {string} [address] - To address - only for simple send (coin)
     * @property {string} [validator],
     * @property {string} [fromValidator = null],
     * @property {object} [validatorsList[] = []],
     * @property {string} [amount],
     * @property {string} [memo='']
     */

    /**
     * Retrieve the gas fee from the configuration based on the provided send type.
     *
     * @param {SEND_TYPE} sendType - The type of send operation.
     * @returns {string} The gas fee based on the send type.
     */
    getGasFromConfig(sendType) {
      switch (sendType) {
        case SEND_TYPE.STAKE:
          return this.stakingFeeGas;
        case SEND_TYPE.UNSTAKE:
          return this.stakingFeeGas;
        case SEND_TYPE.REDELEGATE:
          return this.reStakingFeeGas;
        case SEND_TYPE.CLAIM:
          return this.claimFeeGas;
        default:
          return this.stakingFeeGas;
      }
    }

    /**
     * Gets fee object
     * @param {FeeParams} params
     * @returns {Promise<FeeObjWithMessages>}
     */
    async getFeeObjectWithMessages({
      sendType,
      address,
      validator,
      fromValidator = null,
      validatorsList = [],
      amount,
      memo = '',
    }) {
      const messages = getMessagesForSendType({
        sendType,
        fromAddress: this.address,
        address,
        delegatorAddress: this.address,
        validator,
        fromValidator,
        validatorsList,
        amount,
        denom: this.denom,
      });

      if (!this.useGasEstimate) {
        const gasFromConfig = this.getGasFromConfig(sendType);

        return {
          feeObj: {
            amount: [{ denom: this.denom, amount: this.fee }],
            gas: gasFromConfig,
          },
          messages,
        };
      }

      const [{ calculateFee, GasPrice }, estimatedGas] = await Promise.all([
        this.loadLib('stargate'),
        this.getGasEstimation(messages, memo).catch((error) => {
          console.warn(error);
          return this.getGasFromConfig(sendType);
        }),
      ]);

      const gasPrice = GasPrice.fromString(`${this.gasPrice}${this.denom}`);

      const feeObj = calculateFee(Number(estimatedGas), gasPrice);

      return { feeObj, messages };
    }

    /**
     * Retrieves another validator from the list of predefined validators that differs from the specified validator
     *
     * @param {string} validatorAddress - The address of the validator.
     * @returns {Promise<string>} - Different validator address.
     * @throws {Error} when not found another validator
     */
    async getDifferentFromSpecifiedValidator(validatorAddress) {
      const predefinedValidators = await this.getPredefinedValidators();

      const differentFromSpecifiedValidator = predefinedValidators.find(
        (validator) => validator.address !== validatorAddress,
      );

      if (differentFromSpecifiedValidator) {
        return differentFromSpecifiedValidator.address;
      }

      throw new Error('Different validator Not Found');
    }

    /**
     * Retrieves the fee for a specific send type.
     *
     * @param {FeeParams} [feeParams={}]
     * @returns Promise<{string}> Number in string
     */
    async getFee({ sendType, address, validator, fromValidator, amount = '1', memo = '' } = {}) {
      if (!this.useGasEstimate) {
        return this.fee;
      }

      const validatorsList = await this.getProvider('balance2').getValidators(this.address);

      let toValidator;
      let fromValidatorForRedelegateOnly;

      if (sendType === SEND_TYPE.REDELEGATE) {
        fromValidatorForRedelegateOnly = fromValidator ?? validator ?? validatorsList[0];
        toValidator =
          validatorsList[1] ?? (await this.getDifferentFromSpecifiedValidator(fromValidatorForRedelegateOnly));
      } else {
        toValidator = validator || validatorsList[0];
      }

      const { feeObj } = await this.getFeeObjectWithMessages({
        sendType,
        address: address || this.address,
        validator: toValidator,
        fromValidator: fromValidatorForRedelegateOnly,
        validatorsList,
        amount,
      });

      return feeObj?.amount[0]?.amount;
    }
  };

export default CosmosMixinV2;
