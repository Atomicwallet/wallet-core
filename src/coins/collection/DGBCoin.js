import { Coin } from 'src/abstract';
import { WalletError } from 'src/errors';
import BlockbookV2Explorer from 'src/explorers/collection/BlockbookV2Explorer';
import { LazyLoadedLib } from 'src/utils';
import { LIB_NAME_INDEX } from 'src/utils/const';

import { BitcoinLikeFeeMixin, BitcoreMixin } from '../mixins';

const { BITCORE } = LIB_NAME_INDEX;
const NAME = 'DigiByte';
const TICKER = 'DGB';
const DERIVATION = "m/44'/20'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * Class
 *
 * @class DGBCoin
 */
class DGBCoin extends BitcoreMixin(BitcoinLikeFeeMixin(Coin)) {
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
    const networkName = 'digibyte-livenet';

    const addNetwork = (bitcoreLib) => {
      bitcoreLib.Networks.add({
        name: networkName,
        alias: networkName,
        pubkeyhash: 0x1e,
        privatekey: 0x80,
        scripthash: 0x05,
        xpubkey: 0x0488b21e,
        xprivkey: 0x0488ade4,
        networkMagic: 0xfac3b6da,
        port: 12024,
        dnsSeeds: ['seed.digibyte.co', 'seed.digibyte.io', 'digiexplorer.info'],
      });
    };

    const bitcore = new LazyLoadedLib(() =>
      import('bitcore-lib').then(({ default: bitcoreLib }) => {
        addNetwork(bitcoreLib);
        return bitcoreLib;
      }),
    );

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
      dependencies: { [BITCORE]: bitcore },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.setFeeData(feeData);
    this.networkName = networkName;
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;
  }

  async createTransaction({ address, amount, memo, userFee }) {
    const coins = await this.getCoins({
      address,
      value: Number(amount),
      feePerByte: Number(this.feeData.feePerByte),
    });

    if (userFee && coins.fee > userFee) {
      throw new Error('userFee is more then utxo fee');
    }

    const tx = await this.createTransactionSync(coins);

    return tx;
  }

  async loadWallet(seed) {
    const bitcoreLib = await this.loadLib(BITCORE);

    return new Promise(async (resolve, reject) => {
      const hdPrivateKey = bitcoreLib.HDPrivateKey.fromSeed(seed, await this.getNetwork());
      const { privateKey } = hdPrivateKey[this.getDeriveFunctionName()](this.derivation);

      if (!privateKey) {
        reject(
          new WalletError({
            type: 'LOAD_WALLET_ERROR',
            error: "can't derive privateKey!",
            instance: this,
          }),
        );
      }

      this.setPrivateKey(privateKey.toWIF());
      this.address = await this.getAddress(await this.getNetwork());

      resolve({
        id: this.id,
        privateKey: this.#privateKey,
        address: this.address,
      });
    });
  }

  /**
   * Validates wallet address
   *
   * @param {String} address The address
   * @return {Boolean}
   */
  async validateAddress(address) {
    const bitcoreLib = await this.loadLib(BITCORE);

    const isValid = bitcoreLib.Address.isValid(address || this.address, await this.getNetwork());

    return isValid;
  }

  async getAddress(network) {
    const bitcoreLib = await this.loadLib(BITCORE);

    // TODO remove assignment of Error instance to address attribute
    return this.#privateKey
      ? bitcoreLib.PrivateKey.fromWIF(this.#privateKey.toString()).toAddress(network).toString()
      : new Error(`${this.ticker} privateKey is empty`);
  }

  async getScriptPubKey() {
    const bitcoreLib = await this.loadLib(BITCORE);

    return bitcoreLib.Script.fromAddress(this.address).toHex();
  }

  setPrivateKey(privateKey) {
    super.setPrivateKey(privateKey);
    this.#privateKey = privateKey;
  }
}

export default DGBCoin;
