import { Coin } from '../../abstract/index.js';
import BlockbookV2Explorer from '../../explorers/collection/BlockbookV2Explorer.js';
import { LazyLoadedLib } from '../../utils/index.js';
import { BitcoinLikeFeeMixin, BitcoreBitcoinCashMixin, BitcoreMixin, HasProviders } from '../mixins/index.js';
const NAME = 'Bitcoin SV';
const TICKER = 'BSV';
const DERIVATION = "m/44'/145'/0'/0/0";
const DECIMAL = 8;
const UNSPENDABLE_BALANCE = '0';
/**
 * Class
 *
 * @class BSVCoin
 */
class BSVCoin extends BitcoreBitcoinCashMixin(BitcoreMixin(BitcoinLikeFeeMixin(HasProviders(Coin)))) {
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
                bitcore: new LazyLoadedLib(() => import('bitcore-lib-cash')),
            },
        };
        super(config);
        this.derivation = DERIVATION;
        this.setExplorersModules([BlockbookV2Explorer]);
        this.loadExplorers(config);
        this.feePerByte = feeData.feePerByte;
        this.coefficient = feeData.coefficient;
    }
}
export default BSVCoin;
//# sourceMappingURL=BSVCoin.js.map