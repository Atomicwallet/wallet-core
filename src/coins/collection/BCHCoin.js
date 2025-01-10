import { Coin } from '../../abstract';
import BlockbookV2Explorer from '../../explorers/collection/BlockbookV2Explorer';
import { LazyLoadedLib } from '../../utils';
import { LIB_NAME_INDEX } from '../../utils/const';
import { BitcoinLikeFeeMixin, BitcoreBitcoinCashMixin, BitcoreMixin, HasProviders } from '../mixins';

const { BITCORE } = LIB_NAME_INDEX;
const NAME = 'Bitcoin Cash';
const TICKER = 'BCH';
const DERIVATION = "m/44'/145'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * Class
 *
 * @class BCHCoin
 */
class BCHCoin extends HasProviders(BitcoreMixin(BitcoreBitcoinCashMixin(BitcoinLikeFeeMixin(Coin)))) {
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
      socket,
      dependencies: {
        [BITCORE]: new LazyLoadedLib(() => import('bitcore-lib-cash')),
      },
      explorers,
      txWebUrl,
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([BlockbookV2Explorer]);

    this.loadExplorers(config);

    this.feePerByte = feeData.feePerByte;
    this.coefficient = feeData.coefficient;
  }
}

export default BCHCoin;
