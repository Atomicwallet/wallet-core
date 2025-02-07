import { Coin } from 'src/abstract';
import BlockbookV2Explorer from 'src/explorers/collection/BlockbookV2Explorer';
import { LazyLoadedLib } from 'src/utils';
import { LIB_NAME_INDEX } from 'src/utils/const';

import { BitcoinJSMixin, BitcoinLikeFeeMixin } from '../mixins';

const DERIVATION = "m/44'/2301'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';
const { BITCOINJS } = LIB_NAME_INDEX;

/**
 * Class
 *
 * @class QTUMCoin
 */
class QTUMCoin extends BitcoinJSMixin(BitcoinLikeFeeMixin(Coin)) {
  /**
   * @typedef FeeConfigData
   * @type {object}
   * @property {number|string} feePerByte
   * @property {number|string} coefficient
   * @property {number|string} [unspendableBalance]
   */

  /**
   * constructs the object.
   *
   * @param {object} config
   * @param {string} config.id
   * @param {string} config.ticker
   * @param {string} config.name
   * @param {string} config.alias
   * @param {string[]} [config.features]
   * @param {FeeConfigData} config.feeData
   * @param {ExplorerConfig[]} config.explorers
   * @param {string} config.txWebUrl
   * @param {boolean} config.socket
   * @param {boolean} [config.notify=false]
   */
  constructor(config, db, configManager) {
    /**
     * @typedef { {
     *  pubKeyHash: number,
     *  scriptHash: number,
     *  wif: number,
     *  messagePrefix: string,
     * bip32: {private: number, public: number},
     * } } NetworkInfo
     *
     * @type {
     *   {MAINNET: NetworkInfo},
     *   {TESTNET: NetworkInfo},
     *   {REGTEST: NetworkInfo}
     * }
     */
    const networks = {
      MAINNET: {
        name: 'qtum',
        messagePrefix: '\u0015Qtum Signed Message:\n',
        bech32: 'bc',
        bip32: { public: 76067358, private: 76066276 },
        pubKeyHash: 58,
        scriptHash: 50,
        wif: 128,
      },
      TESTNET: {
        name: 'qtum_testnet',
        messagePrefix: '\u0015Qtum Signed Message:\n',
        bech32: 'tb',
        bip32: { public: 70617039, private: 70615956 },
        pubKeyHash: 120,
        scriptHash: 110,
        wif: 239,
      },
      REGTEST: {
        name: 'qtum_regtest',
        messagePrefix: '\u0015Qtum Signed Message:\n',
        bech32: 'tb',
        bip32: { public: 70617039, private: 70615956 },
        pubKeyHash: 120,
        scriptHash: 110,
        wif: 239,
      },
    };

    const { feeData } = config;

    super(
      {
        ...config,
        decimal: DECIMAL,
        derivation: DERIVATION,
        dependencies: {
          [BITCOINJS]: new LazyLoadedLib(() => import('bitcoinjs-lib')),
        },
      },
      db,
      configManager,
    );

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.setFeeData(feeData);
    this.network = networks.MAINNET;
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.feePerByte = String(feeData.feePerByte);
    this.coefficient = feeData.coefficient ?? 1;
    this.unspendableBalance = feeData.unspendableBalance ?? UNSPENDABLE_BALANCE;
  }
}

export default QTUMCoin;
