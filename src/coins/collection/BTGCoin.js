import { WalletError } from 'src/errors';

import { Coin } from '../../abstract';
import BlockbookV2Explorer from '../../explorers/collection/BlockbookV2Explorer';
import { LazyLoadedLib } from '../../utils';
import { LIB_NAME_INDEX, WALLET_ERROR } from '../../utils/const';
import { BitcoinJSMixin, BitcoinLikeFeeMixin } from '../mixins';

const NAME = 'Bitcoin gold';
const TICKER = 'BTG';
const DERIVATION = "m/44'/156'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

const DEFAULT_VERSION = 2;
const { BITCOINJS } = LIB_NAME_INDEX;

/**
 * Class for Bitcoin gold coin
 *
 * @class BTGCoin
 */
class BTGCoin extends BitcoinJSMixin(BitcoinLikeFeeMixin(Coin)) {
  #privateKey;

  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
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
      dependencies: {
        [BITCOINJS]: new LazyLoadedLib(() => import('bgoldjs-lib')),
      },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;
    this.networkName = 'bitcoingold';
  }

  /**
   * Gets the transaction builder.
   *
   * return {TransactionBuilder}
   */
  async getTransactionBuilder() {
    const bitcoinJs = await this.loadLib(BITCOINJS);
    const txBuilder = new bitcoinJs.TransactionBuilder(await this.getNetwork());

    txBuilder.enableBitcoinGold(true);
    txBuilder.setVersion(DEFAULT_VERSION);

    return txBuilder;
  }

  /**
   * Adds an input.
   *
   * @param {TransactionBuilder} txBuilder The transmit builder
   * @param {String} input The input
   */
  async addInput(txBuilder, input) {
    const bitcoinJs = await this.loadLib(BITCOINJS);

    txBuilder.addInput(
      input.txId,
      input.outputIndex,
      bitcoinJs.Transaction.DEFAULT_SEQUENCE,
      Buffer.from(input.script, 'hex'),
    );
  }

  /**
   * Signs the input.
   *
   * @param {TransactionBuilder} txBuilder The transmit builder
   * @param {Strint} keyForSign The key for sign
   * @param {Number} index The index
   * @param {String} input The input
   */
  async signInput(txBuilder, keyForSign, index, input) {
    const bitcoinJs = await this.loadLib(BITCOINJS);

    /* eslint no-bitwise: ["error", { "allow": ["|"] }] */
    const hashType =
      bitcoinJs.Transaction.SIGHASH_ALL | bitcoinJs.Transaction.SIGHASH_FORKID;

    txBuilder.sign(index, keyForSign, null, hashType, input.satoshis);
  }

  /**
   * Loads a wallet.
   *
   * @param {BitcoreMnemondic} mnemonic The private key object.
   * @return {Promise<Object>} The private key.
   */
  async loadWallet(seed) {
    const bitcoinJs = await this.loadLib(BITCOINJS);

    return new Promise(async (resolve, reject) => {
      const hdPrivateKey = bitcoinJs.HDNode.fromSeedBuffer(
        seed,
        await this.getNetwork(),
      );
      const key = hdPrivateKey.derivePath(this.derivation);

      if (!key.keyPair) {
        reject(
          new WalletError({
            type: WALLET_ERROR,
            error: new Error("can't get a privateKey!"),
            instance: this,
          }),
        );
      }

      this.setPrivateKey(key.keyPair.toWIF());
      this.address = key.keyPair.getAddress();

      resolve({
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      });
    });
  }

  setPrivateKey(privateKey) {
    super.setPrivateKey(privateKey);
    this.#privateKey = privateKey;
  }
}

export default BTGCoin;
