import { Coin } from '../../abstract';
import VergeInsightExplorer from '../../explorers/collection//VergeInsightExplorer';
import { LazyLoadedLib } from '../../utils';
import { BitcoinLikeFeeMixin, BitcoreMixin, HasProviders } from '../mixins';

const NAME = 'Verge';
const TICKER = 'XVG';
const DERIVATION = "m/44'/77'/0'/0/0";
const DECIMAL = 6;
const UNSPENDABLE_BALANCE = '0';

/**
 * Verge coin
 */
class XVGCoin extends HasProviders(BitcoreMixin(BitcoinLikeFeeMixin(Coin))) {
  /**
   * Constructs the object.
   *
   * @param {String} alias the alias
   * @param {String} fee the fee data
   * @param {String} perByte
   * @param {Number} coefficient
   * @param {Explorer[]}  explorers the explorers
   * @param {String} txWebUrl the transmit web url
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
        bitcore: new LazyLoadedLib(() => import('bitcore-lib-xvg')),
      },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([VergeInsightExplorer]);

    this.loadExplorers(config);

    this.fee = feeData.fee;
    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;

    this.transactions = [];
    this.networkName = 'mainnet';
  }

  async getBalance() {
    const { balance } = await this.getProvider('balance').getInfo(this.address);

    return balance;
  }

  /**
   * @return {Promise<BN>}
   */
  async getFee() {
    return new this.BN(this.fee);
  }
}

export default XVGCoin;
