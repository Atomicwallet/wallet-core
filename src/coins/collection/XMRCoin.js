import BN from 'bn.js';
import { ExternalError } from '../../errors';
import { Coin } from '../../abstract';
import MyMoneroExplorer from '../../explorers/collection/MyMoneroExplorer';
import { HasProviders } from '../mixins';
import { getAccount, validateAddress as isAddressValid } from '../libs/monero';

const NAME = 'Monero';
const TICKER = 'XMR';
const DERIVATION = "m/44'/128'/0'/0/0";
const DECIMAL = 12;
const UNSPENDABLE_BALANCE = '0';
const MONERO_SEED_LENGTH = 64;

class XMRCoin extends HasProviders(Coin) {
  #privateKey;

  /**
   * Constructs the object.
   *
   * @param {String} alias the alias
   * @param {Object} feeData the fee data
   * @param {Explorer[]}  explorers the explorers
   * @param {String} txWebUrl the transmit web url
   */
  constructor({
    alias,
    notify,
    feeData,
    explorers,
    txWebUrl,
    socket,
    id,
    atomicId,
  }) {
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
      socket,
      atomicId,
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([MyMoneroExplorer]);

    this.loadExplorers(config);

    this.fee = feeData.fee;
    this.coreLibrary = null;
    // keys
    this.#privateKey = null;
    this.privateKeyView = null;
    this.privateKeySpend = null;
    this.publicKeySpend = null;
    // misc
    this.info = {};
  }

  /**
   * Loads a wallet
   * Mutates the wallet with created privateKey and the address obtained from the private key.
   *
   * @param {Buffer} seed - The mnemonic seed.
   * @param {string} [mnemonicString] - The mnemonic string.
   * @return {XMRCoin}
   */
  async loadWallet(seed, mnemonicString) {
    const moneroSeed = seed.toString('hex').substr(0, MONERO_SEED_LENGTH);

    await this.setPrivateKey(moneroSeed);
    return {
      id: this.id,
      privateKey: {
        privateKey: this.#privateKey,
        privateKeySpend: this.privateKeySpend,
        privateKeyView: this.privateKeyView,
        publicKeySpend: this.publicKeySpend,
      },
      address: this.address,
    };
  }

  /**
   * @typedef MyMoneroAccount
   * @property {string} address_string
   * @property {string} pub_viewKey_string
   * @property {string} pub_spendKey_string
   * @property {string} sec_viewKey_string
   * @property {string} sec_spendKey_string
   */

  /**
   * Sets privateKey and restores address from privateKey
   * Mutates the wallet with the address obtained from the private key.
   * Used as a faster method than loadWallet for address recovery.
   *
   * @param {string} privateKey - The private key.
   * @param {string} [mnemonicString]
   * @returns {Promise<void>}
   */
  async setPrivateKey(privateKey, mnemonicString) {
    let key = privateKey;

    if (privateKey?.privateKey) {
      key = privateKey.privateKey;
    }

    const { privView, privSpend, pubSpend, address } = getAccount(key);

    this.privateKeyView = privView;
    this.privateKeySpend = privSpend;
    this.publicKeySpend = pubSpend;
    this.address = address;
    this.#privateKey = key;

    this.getProvider('node').setup(this.privateKeyView, this.privateKeySpend);
  }

  /**
   * Validates wallet address
   *
   * @param {string} address - The address.
   * @return {boolean}
   */
  validateAddress(address) {
    return isAddressValid(address);
  }

  /**
   * Mutates the wallet with the requested balance and returns it
   *
   * @returns {Promise<{balance: string}>}
   */
  async getInfo() {
    const { balance } = await this.getProvider('balance').getInfo();

    this.balance = balance;

    return { balance };
  }

  /**
   * Gets the estimated fee for the transaction
   *
   * @async
   * @returns {Promise<string>}
   * @throws {ExternalError}
   */
  getFee() {
    return this.getProvider('node').getFee();
  }

  /**
   * Gets isSendAll sign by amount
   *
   * @param {string} amount
   * @returns {Promise<boolean>}
   */
  async #getIsSendAllByAmount(amount) {
    const [balance, fee] = await Promise.all([
      this.getBalance(),
      this.getFee(),
    ]);

    return amount === new BN(balance).sub(new BN(fee)).toString();
  }

  /**
   * @typedef MyMoneroTransactionOptions
   * @property Array.{to_address: string, send_amount: string} destinations - Array of transaction destinations.
   * @property {false} shouldSweep
   * @property {1} priority
   */

  /**
   * Creates options to create transaction in explorer
   *
   * @param {object} payload
   * @param {string} payload.address - To address.
   * @param {string} payload.amount - Amount of funds.
   * @param {boolean} payload.isSendAll - Amount of funds.
   * @returns {Promise<MyMoneroTransactionOptions>} - Raw transaction options
   * @throws {ExternalError}
   */
  async createTransaction({
    address,
    amount,
    memo,
    isSendAll: isSendAllRequested = false,
  }) {
    try {
      const isSendAll =
        isSendAllRequested || (await this.#getIsSendAllByAmount(amount));

      return {
        destinations: [
          {
            to_address: address,
            send_amount: isSendAll ? 0 : this.toCurrencyUnit(amount),
          },
        ],
        shouldSweep: isSendAll,
        priority: 1,
      };
    } catch (error) {
      throw new ExternalError({ error, instance: this });
    }
  }

  async activate() {
    await this.getProvider('node').reactivateMyMonero();
    await super.activate();
  }
}

export default XMRCoin;
