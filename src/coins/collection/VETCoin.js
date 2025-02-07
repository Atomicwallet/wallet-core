import { Coin } from 'src/abstract';
import VetNodeExplorer from 'src/explorers/collection/VetNodeExplorer';
import { VETToken } from 'src/tokens';
import { LazyLoadedLib } from 'src/utils';

import { HasProviders, HasTokensMixin } from '../mixins';

const thorDevKitLib = new LazyLoadedLib(() => import('thor-devkit'));

const NAME = 'VeChain';
const TICKER = 'VET';
const DERIVATION = "m/44'/818'/0'/0/0";
const DECIMAL = 18;
const UNSPENDABLE_BALANCE = '0';
const VTHO_CONTRACT = '0x0000000000000000000000000000456e65726779';
const GAS_IN_VTHO = 1000;

const TWO = 2;

/**
 * Vechain
 *
 * @class VETCoin
 */
class VETCoin extends HasProviders(HasTokensMixin(Coin)) {
  #privateKey;
  #feeTokenWallet;

  /**
   * constructs the object.
   *
   * @param {String} alias the alias
   * @param {String} fee the fee data
   * @param {Array}  explorers the explorers
   * @param {String} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      explorers,
      txWebUrl,
      feeData,
      socket,
    };

    super(config, db, configManager);

    this.derivation = DERIVATION;

    this.setExplorersModules([VetNodeExplorer]);

    this.loadExplorers(config);

    this.fee = feeData.fee;
    this.transactions = [];
    this.feeTokenContract = VTHO_CONTRACT;
    this.tokens = {};

    this.#initFeeTokenWallet();

    this.eventEmitter.on(`${this.ticker}::confirmed-socket-tx`, (coinId, unconfirmedTx, ticker) => {
      this.getInfo();

      if (unconfirmedTx && unconfirmedTx.direction) {
        this.eventEmitter.emit('socket::newtx', {
          id: coinId,
          ticker,
          amount: unconfirmedTx.amount,
          txid: unconfirmedTx.txid,
        });
      } else {
        this.eventEmitter.emit('socket::newtx::outgoing', {
          id: coinId,
          ticker,
        });
      }
    });
  }

  get feeWallet() {
    return this.#feeTokenWallet;
  }

  get feeTicker() {
    return 'VTHO';
  }

  async getExcludedTokenList() {
    return [];
  }

  /**
   * Creates a token.
   *
   * @param {...Array} args The arguments
   * @return {VETToken}
   */
  createToken(args) {
    return new VETToken({
      parent: this,
      ...args,
    });
  }

  #initFeeTokenWallet() {
    this.#feeTokenWallet = this.createToken({
      name: 'VeThor',
      ticker: 'VTHO',
      decimal: DECIMAL,
      contract: this.feeTokenContract,
      uniqueField: this.feeTokenContract,
      visibility: true, // visibility
      confirmed: true, // confirmation
    });

    this.tokens[this.#feeTokenWallet.id] = this.#feeTokenWallet;
  }

  async loadTokensList(wallets) {
    wallets.addWallet(this.#feeTokenWallet);
    this.bus?.$emit('update::coin-list');
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemonic} seed  Seed of Mnemonic
   * @param {string} phrase mnemonic (12 words)
   * @return {Promise<Coin>} The private key.
   */
  async loadWallet(seed, phrase) {
    const words = phrase.trim().split(/\s+/);
    const { cry } = await thorDevKitLib.get();

    if (!cry.mnemonic.validate(words)) {
      throw new Error('Error, fail words in VET mnemonic string');
    }

    const privateKey = cry.mnemonic.derivePrivateKey(words);

    if (!privateKey) {
      throw new Error(`${this.ticker} privateKey is empty`);
    }

    const publicKey = cry.secp256k1.derivePublicKey(privateKey);

    this.#privateKey = `0x${privateKey.toString('hex')}`;
    this.address = `0x${cry.publicKeyToAddress(publicKey).toString('hex')}`;

    return {
      id: this.id,
      privateKey: this.#privateKey,
      address: this.address,
    };
  }

  /**
   * The address getter
   *
   * @return {String}
   */
  async getAddress() {
    if (this.#privateKey) {
      const { cry } = await thorDevKitLib.get();

      const privateKeyBuffer = Buffer.from(this.#privateKey.substring(TWO), 'hex');
      const pubKey = cry.secp256k1.derivePublicKey(privateKeyBuffer);

      return `0x${cry.publicKeyToAddress(pubKey).toString('hex')}`;
    }
    return new Error(`${this.ticker} privateKey is empty`);
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    if (!address) {
      return false;
    }

    return Boolean(address.match(/0x[0-9a-f]{40}/i));
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({ address, amount }) {
    const fee = Number(this.toCurrencyUnit(await this.getFee()));

    return this.createTransactionWithData(address, amount, '0x', fee);
  }

  async createTokenTransaction({ contract, amount, dataToSend, fee }) {
    return this.createTransactionWithData(contract, amount, dataToSend, fee);
  }

  /**
   *
   * @return {Promise<{}>}
   */
  getLatestBlock() {
    return this.getProvider('block').getLatestBlock();
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @param {String} data The transaction data, default = 0x - null
   * @param {Number} fee The fee in VTHO!
   * @return {Promise<String>} Raw transaction
   */
  async createTransactionWithData(to, amount, data, fee) {
    const { Transaction, cry } = await thorDevKitLib.get();
    const hexBase = 16;
    const blockRefLen = 18;
    const lastBlockInfo = await this.getLatestBlock();
    const privateKeyBuffer = Buffer.from(this.#privateKey.substring(TWO), 'hex');
    const value = `0x${new this.BN(amount).toString(hexBase)}`;
    const blockRef = lastBlockInfo.id.substring(0, blockRefLen);
    const transaction = new Transaction({
      chainTag: 74,
      blockRef,
      expiration: 720,
      clauses: [{ to, value, data }],
      gasPriceCoef: 0,
      gas: Number(this.convertVTHOToGas(fee)),
      dependsOn: null,
      nonce: 0,
    });
    const signingHash = cry.blake2b256(transaction.encode());

    transaction.signature = cry.secp256k1.sign(signingHash, privateKeyBuffer);

    return `0x${transaction.encode().toString('hex')}`;
  }

  convertGasToVTHO(value) {
    return Number(new this.BN(Number(value)).div(new this.BN(GAS_IN_VTHO)));
  }

  convertVTHOToGas(value) {
    return Number(new this.BN(Number(value)).mul(new this.BN(GAS_IN_VTHO)));
  }

  async getInfo() {
    const info = await this.getProvider('balance').getInfo(this.address);

    if (info?.balance) {
      this.balance = info.balance;
    }

    if (info?.energy) {
      this.tokens[this.#feeTokenWallet.id].balance = info.energy;
    }

    return {
      balance: this.balance,
      energy: this.tokens[this.#feeTokenWallet.id].balance,
    };
  }

  /**
   * @returns {BN}
   */
  async getFee() {
    const { Transaction } = await thorDevKitLib.get();

    return this.toMinimalUnit(this.fee || this.convertGasToVTHO(Transaction.intrinsicGas([])));
  }

  /**
   * Fee for vechain in VTHO token!
   *
   * @return {Promise<Boolean>} True if available for fee, False otherwise.
   */
  async isAvailableForFee() {
    const token = this.tokens[this.#feeTokenWallet.id];
    const fee = await this.getFee();

    return token ? token.indivisibleBalance && token.indivisibleBalance.gte(fee) : false;
  }

  async availableBalance() {
    const availableBalance = new this.BN(this.balance).sub(new this.BN(this.unspendableBalance));

    return availableBalance.lt(new this.BN(0)) ? '0' : this.toCurrencyUnit(availableBalance);
  }

  async fetchUserTokens(wallets) {
    return [];
  }

  // TODO: AWC-1180
  async getTransactions(args) {
    return [];
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}

export default VETCoin;
