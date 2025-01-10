import { Coin } from 'src/abstract';
import NemNodeExplorer from 'src/explorers/collection/NemNodeExplorer';
import { LazyLoadedLib } from 'src/utils';

const nemLazyLoaded = new LazyLoadedLib(() => import('nem-sdk'));

const NAME = 'NEM';
const TICKER = 'XEM';
const DERIVATION = "m/44'/43'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';

/**
 * @class XEMCoin
 */
class XEMCoin extends Coin {
  #privateKey;

  /**
   * Constructs the object.
   *
   * @param {String} alias the alias
   * @param {String} fee the fee data
   * @param {Explorer[]}  explorers the explorers
   * @param {String} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData: { fee }, explorers, txWebUrl, socket, id }) {
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
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([NemNodeExplorer]);

    this.loadExplorers(config);

    this.fee = fee;
    this.transactions = [];
    this.fields.paymentId = true;
  }

  async getNemLib() {
    const { default: nem } = await nemLazyLoaded.get();

    return nem;
  }

  /**
   * Gets nem network id
   * @param {object} nem - Nem SDK library
   * @returns {number}
   */
  getNetworkId(nem) {
    return nem?.model.network.data.mainnet.id;
  }

  async getAddressFromPublicKey(publicKey) {
    const nem = await this.getNemLib();
    const networkId = this.getNetworkId(nem);

    return nem.model.address.toAddress(publicKey, networkId);
  }

  /**
   * @param {Buffer} seed Seed buffer from BitcoreMnemonic
   * @param {String} phrase The mnemonic string
   * @return {Promise<Coin>} The private key.
   */
  async loadWallet(seed, phrase) {
    const privateKeyGeneratorIterateCount = 6000;

    const nem = await this.getNemLib();
    const privateKey = nem.crypto.helpers.derivePassSha(phrase, privateKeyGeneratorIterateCount).priv;
    const keyPair = nem.crypto.keyPair.create(privateKey);
    const publicKey = keyPair.publicKey.toString();

    if (!privateKey) {
      throw new Error(`${this.ticker} privateKey is empty`);
    }

    this.#privateKey = privateKey;
    this.address = await this.getAddressFromPublicKey(publicKey);

    return { id: this.id, privateKey: this.#privateKey, address: this.address };
  }

  /**
   * The address getter
   *
   * @return {Promise<string>}
   */
  async getAddress() {
    if (this.#privateKey) {
      const nem = await this.getNemLib();
      const keyPair = nem.crypto.keyPair.create(this.#privateKey);
      const publicKey = keyPair.publicKey.toString();

      return this.getAddressFromPublicKey(publicKey);
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
    try {
      const nem = await this.getNemLib();
      const networkId = this.getNetworkId(nem);

      return nem.model.address.isValid(address) && nem.model.address.isFromNetwork(address, networkId);
    } catch (error) {
      throw new Error(`Fail to validate ${this.ticker} address [${address}]`);
    }
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @param {String} paymentId Nem "Message" or memo
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({ address, amount, memo = '' }) {
    const nem = await this.getNemLib();
    const networkId = this.getNetworkId(nem);

    const common = nem.model.objects.create('common')('', this.#privateKey);
    const transferTransaction = nem.model.objects.create('transferTransaction')(
      address,
      this.toCurrencyUnit(amount),
      memo,
    );

    const unsignedTransaction = nem.model.transactions.prepare('transferTransaction')(
      common,
      transferTransaction,
      networkId,
    );

    return this.signTransaction(unsignedTransaction);
  }

  async signTransaction(unsignedTransaction) {
    const nem = await this.getNemLib();

    const keyPair = nem.crypto.keyPair.create(this.#privateKey);
    const unsignedRawTx = nem.utils.serialization.serializeTransaction(unsignedTransaction);
    const signature = keyPair.sign(unsignedRawTx);

    const transaction = {
      data: nem.utils.convert.ua2hex(unsignedRawTx),
      signature: signature.toString(),
    };

    return JSON.stringify(transaction);
  }

  /**
   * Update dynamic data set
   *
   * @param {Object} data The data
   */
  updateCoinParamsFromServer(data) {
    super.updateCoinParamsFromServer(data);

    const NemNodeParams = data.explorers.find(({ className }) => className === 'NemNodeExplorer');

    if (NemNodeParams) {
      this.explorers[0].updateEndpoint(NemNodeParams.baseUrl);
      this.explorers[0].webUrl = data.txWebUrl;
    }
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}

export default XEMCoin;
