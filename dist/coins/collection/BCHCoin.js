import { Coin } from '../../abstract/index.js';
import BlockbookV2Explorer from '../../explorers/collection/BlockbookV2Explorer.js';
import { LazyLoadedLib } from '../../utils/index.js';
import { LIB_NAME_INDEX } from '../../utils/const/index.js';
import { BitcoinLikeFeeMixin, BitcoreBitcoinCashMixin, BitcoreMixin, HasProviders } from '../mixins/index.js';
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
    constructor({ alias, notify, feeData, explorers, txWebUrl, socket, id }, db, configManager) {
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
        super(config, db, configManager);
        this.derivation = DERIVATION;
        this.setExplorersModules([BlockbookV2Explorer]);
        this.loadExplorers(config);
        this.feePerByte = feeData.feePerByte;
        this.coefficient = feeData.coefficient;
    }
}
export default BCHCoin;
//# sourceMappingURL=BCHCoin.js.map