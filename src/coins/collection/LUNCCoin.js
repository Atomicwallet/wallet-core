import BigNumber from 'bignumber.js';
import { Coin } from 'src/abstract';
import TerraClassicFCDExplorer from 'src/explorers/collection/TerraClassicFCDExplorer';
import TerraClassicLCDExplorer from 'src/explorers/collection/TerraClassicLCDExplorer';
import TerraMantleExplorer from 'src/explorers/collection/TerraMantleExplorer';
import LUNCToken from 'src/tokens/LUNCToken';
import { Amount, LazyLoadedLib } from 'src/utils';
import { ConfigKey } from 'src/utils/configManager';

import TOKENS_CACHE from '../../resources/eth/tokens.json';
import { HasProviders, HasTokensMixin, StakingMixin } from '../mixins';

export const LUNC_SEND_TYPES = {
  SEND: 'send',
  STAKE: 'stake',
  UNSTAKE: 'unstake',
  CLAIM: 'claim',
};

const NAME = 'Terra Classic';
const TICKER = 'LUNC';
const DERIVATION = "m/44'/330'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';
const DENOM = 'uluna';
const MOCK_TERRA_ADDRESS = 'terra1y6z0mzhlgkxr6q0xrykqalce3vhnvujurv96e6';
const MOCK_TERRA_VALIDATOR = 'terravaloper1qqu376azltyc5wnsje5qgwru5mtj2yqdhar97v';
const FALLBACK_GASLIMIT = {
  [LUNC_SEND_TYPES.SEND]: 120000,
  [LUNC_SEND_TYPES.STAKE]: 800000,
  [LUNC_SEND_TYPES.UNSTAKE]: 800000,
  [LUNC_SEND_TYPES.CLAIM]: 3500000,
  max: 3500000,
};
const FALLBACK_GASPRICE = { uluna: '60' };
const TERRA_SDK = 'terraSdk';

/**
 * Class for classic Terra 1.0
 *
 * @class LUNCCoin
 */
class LUNCCoin extends StakingMixin(HasProviders(HasTokensMixin(Coin))) {
  #privateKey;

  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, isTestnet, id }) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      txWebUrl,
      explorers,
      socket,
      feeData,
      denom: DENOM,
      dependencies: {
        [TERRA_SDK]: new LazyLoadedLib(() => import('@terra-money/terra.js')),
      },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([TerraClassicLCDExplorer, TerraClassicFCDExplorer, TerraMantleExplorer]);

    this.loadExplorers(config);

    this.setFeeData(feeData);

    this.BigNumber = BigNumber;
    this.bannedTokens = [];
    this.isTestnet = isTestnet;

    this.fields.paymentId = true;
    this.tokens = {};
    this.nonce = 0;

    this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
      this.eventEmitter.emit('socket::tx::confirmed', { id: coinId, ticker });
    });
  }

  /**
   * @typedef TerraSdk
   * @type {object}
   * @property {import('@terra-money/terra.js').RawKey} RawKey
   * @property {import('@terra-money/terra.js').MsgSend} MsgSend
   * @property {import('@terra-money/terra.js').AccAddress} AccAddress
   * @property {import('@terra-money/terra.js').MnemonicKey} MnemonicKey
   * @property {import('@terra-money/terra.js').MsgDelegate} MsgDelegate
   * @property {import('@terra-money/terra.js').MsgUndelegate} MsgUndelegate
   * @property {import('@terra-money/terra.js').Coin} Coin
   * @property {import('@terra-money/terra.js').MsgWithdrawDelegatorReward} MsgWithdrawDelegatorReward
   * @property {import('@terra-money/terra.js').MsgBeginRedelegate} MsgBeginRedelegate
   * @property {import('@terra-money/terra.js').Fee} Fee
   */

  /**
   * @async
   * @returns {Promise<TerraSdk>}
   */
  loadLib() {
    return super.loadLib(TERRA_SDK);
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.gasLimit = feeData.gasLimit;
    this.gasLimitCoefficient = feeData.gasLimitCoefficient;
    this.gasPriceCoefficient = feeData.gasPriceCoefficient;
    this.reserveForStake = feeData.reserveForStake;
    this.resendTimeout = feeData.resendTimeout;
    this.gasPrices = {
      uluna: feeData.defaultGasPrice?.uluna || FALLBACK_GASPRICE.uluna,
    };
  }

  isFeeDynamic() {
    return true;
  }

  getTickerFromContractAddress(contractAddress) {
    return this.tokens[contractAddress]?.ticker;
  }

  createToken(args) {
    return new LUNCToken({
      parent: this,
      ...args,
      config: { ...this.feeData, ...args.config },
    });
  }

  /**
   * List to be exluded from wallets list
   * @return {string[]} array of tickers
   */
  getExcludedTokenList() {
    return [];
  }

  /**
   *
   * @param {*} token - token object
   * @returns {boolean} - true if excluded
   */
  isTokenExcluded(token) {
    const parsedContract = token.contract?.toLowerCase();
    const parsedDenom = token.denom?.toLowerCase();

    return !this.getExcludedTokenList().some(
      ({ denom, contract }) =>
        (parsedDenom && parsedDenom === denom) || (parsedContract && parsedContract === contract),
    );
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed, phrase) {
    const { MnemonicKey } = await this.loadLib();
    const key = new MnemonicKey({ mnemonic: phrase });

    await this.setPrivateKey(key.privateKey.toString('hex'));

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * The address getter
   *
   * @return {string} { description_of_the_return_value }
   */
  getAddress() {
    return this.#privateKey ? this.address : new Error(`${this.ticker} private key is empty`);
  }

  /**
   * Validates wallet address
   *
   * @param {string} address The address
   * @return {Promise<boolean>}
   */
  async validateAddress(address) {
    const { AccAddress } = await this.loadLib();

    return AccAddress.validate(address);
  }

  createMsgPayloadBySendType(sendType, { amount, validators, denom }) {
    switch (sendType) {
      case LUNC_SEND_TYPES.STAKE:
        return {
          validator: MOCK_TERRA_VALIDATOR,
          amount: this.toMinimalUnit(amount),
        };

      case LUNC_SEND_TYPES.UNSTAKE:
        return { validator: MOCK_TERRA_VALIDATOR, amount };

      case LUNC_SEND_TYPES.CLAIM:
        return { validators };

      default:
        return {
          amount,
          fromAddress: this.address,
          toAddress: MOCK_TERRA_ADDRESS,
          denom,
        };
    }
  }

  /**
   * @async
   * @returns {Promise<*>[]|Promise<*>}
   */
  createMsgsBySendType(sendType, { validator, amount, toAddress, validators, denom }) {
    switch (sendType) {
      case LUNC_SEND_TYPES.STAKE:
        return [this.createMsgDelegate({ validator, amount })];

      case LUNC_SEND_TYPES.UNSTAKE:
        return [this.createMsgUndelegate({ validator, amount })];

      case LUNC_SEND_TYPES.CLAIM:
        return this.createMsgsWithdraw({ validators });

      default:
        return [
          this.createMsgSend({
            amount,
            fromAddress: this.address,
            toAddress,
            denom,
          }),
        ];
    }
  }

  async createMsgSend({ amount, fromAddress, toAddress, denom }) {
    const { MsgSend } = await this.loadLib();

    return new MsgSend(fromAddress, toAddress, {
      [denom]: amount,
    });
  }

  async createMsgDelegate({ validator, amount }) {
    const { Coin: TerraAmount, MsgDelegate } = await this.loadLib();
    const terraAmount = new TerraAmount(this.denom, String(amount));

    return new MsgDelegate(this.address, validator, terraAmount);
  }

  async createMsgRedelegate({ fromValidator, validator, amount }) {
    const { Coin: TerraAmount, MsgBeginRedelegate } = await this.loadLib();
    const terraAmount = new TerraAmount(this.denom, String(amount));

    return new MsgBeginRedelegate(this.address, fromValidator, validator, terraAmount);
  }

  async createMsgUndelegate({ validator, amount }) {
    const { Coin: TerraAmount, MsgUndelegate } = await this.loadLib();
    const terraAmount = new TerraAmount(this.denom, String(amount));

    return new MsgUndelegate(this.address, validator, terraAmount);
  }

  async createMsgsWithdraw({ validators }) {
    const { MsgWithdrawDelegatorReward } = await this.loadLib();

    return validators.map((validator) => {
      return new MsgWithdrawDelegatorReward(this.address, validator);
    });
  }

  isToken(denom) {
    return this.denom !== denom;
  }

  /**
   * Gets the fee.
   *
   * @return {Promise<BN>} The fee.
   */
  async getFee({ custom, sendType, sendAmount, denom = this.denom, address = MOCK_TERRA_ADDRESS } = {}) {
    sendType = sendType?.toLowerCase() || LUNC_SEND_TYPES.SEND;

    try {
      const gasPrices = await this.getGasPricesList();

      const { fee, tax } = await this.estimateFeeAndTax({
        sendType,
        amount: sendAmount || this.indivisibleBalance.toString(),
        gasPrices,
        address,
        denom,
        memo: custom,
      });

      if (fee.amount[0].denom === tax.denom) {
        return (Number(fee.amount[0].amount) + Number(tax.amount)).toString();
      }

      return fee.amount[0].amount;
    } catch (error) {
      // @TODO implement logger

      const gasLimit = Number(this.gasLimit?.[sendType]) || FALLBACK_GASLIMIT[sendType] || FALLBACK_GASLIMIT.max;
      const gasPrice = Number(this.gasPrices?.uluna) || Number(FALLBACK_GASPRICE.uluna);

      return (gasLimit * gasPrice).toFixed(0);
    }
  }

  async estimateFeeAndTax({ sendType, gasLimit, amount, gasPrices, msgs, address, denom, memo }) {
    if (!msgs) {
      let validators;

      if (sendType === LUNC_SEND_TYPES.CLAIM) {
        [validators] = await this.getProvider('balance').getValidators(this.address);
        validators = validators.map(({ operator_address: addr }) => addr);
      }

      const payload = this.createMsgPayloadBySendType(sendType, {
        amount,
        validators,
        fromAddress: this.address,
        toAddress: address,
        denom,
      });

      msgs = await this.createMsgsBySendType(sendType, payload);
    }

    const { Coin: TerraAmount } = await this.loadLib();
    const [fee, tax] = await Promise.all([
      this.getProvider('estimate_fee').estimateFee(await this.getSigners(), {
        msgs,
        gas: gasLimit ?? 'auto',
        gasPrices,
        gasAdjustment: this.gasLimitCoefficient || 8,
        feeDenoms: ['uluna'],
        memo,
      }),
      sendType === LUNC_SEND_TYPES.SEND
        ? (await this.getProvider('estimate_fee').calculateTax(new TerraAmount(denom, amount))).toAmino()
        : { denom, amount: '0' },
    ]);

    return { fee: fee.toAmino(), tax };
  }

  async getSigners() {
    const accountInfo = await this.getProvider('node').getAccountInfo(this.address);

    return [
      {
        sequenceNumber: accountInfo.getSequenceNumber(),
        publicKey: accountInfo.getPublicKey(),
      },
    ];
  }

  /**
   * Return available balance for send
   *
   * @return {Promise<string>}
   */
  async availableBalance(fees) {
    return this.BigNumber(this.balance).isGreaterThan(0)
      ? this.toCurrencyUnit(
          this.BigNumber(this.balance)
            .minus(fees || 0)
            .toFixed(),
        )
      : '0';
  }

  /**
   * Creates a transaction.
   *
   * @param {string} address The destination address
   * @param {number} amount The amount to send
   * @param {string} gasLimit
   * @param {number} multiplier coefficient
   * @return {Promise<string>} Raw transaction
   */
  async createTransaction({ memo, amount, address, denom = this.denom, sendType }) {
    sendType = sendType?.toLowerCase() || LUNC_SEND_TYPES.SEND;

    const [sendMsg, gasPrices, { Fee }] = await Promise.all([
      this.createMsgSend({
        amount,
        fromAddress: this.address,
        toAddress: address,
        denom,
      }),
      this.getGasPricesList().catch((error) => {
        console.error(error);
        return this.gasPrices;
      }),
      this.loadLib(),
    ]);

    const { fee: estimatedFee, tax } = await this.estimateFeeAndTax({
      amount,
      sendType,
      gasPrices,
      msgs: [sendMsg],
      denom,
    });

    const coins = estimatedFee.amount;

    if (coins[0].denom === tax.denom) {
      coins[0].amount = Number(coins[0].amount) + Number(tax.amount);
    } else {
      coins.push(tax);
    }

    const fee = Fee.fromAmino(estimatedFee);

    return this.createAndSignTx({
      msgs: [sendMsg],
      memo,
      fee,
    });
  }

  /**
   * Returns user token list data
   * @returns {Promise<string[]>}
   */
  async getUserTokenList(...args) {
    try {
      const [tokens, denoms] = await Promise.all([
        this.getProvider('token').getUserTokenList(
          this.address,
          true, // isClassic
          ...args,
        ),
        this.getProvider('denom').getUserDenomList(this.address, ...args),
      ]);

      const existedTickers = Object.values(this.tokens)
        .map((token) => token.ticker)
        .concat(this.ticker);

      return tokens.concat(denoms).filter((denom) => !existedTickers.includes(denom.symbol));
    } catch (error) {
      error.message = `[${this.ticker}] getUserTokenList error: ${error.message || 'Unknown error'}.`;
      // @TODO implement logger
      return [];
    }
  }

  /**
   * Returns all token list data
   * @returns {Promise<Array>}
   */
  async getTokenList() {
    const tokens = await this.configManager?.get(ConfigKey.LunaClassicTokens);

    return tokens ?? TOKENS_CACHE;
  }

  /**
   * Maps from user token list to internal token format
   * @returns {Promise<Array>}
   */
  getTokenFromUserList(token, source) {
    return {
      ...this.getTokenBase(token),
      visibility: true,
      denom: token.denom,
      source,
    };
  }

  getTokenBase(token) {
    const contract = token.contract?.toLowerCase();

    return {
      name: token.name,
      ticker: token.ticker,
      decimal: Number(token.decimal) || 0,
      contract,
      parentTicker: this.ticker,
      uniqueField: contract,
      confirmed: token.confirmed,
      // The 'notify' field is for Atomic's internal use, explorers (the source of the 'user list') does not have it.
      // But we don't need to change this value, as it can be set in the native token list for this token.
      notify: token.notify,
    };
  }

  /**
   * Maps from common token list to internal token format
   * @returns {Promise<Array>}
   */
  getTokenFromCommonList(token, source) {
    return {
      ...this.getTokenBase(token),
      visibility: token.visibility !== false,
      denom: token.denom.toLowerCase(),
      source,
      notify: Boolean(token.notify),
    };
  }

  gasPrice() {
    return this.getGasPrice();
  }

  async setPrivateKey(privateKey, mnemonic) {
    const { RawKey } = await this.loadLib();
    const key = new RawKey(Buffer.from(privateKey, 'hex'));

    this.#privateKey = key.privateKey.toString('hex');
    this.address = key.accAddress;
    this.publicKey = key.publicKey.key;
    this.rawKey = key;
  }

  getGasRange(sendType = 'send') {
    return this.feeData[sendType];
  }

  async getInfo(tokenInfo) {
    this.getGasPricesList().then((gasPrices) => {
      this.gasPrices = gasPrices;
    });

    if (!tokenInfo || (!tokenInfo.onlyCoin && tokenInfo.isToken !== false)) {
      const denom = tokenInfo
        ? Object.values(this.tokens).find((token) => token.ticker === tokenInfo.ticker)?.denom
        : null;

      const tokensInfo = tokenInfo
        ? {
            [tokenInfo.contract || tokenInfo.ticker]: {
              denom,
              ...tokenInfo,
            },
          }
        : this.tokens;

      await Promise.all(
        Object.values(tokensInfo).map(async (info) => {
          try {
            let tokenBalance;

            if (info.contract) {
              tokenBalance = await this.getProvider('node').getTokenBalanceByContractAddress({
                address: this.address,
                contractAddress: info.contract.toLowerCase(),
              });
            } else if (info.denom) {
              tokenBalance = await this.getProvider('balance').getBalance(this.address, false, info.denom);
            }

            if (!tokenBalance) {
              throw new Error(
                `${this.ticker} can't get balance of token with ${info.contract ? 'contract address' : 'denom'}
                ${info.contract || info.denom}`,
              );
            }

            [info.contract, info.contract?.toLowerCase(), info.ticker]
              .filter((contractOrTicker) => contractOrTicker && this.tokens[contractOrTicker])
              .forEach((contractOrTicker) => {
                this.tokens[contractOrTicker].balance = tokenBalance.toString();
              });
          } catch (error) {
            // @TODO implement logger
          }
        }),
      );
    }

    try {
      const balance = await this.getProvider('balance').getBalance(this.address, false, this.denom);

      if (typeof balance !== 'string') {
        throw new TypeError(`[${this.ticker}] can't get balance`);
      }

      this.balance = balance;
    } catch (error) {
      // @TODO implement logger
    }

    try {
      await this.getStakingInfo();
    } catch (error) {
      console.warn('Could not get staking info');
      // @TODO implement logger
    }

    return { balance: this.balance };
  }

  async createTokenTransaction({ memo, denom, amount, address, multiplier }) {
    return this.createTransaction({
      memo,
      denom,
      amount,
      address,
      multiplier,
    });
  }

  async getGasPrice(withoutCoeff = false, isToken = false) {
    try {
      this.gasPrices = await this.getGasPricesList();
    } catch (error) {
      // @TODO implement logger
    }

    const { uluna } = this.gasPrices;

    return new this.BN(uluna.split('.')[0]);
  }

  /**
   * Gets gas prices from atomic services
   *
   * @async
   * @returns {Promise<Object.<string, string>>}
   */
  getGasPricesList() {
    return this.configManager?.get(ConfigKey.LunaClassicGasPrice);
  }

  async getBalance() {
    return (await this.getInfo()).balance;
  }

  async createAndSignTx(payload) {
    return this.getProvider('node').getLcdWallet(this.rawKey).createAndSignTx(payload);
  }

  async createDelegationTransaction(validator, amount, memo = '') {
    const msg = await this.createMsgDelegate({ validator, amount });
    const { uluna } = this.gasPrices;

    return this.createAndSignTx({
      msgs: [msg],
      memo,
      gasPrices: { uluna },
      feeDenoms: ['uluna'],
    });
  }

  async createRedelegationTransaction(fromValidator, validator, amount, memo = '') {
    const msg = await this.createMsgRedelegate({
      fromValidator,
      validator,
      amount,
    });
    const { uluna } = this.gasPrices;

    return this.createAndSignTx({
      msgs: [msg],
      memo,
      gasPrices: { uluna },
      feeDenoms: ['uluna'],
    });
  }

  async createUnbondingDelegationTransaction(validator, amount, memo = '') {
    const msg = await this.createMsgUndelegate({ validator, amount });
    const { uluna } = this.gasPrices;

    return this.createAndSignTx({
      msgs: [msg],
      gasPrices: { uluna },
      feeDenoms: ['uluna'],
      memo,
    });
  }

  async createWithdrawDelegationTransaction(memo = '') {
    const [validators] = await this.getProvider('balance').getValidators(this.address);

    const msgs = await this.createMsgsWithdraw({
      validators: validators.map(({ operator_address: address }) => address),
    });
    const { uluna } = this.gasPrices;

    return this.createAndSignTx({
      msgs,
      gasPrices: { uluna },
      feeDenoms: ['uluna'],
      memo,
    });
  }

  async sendTransaction(rawtx) {
    const txResult = await this.getProvider('send').sendTransaction(rawtx);

    if (txResult.code !== undefined) {
      throw new Error(txResult.raw_log);
    }

    return { txid: txResult.txhash };
  }

  async fetchStakingInfo() {
    const explorer = this.getProvider('balance');

    const stakedValidators = {};
    const [staked, rewards, unstaking] = await Promise.all([
      this.calculateStakedBalance(await explorer.getStakedDelegations(this.address), stakedValidators),
      this.calculateRewards(await explorer.getRewardsBalance(this.address)),
      this.calculateUnstakingBalance(await explorer.getUnbondingDelegations(this.address)),
    ]);

    return {
      rewards,
      staked,
      unstaking,
      validators: stakedValidators,
    };
  }

  async calculateAvailableForStake({ balance }) {
    const fee = (
      (Number(this.gasLimit?.[LUNC_SEND_TYPES.STAKE]) || FALLBACK_GASLIMIT[LUNC_SEND_TYPES.STAKE]) *
      (Number(this.gasPrices?.uluna) || Number(FALLBACK_GASPRICE.uluna))
    ).toFixed(0);
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
    return new Amount(rewards.total?._coins?.uluna?.amount?.toString().split('.')[0] || '0', this);
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
          .map((entry) => new this.BN(entry.balance.toString()))
          .reduce((prev, cur) => prev.add(new this.BN(cur)), new this.BN('0'));

        return total.add(unbonding.validators[moniker]);
      }, new this.BN('0'));

      unbonding.total = totalUnbonding;
    }

    return new Amount(unbonding.total || '0', this);
  }

  getTotalDelegations(delegations, stakedValidators) {
    return delegations.reduce((total, { validator_address: address, balance }) => {
      stakedValidators[address] = {
        address,
        staked: new Amount(new this.BN(balance.amount.toString()), this),
      };

      return total.add(new this.BN(balance.amount.toString()));
    }, new this.BN('0'));
  }

  /**
   * Whether re-delegation to another validator is supported
   *
   * @returns {boolean}
   */
  isRedelegationSupported() {
    return true;
  }
}

export default LUNCCoin;
