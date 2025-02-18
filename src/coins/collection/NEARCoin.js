// docs: https://near.github.io/near-api-js/
import lodash from 'lodash';
import { Coin } from 'src/abstract';
import NearblocksExplorer from 'src/explorers/collection/NearblocksExplorer';
import NearRPCExplorer from 'src/explorers/collection/NearRPCExplorer';
import { Amount, LazyLoadedLib } from 'src/utils';
import sha256 from 'src/utils/sha256';

import { HasBlockScanner, HasProviders, StakingMixin } from '../mixins';

const nearApiLib = new LazyLoadedLib(() => import('near-api-js'));
const nearSeedPhraseLib = new LazyLoadedLib(() => import('near-seed-phrase'));

const NAME = 'NEAR Coin';
const TICKER = 'NEAR';
const DERIVATION = "m/44'/9000'/0'/0/0";
const DECIMAL = 24;

// Minimal balance (activation amount) from https://github.com/near/near-wallet/blob/95d188d3c359b03201b06fb38769a606bf1c7c75/packages/frontend/src/config/environmentDefaults/mainnet.js#L22
const ACCOUNT_ACTIVATION_AMOUNT = '100000000000000000000000';

// 0.1 NEAR
const DEFAULT_RESERVE_FOR_STAKE = '100000000000000000000000';

/**
 * Base gas price for staking includes effective margin and multiplier
 * https://docs.near.org/docs/concepts/gas
 */
const STAKING_GAS_BASE = '25000000000000';
const STAKING_GAS_MULTIPLIER = 5;

// Address pattern from https://docs.near.org/docs/concepts/account#account-id-rules
const ADDRESS_PATTERN = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/;
const ADDRESS_MIN_LENGTH = 2;
const ADDRESS_MAX_LENGTH = 64;

const UPDATE_BALANCE_INTERVAL = 5000;

/**
 * @class NEARCoin
 */
class NEARCoin extends StakingMixin(HasBlockScanner(HasProviders(Coin))) {
  #privateKey;

  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, network, id }, db, configManager) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      txWebUrl,
      explorers,
      socket,
      feeData,
      network,
    };

    super(config, db, configManager);

    this.derivation = DERIVATION;

    this.setExplorersModules([NearblocksExplorer, NearRPCExplorer]);

    this.loadExplorers(config);

    this.setFeeData(feeData);

    this.bannedTokens = [];
    this.unspendableBalance = '0';

    this.network = network;
    this.fields.paymentId = false;

    this.tokens = {};
    this.nonce = new this.BN('0');
    this.activationAmount = ACCOUNT_ACTIVATION_AMOUNT;
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.gasLimit = String(feeData.gasLimit);
    this.gasLimitCoefficient = feeData.gasLimitCoefficient || 0;
    this.gasPriceCoefficient = feeData.gasPriceCoefficient || 0;
    this.stakingGas = feeData.stakingGasLimit || STAKING_GAS_BASE;
    this.stakingGasCoefficient = feeData.stakingGasLimitCoefficient || STAKING_GAS_MULTIPLIER;
    this.defaultGasPrice = this.toMinimalUnit(feeData.defaultGasPrice || '');
    this.resendTimeout = feeData.resendTimeout;
    this.reserveForStake = feeData.reserveForStake ?? DEFAULT_RESERVE_FOR_STAKE;
  }

  get stakingGasLimit() {
    return new this.BN(this.stakingGas).mul(new this.BN(this.stakingGasCoefficient)).toString();
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed, phrase) {
    try {
      const nearAPI = await nearApiLib.get();
      const { parseSeedPhrase } = await nearSeedPhraseLib.get();

      const { KeyPair } = nearAPI;

      const keyPair = KeyPair.fromString(parseSeedPhrase(phrase).secretKey);

      this.keyPair = keyPair;
      this.#privateKey = keyPair.toString();

      this.address = Buffer.from(keyPair.getPublicKey().data).toString('hex');

      return {
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      };
    } catch (error) {
      // @TODO implement logger

      return this;
    }
  }

  /**
   * The address getter
   *
   * @return {String} { description_of_the_return_value }
   */
  getAddress() {
    return this.#privateKey ? this.address : new Error(`${this.wallet.ticker} private key is empty`);
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  validateAddress(address) {
    return (
      address.length >= ADDRESS_MIN_LENGTH && address.length <= ADDRESS_MAX_LENGTH && ADDRESS_PATTERN.test(address)
    );
  }

  /**
   * Create stake tx
   *
   * @param amount
   * @param validatorId
   * @param nonce
   * @returns {Promise<String>} base64 tx string
   */
  async createDelegationTransaction({ amount, validator, nonce }) {
    const nearAPI = await nearApiLib.get();

    const { transactions } = nearAPI;
    const publicKey = this.keyPair.getPublicKey();

    const accessKey = this.getAccessKey(publicKey);

    const recentBlockHash = nearAPI.utils.serialize.base_decode(accessKey.block_hash);

    const actions = [transactions.functionCall('deposit_and_stake', {}, this.stakingGasLimit, amount)];

    const tx = nearAPI.transactions.createTransaction(
      this.address,
      publicKey,
      validator,
      accessKey.nonce + 1,
      actions,
      recentBlockHash,
    );

    return this.serializeAndSignTransaction(tx);
  }

  /**
   * Creates unstake tx
   * Unstaking takes 2-3 epochs to complete.
   *
   * @param amount
   * @param validatorId
   * @param nonce
   * @returns {Promise<String>} base64 tx string
   */
  async createUnDelegationTransaction({ amount, validator, nonce }) {
    const nearAPI = await nearApiLib.get();

    const { transactions } = nearAPI;
    const publicKey = this.keyPair.getPublicKey();

    const accessKey = this.getAccessKey(publicKey);

    const recentBlockHash = nearAPI.utils.serialize.base_decode(accessKey.block_hash);

    const actions = [transactions.functionCall('unstake', { amount: amount ?? undefined }, this.stakingGasLimit, '0')];

    const tx = nearAPI.transactions.createTransaction(
      this.address,
      publicKey,
      validator,
      accessKey.nonce + 1,
      actions,
      recentBlockHash,
    );

    return this.serializeAndSignTransaction(tx);
  }

  /**
   * Creates withdraw tx
   * After the unstaking period of 2-3 epochs, you may withdraw your NEAR from staking pool.
   *
   * @param amount
   * @param validator
   * @param nonce
   * @returns {Promise<String>} base64 tx string
   */
  async createWithdrawDelegationTransaction({ validator, nonce }) {
    const nearAPI = await nearApiLib.get();

    const { transactions } = nearAPI;
    const publicKey = this.keyPair.getPublicKey();

    const accessKey = this.getAccessKey(publicKey);

    const recentBlockHash = nearAPI.utils.serialize.base_decode(accessKey.block_hash);

    const actions = [transactions.functionCall('withdraw_all', {}, this.stakingGasLimit, '0')];

    const tx = nearAPI.transactions.createTransaction(
      this.address,
      publicKey,
      validator,
      accessKey.nonce + 1,
      actions,
      recentBlockHash,
    );

    return this.serializeAndSignTransaction(tx);
  }

  getAccessKey(publicKey) {
    return this.getProvider('node').getAccessKey(this.address, publicKey);
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @param {String} paymentData The payment id (only HEX value!)
   * @param {String} gasLimit
   * @param {String} nonce
   * @param {String} userGasPrice
   * @param {Number} multiplier coefficient
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({ address, amount, nonce }) {
    const nearAPI = await nearApiLib.get();

    const publicKey = this.keyPair.getPublicKey();

    const accessKey = await this.getAccessKey();

    const recentBlockHash = nearAPI.utils.serialize.base_decode(accessKey.block_hash);

    const actions = [
      new nearAPI.transactions.Action({
        transfer: new nearAPI.transactions.Transfer({ deposit: amount }),
      }),
    ];

    const tx = nearAPI.transactions.createTransaction(
      this.address,
      publicKey,
      address,
      nonce || accessKey.nonce + 1,
      actions,
      recentBlockHash,
    );

    return this.serializeAndSignTransaction(tx);
  }

  /**
   * Serialize raw transaction
   *
   * @param rawTx
   * @returns {Promise<{rawTx: *, txHash: Uint8Array}>}
   */
  async serializeTransaction(rawTx) {
    const nearAPI = await nearApiLib.get();

    const serialized = nearAPI.utils.serialize.serialize(nearAPI.transactions.SCHEMA, rawTx);

    return {
      txHash: new Uint8Array(sha256(serialized, { asBytes: true })),
      rawTx,
    };
  }

  /**
   * Sign serialized transaction
   *
   * @param txHash
   * @param rawTx
   * @returns {Promise<string>}
   */
  async signTransaction({ txHash, rawTx }) {
    const nearAPI = await nearApiLib.get();

    const { signature } = this.keyPair.sign(txHash);

    const signedTransaction = new nearAPI.transactions.SignedTransaction({
      transaction: rawTx,
      signature: new nearAPI.transactions.Signature({
        keyType: rawTx.publicKey.keyType,
        data: signature,
      }),
    });

    return Buffer.from(signedTransaction.encode()).toString('base64');
  }

  /**
   * Serializes and sign transaction
   * @param rawTx
   * @returns {*}
   */
  async serializeAndSignTransaction(rawTx) {
    return this.signTransaction(await this.serializeTransaction(rawTx));
  }

  /**
   * Gets the fee.
   *
   * @return {Promise<BN>} The fee.
   */
  async getFee({ userGasPrice = null, gasLimit = null, contract, address } = {}) {
    return new this.BN(gasLimit || (await this.estimateGas(null, address, contract))).mul(
      new this.BN(userGasPrice || (await this.getGasPrice())),
    );
  }

  async getGasPrice(withoutCoeff = false, isToken = false) {
    const node = await this.getProvider('node').getGasPrice();

    return withoutCoeff
      ? new this.BN(node || this.defaultGasPrice)
      : new this.BN(node || this.defaultGasPrice).add(new this.BN(this.gasPriceCoefficient));
  }

  async estimateGas(amount, address, contract) {
    const config = await this.getProvider('node').getNodeConfig();

    if (!config) {
      return new this.BN(this.gasLimit).add(new this.BN(this.gasLimitCoefficient)).toString();
    }

    const actions = [
      config.runtime_config.transaction_costs.action_receipt_creation_config,
      config.runtime_config.transaction_costs.action_creation_config[contract ? 'transfer_cost' : 'function_call_cost'],
    ];

    const feeTypes = [address === this.address ? 'send_sir' : 'send_not_sir', 'execution'];

    return actions
      .reduce(
        (summ, action) =>
          summ.add(
            feeTypes.reduce((actionSumm, feeType) => actionSumm.add(new this.BN(action[feeType])), new this.BN(0)),
          ),
        new this.BN(0),
      )
      .add(new this.BN(this.gasLimitCoefficient))
      .toString();
  }

  /**
   * Return available balance for send
   *
   * @return {Promise<string>}
   */
  async availableBalance(fee) {
    await this.updateBalance();

    const availableBalance = new this.BN(this.balance)
      .sub(new this.BN(new this.BN(fee).gt(new this.BN(0)) ? fee : await this.getFee()))
      .sub(new this.BN(this.unspendableBalance));

    return availableBalance.gt(new this.BN(0)) ? this.toCurrencyUnit(availableBalance) : '0';
  }

  async _updateBalance() {
    try {
      const { balance, unspendable } = await this.getProvider('node').getInfo(this.address, {
        gasLimit: this.stakingGasLimit,
        gasPrice: await this.getGasPrice(),
        reserve: new this.BN(this.reserveForStake),
      });

      if (!balance) {
        throw new Error(`${this.ticker} can't get balance`);
      }

      this.balance = balance;
      this.unspendableBalance = unspendable;
    } catch (error) {
      // @TODO implement logger
    }
  }

  updateBalance = lodash.throttle(this._updateBalance, UPDATE_BALANCE_INTERVAL);

  async getInfo() {
    if (!this.address) {
      throw new Error(`${this.ticker} address not found`);
    }

    await this.updateBalance();

    return { balance: this.balance, balances: this.balances };
  }

  async getStakingInfo() {
    if (this.balance === null) {
      await this.updateBalance();
    }
    const balances = await this.getProvider('node').fetchStakingInfo(this.address, {
      activeValidators: (await this.configManager?.get(this.getPredefineValidatorsConfigName())) ?? [],
    });

    this.setBalances(await this.makeStakingInfoStruct(balances));

    return { balances: this.balances };
  }

  calculateTotal({ balance, staked, unstaking }) {
    return new Amount(balance.toBN().add(staked.toBN()).add(unstaking.toBN()).toString(), this);
  }

  async calculateAvailableForStake() {
    const fees = await this.getFee({ gasLimit: this.stakingGasLimit });

    const available = new this.BN(this.balance)
      .sub(new this.BN(this.reserveForStake))
      .sub(fees)
      .sub(new this.BN(this.unspendableBalance));

    return new Amount(available.isNeg() ? '0' : available, this);
  }

  gasPrice() {
    return this.getGasPrice();
  }

  setPrivateKey(privateKey, phrase) {
    this.loadWallet('', phrase);
  }

  async checkTransaction(txInfo) {
    await super.checkTransaction({
      feeTicker: this.ticker,
      ...txInfo,
      fee: null,
    });
  }

  async getBalance() {
    return (await this.getInfo()).balance;
  }
}

export default NEARCoin;
