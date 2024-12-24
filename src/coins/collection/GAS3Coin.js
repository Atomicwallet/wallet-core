import { Coin } from '../../abstract';
import DoraExplorer from '../../explorers/collection/DoraExplorer';
import NeoNodeExplorer from '../../explorers/collection/NeoNodeExplorer';
import { LazyLoadedLib } from '../../utils';
import { HasProviders, Neo3Mixin, NeoMixin } from '../mixins';

const NAME = 'GAS';
const TICKER = 'GAS';
const DERIVATION = "m/44'/888'/0'/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * class for GAS coin
 *
 * @class GASCoin
 */
class GAS3Coin extends Neo3Mixin(NeoMixin(HasProviders(Coin))) {
  constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }) {
    const config = {
      id,
      alias,
      notify,
      name: NAME,
      ticker: TICKER,
      decimal: DECIMAL,
      unspendableBalance: UNSPENDABLE_BALANCE,
      txWebUrl,
      explorers,
      socket,
      dependencies: { coreLib: new LazyLoadedLib(() => import('neo3')) },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([DoraExplorer, NeoNodeExplorer]);

    this.loadExplorers(config);
  }
}

export default GAS3Coin;
