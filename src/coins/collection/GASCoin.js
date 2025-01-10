import { Coin } from 'src/abstract';
import NeoscanExplorer from 'src/explorers/collection/NeoscanExplorer';
import { LazyLoadedLib } from 'src/utils';

import { HasProviders, NeoMixin } from '../mixins';
import DisabledMixin from '../mixins/DisabledMixin';

const NAME = 'GAS-2 Old';
const TICKER = 'GAS';
const DERIVATION = "m/44'/888'/0'/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';

/**
 * class for GAS coin
 *
 * @class GASCoin
 */
class GASCoin extends DisabledMixin(NeoMixin(HasProviders(Coin))) {
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
      dependencies: { coreLib: new LazyLoadedLib(() => import('neo2')) },
    };

    super(config);

    this.derivation = DERIVATION;

    this.setExplorersModules([NeoscanExplorer]);

    this.loadExplorers(config);
  }
}

export default GASCoin;
