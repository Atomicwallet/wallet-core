import { Coin } from '../../abstract/index.js';
import OntExplorer from '../../explorers/collection/OntExplorer.js';
import { ONTToken } from '../../tokens/index.js';
import { HasTokensMixin, OntMixin } from '../mixins/index.js';
const NAME = 'Ontology';
const TICKER = 'ONT';
const DERIVATION = "m/44'/1024'/0'/0/0";
const DECIMAL = 0;
const UNSPENDABLE_BALANCE = '0';
const ONG_NAME = 'Ontology Gas';
const ONG_TICKER = 'ONG';
const ONG_DECIMAL = 9;
/**
 * class for Ont coin
 *
 * @class ONTCoin
 */
class ONTCoin extends OntMixin(HasTokensMixin(Coin)) {
    #feeTokenWallet;
    /**
     * Constructs the object.
     *
     * @param {String} alias the alias
     * @param {Object} feeData fee settings
     * @param {Explorer[]}  explorers list
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
            feeData,
            socket,
        };
        super(config);
        this.derivation = DERIVATION;
        this.setExplorersModules([OntExplorer]);
        this.loadExplorers(config);
        this.#initFeeTokenWallet();
        this.balances = null; // {?{ unbonding: string, rewards: string }}
    }
    get feeWallet() {
        return this.#feeTokenWallet;
    }
    get feeTicker() {
        return 'ONG';
    }
    /**
     * Return available balance for send
     *
     * @return {Promise<string>}
     */
    async availableBalance() {
        const availableBalance = new this.BN(this.balance);
        return availableBalance.lt(new this.BN(0)) ? '0' : this.toCurrencyUnit(availableBalance);
    }
    async isAvailableForFee(userFee) {
        const fee = !userFee || userFee.isZero() ? await this.getFee() : userFee;
        return new this.BN(this.#feeTokenWallet.balance).gte(fee);
    }
    #initFeeTokenWallet() {
        this.#feeTokenWallet = this.createToken({
            name: ONG_NAME,
            ticker: ONG_TICKER,
            decimal: ONG_DECIMAL,
            visibility: true,
            confirmed: true,
            source: 'list',
            parent: this,
        });
        this.tokens[this.#feeTokenWallet.id] = this.#feeTokenWallet;
    }
    async loadTokensList(wallets) {
        wallets.addWallet(this.#feeTokenWallet);
        this.bus?.$emit('update::coin-list');
    }
    createToken(args) {
        return new ONTToken({
            parent: this,
            ...args,
        });
    }
    getTokenList() {
        return [
            {
                id: this.#feeTokenWallet.id,
                name: this.#feeTokenWallet.name,
                ticker: this.#feeTokenWallet.ticker,
                decimal: this.#feeTokenWallet.decimal,
                visibility: this.#feeTokenWallet.visibility,
            },
        ];
    }
    getFeeTicker() {
        return this.#feeTokenWallet.ticker;
    }
    getTokenTransactions() {
        return this.explorer.getTokenTransactions({ address: this.address });
    }
}
export default ONTCoin;
//# sourceMappingURL=ONTCoin.js.map