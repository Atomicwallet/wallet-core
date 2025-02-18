import { Coin } from 'src/abstract';
import { WalletError } from 'src/errors';
import ArkExplorer from 'src/explorers/collection/ArkExplorer';
import { LazyLoadedLib } from 'src/utils';
import { WALLET_ERROR } from 'src/utils/const';

const arkecosystemCryptoLazyLoaded = new LazyLoadedLib(() => import('@arkecosystem/crypto'));

const NAME = 'Ark';
const TICKER = 'ARK';
const DERIVATION = "m/44'/111'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';
const FORK_HEIGHT = 11273000;
const TX_VERSION = 2;

class ARKCoin extends Coin {
  #privateKey;

  /**
   * @typedef ArkecosystemCryptoObj
   * @type {object|null}
   * @property {object} Crypto
   * @property {object} Identities
   * @property {object} Transactions
   * @property {number} pubKeyHash
   */
  arkecosystemCryptoObj = null;

  /**
   * Constructs the object.
   *
   * @param {String} alias the alias
   * @param {String} fee the fee data
   * @param {Explorer[]}  explorers the explorers
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
      socket,
      feeData,
    };

    super(config, db, configManager);

    this.derivation = DERIVATION;
    this.setExplorersModules([ArkExplorer]);

    this.loadExplorers(config);

    this.fee = feeData.fee;
    this.transactions = [];
  }

  /**
   * Inits and gets @arkecosystem/crypto lib
   * @returns {Promise<ArkecosystemCryptoObj>}
   */
  async getArkecosystemCryptoObj() {
    if (this.arkecosystemCryptoObj) {
      return this.arkecosystemCryptoObj;
    }

    const { Crypto, Identities, Managers, Transactions } = await arkecosystemCryptoLazyLoaded.get();

    Managers.configManager.setFromPreset('mainnet');
    Managers.configManager.setHeight(FORK_HEIGHT);
    const pubKeyHash = Managers.configManager.all().network.pubKeyHash;

    const responseObj = {};

    responseObj.Crypto = Crypto;
    responseObj.Identities = Identities;
    responseObj.Transactions = Transactions;
    responseObj.pubKeyHash = pubKeyHash;
    this.arkecosystemCryptoObj = responseObj;

    return responseObj;
  }

  loadWallet(seed, mnemonic) {
    return new Promise(async (resolve, reject) => {
      const { Crypto, Identities, pubKeyHash } = await this.getArkecosystemCryptoObj();
      const hdPrivateKey = Crypto.HDWallet.fromMnemonic(mnemonic);
      const key = hdPrivateKey.derivePath(this.derivation);

      if (!key.privateKey) {
        reject(
          new WalletError({
            type: WALLET_ERROR,
            error: new Error("can't get a privateKey!"),
            instance: this,
          }),
        );
      }

      this.#privateKey = key.toWIF();
      this.address = Identities.Address.fromPublicKey(key.publicKey.toString('hex'), pubKeyHash);

      resolve({
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      });
    });
  }

  /**
   * The address getter
   *
   * @return {String|WalletError}
   */
  async getAddress() {
    if (this.#privateKey) {
      const { Identities, pubKeyHash } = await this.getArkecosystemCryptoObj();
      const keyPair = Identities.Keys.fromWIF(this.#privateKey);

      return Identities.Address.fromPublicKey(keyPair.publicKey, pubKeyHash);
    }

    return new WalletError({
      type: WALLET_ERROR,
      error: new Error('privateKey is empty!'),
      instance: this,
    });
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    const { Identities, pubKeyHash } = await this.getArkecosystemCryptoObj();

    return Identities.Address.validate(address, pubKeyHash);
  }

  async createTransaction({ address, amount }) {
    const { Transactions } = await this.getArkecosystemCryptoObj();
    const { nonce } = await this.getInfo();
    const senderNonce = new this.BN(nonce).addn(1);

    const unsignedTx = Transactions.BuilderFactory.transfer()
      .version(TX_VERSION)
      .nonce(senderNonce.toString())
      .recipientId(address)
      .amount(amount)
      .fee(this.fee);

    return this.signTransaction(unsignedTx);
  }

  signTransaction(unsignedTx) {
    return unsignedTx.signWithWif(this.#privateKey).getStruct();
  }

  setPrivateKey(privateKey) {
    this.#privateKey = privateKey;
  }
}

export default ARKCoin;
