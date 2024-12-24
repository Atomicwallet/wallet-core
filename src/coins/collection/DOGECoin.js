import { LazyLoadedLib } from '../../utils';

import { Coin } from '../../abstract';
import { LIB_NAME_INDEX } from '../../utils/const';
import BlockbookV2Explorer from '../../explorers/collection/BlockbookV2Explorer';
import { BitcoinJSMixin, BitcoinLikeFeeMixin } from '../mixins';

const NAME = 'Doge';
const TICKER = 'DOGE';
const DERIVATION = "m/44'/3'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';
const { BITCOINJS } = LIB_NAME_INDEX;

/**
 * Class for
 *
 * @class DOGECoin
 */
class DOGECoin extends BitcoinJSMixin(BitcoinLikeFeeMixin(Coin)) {
  /**
   * constructs the object.
   *
   * @param  {<type>} alias the alias
   * @param  {<type>} feeData the fee data
   * @param  {array}  explorers the explorers
   * @param  {<type>} txWebUrl the transmit web url
   */
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    /**
     * DOGE network
     * @type {
     *   net: {
     *     messagePrefix: string,
     *     bip32: {
     *       public: number,
     *       private: number,
     *     },
     *     pubKeyHash: number,
     *     scriptHash: number,
     *     wif: number,
     *   },
     * }
     */
    const networks = {
      livenet: {
        messagePrefix: '',
        bip32: {
          public: 0x02facafd,
          private: 0x02fac398,
        },
        pubKeyHash: 0x1e,
        scriptHash: 0x16,
        wif: 0x9e,
      },
      testnet: {
        messagePrefix: '',
        bip32: {
          public: 0x043587cf,
          private: 0x04358394,
        },
        pubKeyHash: 0x71,
        scriptHash: 0xc4,
        wif: 0xf1,
      },
    };

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
        [BITCOINJS]: new LazyLoadedLib(() => import('bitcoinjs-lib')),
      },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.setFeeData(feeData);

    this.network = networks.livenet;
  }

  setFeeData(feeData = {}) {
    super.setFeeData(feeData);
    this.feePerByte = String(feeData.feePerByte);
  }

  async getFee(args) {
    let fee = await super.getFee(args);
    const hardDustLimit = new this.BN(100000);
    const softDustLimit = new this.BN(1000000);

    // according to https://github.com/dogecoin/dogecoin/blob/master/doc/fee-recommendation.md
    if (fee.lt(hardDustLimit)) {
      fee = hardDustLimit;
    }

    if (fee.lt(softDustLimit)) {
      fee = fee.add(softDustLimit);
    }

    return fee;
  }

  /**
   * Update dynamic data set
   *
   * @param {Object} data The data
   */
  updateCoinParamsFromServer(data) {
    super.updateCoinParamsFromServer(data);

    const mainExplorerData = data.explorers.find(
      ({ className }) =>
        this.explorer.constructor.name.indexOf(className) !== -1,
    );

    if (
      mainExplorerData &&
      this.explorer.baseUrl !== mainExplorerData.baseUrl
    ) {
      this.explorer.baseUrl = mainExplorerData.baseUrl;
    }
  }
}

export default DOGECoin;
