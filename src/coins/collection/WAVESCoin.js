import axlsign from 'axlsign';
import { Coin } from 'src/abstract';
import WavesNodeExplorer from 'src/explorers/collection/WavesNodeExplorer';
import { LazyLoadedLib } from 'src/utils';

const wavesSignatureAdapterLib = new LazyLoadedLib(() => import('@waves/signature-adapter'));
const wavesSignatureGeneratorLib = new LazyLoadedLib(() => import('@waves/signature-generator'));
const wavesTransactionLib = new LazyLoadedLib(() => import('waves-transactions'));
const wavesMarshalLib = new LazyLoadedLib(() => import('@waves/marshall'));

const NAME = 'Waves';
const TICKER = 'WAVES';
const DERIVATION = "m/44'/5741564'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * @class WAVESCoin
 */
class WAVESCoin extends Coin {
  #privateKey;

  /**
   * Constructs the object.
   *
   * @param {String} alias the alias
   * @param {String} fee the fee data
   * @param {Explorer[]}  explorers the explorers
   * @param {String} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData: { fee }, explorers, txWebUrl, socket, id }, db, configManager) {
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

    super(config, db, configManager);

    this.derivation = DERIVATION;

    this.setExplorersModules([WavesNodeExplorer]);

    this.loadExplorers(config);

    this.fee = fee;
    this.transactions = [];
  }

  /**
   * @param {Buffer} seed Seed buffer from BitcoreMnemonic
   * @param {String} phrase The mnemonic string
   * @return {Promise<Coin>} The private key.
   */
  async loadWallet(seed, phrase) {
    try {
      const { SeedAdapter } = await wavesSignatureAdapterLib.get();
      const adapter = new SeedAdapter(phrase);

      this.#privateKey = await adapter.getPrivateKey();
      this.address = await adapter.getAddress();

      return {
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      };
    } catch (error) {
      throw new Error(`${this.ticker} privateKey is empty`);
    }
  }

  /**
   * @returns {Promise<Uint8Array>}
   */
  async getRawPublicKey() {
    const { libs } = await wavesSignatureGeneratorLib.get();

    const privateKeyArray = libs.base58.decode(this.#privateKey);

    return axlsign.derivePublicKey(privateKeyArray);
  }

  async getPublicKey(publicKey) {
    const { libs } = await wavesSignatureGeneratorLib.get();

    return libs.base58.encode(publicKey);
  }

  /**
   * The address getter
   *
   * @return {String}
   */
  async getAddress() {
    if (this.#privateKey) {
      const { utils } = await wavesSignatureGeneratorLib.get();

      return utils.crypto.buildRawAddress(await this.getRawPublicKey());
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
      const { utils } = await wavesSignatureGeneratorLib.get();

      return utils.crypto.isValidAddress(address);
    } catch (error) {
      throw new Error(`Fail to validate ${this.ticker} address [${address}]`);
    }
  }

  /**
   * Creates a transaction.
   *
   * @param {String} address The destination address
   * @param {Number} amount The amount to send
   * @return {Promise<String>} Raw transaction
   */
  async createTransaction({ address, amount }) {
    const fee = (await this.getFee()).toNumber();
    const { transfer } = await wavesTransactionLib.get();

    const unsignedTransaction = transfer({
      amount: Number(amount),
      recipient: address,
      fee,
      senderPublicKey: await this.getPublicKey(await this.getRawPublicKey()),
    });

    return this.signTransaction(unsignedTransaction);
  }

  async signTransaction(unsignedTransaction) {
    const { binary } = await wavesMarshalLib.get();
    const { utils } = await wavesSignatureGeneratorLib.get();

    const rawTx = binary.serializeTx(unsignedTransaction);

    unsignedTransaction.proofs.push(utils.crypto.buildTransactionSignature(rawTx, this.#privateKey));

    return JSON.stringify(unsignedTransaction);
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}

export default WAVESCoin;
