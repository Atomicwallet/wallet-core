import { Coin } from '../../abstract/index.js';
import NeoscanExplorer from '../../explorers/collection/NeoscanExplorer.js';
import { LazyLoadedLib } from '../../utils/index.js';
import { HasProviders, NeoMixin } from '../mixins/index.js';
import DisabledMixin from '../mixins/DisabledMixin.js';
const NAME = 'NEO-2 Old';
const TICKER = 'NEO';
const DERIVATION = "m/44'/888'/0'/0";
const DECIMAL = 0;
const UNSPENDABLE_BALANCE = '0';
/**
 * class for NEO coin
 *
 * @class NEOCoin
 */
class NEOCoin extends DisabledMixin(NeoMixin(HasProviders(Coin))) {
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
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
        super(config, db, configManager);
        this.setExplorersModules([NeoscanExplorer]);
        this.loadExplorers(config);
        this.derivation = DERIVATION;
        this.balances = null;
    }
    get feeTicker() {
        return 'GAS';
    }
}
export default NEOCoin;
//# sourceMappingURL=NEOCoin.js.map