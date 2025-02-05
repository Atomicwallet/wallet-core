import BigNumber from 'bignumber.js'; // BN.js does not support floating points operations
import BN from 'bn.js';
import { toCurrency } from '../utils/convert.js';
const min = new BigNumber('0.01');
const dust = new BigNumber('0.000001');
export default class Amount {
    /**
     *
     * @param {string} initialAmount minimal units
     * @param {string} id coin/token id
     * @param {string} ticker
     * @param {number} decimal
     */
    constructor(initialAmount, { id, ticker, decimal, confirmed = true }) {
        if (!initialAmount || !ticker || !decimal || !id) {
            throw new Error('Initial values should be defined: `amount`, `id`, `ticker`, `decimal`');
        }
        if (initialAmount.toString().includes('.')) {
            throw new TypeError('Amount should be passed in minimal units');
        }
        if (!Number.isInteger(decimal)) {
            throw new TypeError('Decimal should be integer');
        }
        this.amount = new BN(initialAmount);
        this.ticker = ticker;
        this.id = id;
        this.decimal = decimal;
        this.confirmed = confirmed;
    }
    toCurrency(ticker = false) {
        const currency = toCurrency(this.amount, this.decimal);
        return ticker ? `${currency} ${this.ticker}` : currency;
    }
    toMinimal(ticker = false) {
        const minimal = this.amount.toString();
        return ticker ? `${minimal} ${this.ticker}` : minimal;
    }
    toBN() {
        return this.amount;
    }
    /**
     * JSON representative
     * for correct `JSON.stringify(<Amount>)` results
     */
    toJSON() {
        return this.toMinimal();
    }
    /* @TODO
         Defined math methods like add, mul, div, eq, gt, lt and others
    *    which should mutate inner `this.amount` state
    *  */
    #formatFiat(amountString) {
        const bn = new BigNumber(amountString);
        if (bn.gte(dust) && bn.lt(min)) {
            return bn.toFormat(6);
        }
        return bn.toFormat(2);
    }
}
//# sourceMappingURL=amount.js.map