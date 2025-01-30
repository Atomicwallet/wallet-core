import { Token } from '../abstract/index.js';
const DECIMAL = 6;
const MINIMAL_UNIT = 10 ** DECIMAL;
const FEE_LIMIT = 10 * MINIMAL_UNIT;
const DEFAULT_USTC_STABILITY_FEE = 0.012;
class LUNCToken extends Token {
    constructor(args) {
        super(args);
        this.denom = args.denom;
        this.fields.paymentId = true;
        this.stabilityFee = this.config?.stabilityFee || DEFAULT_USTC_STABILITY_FEE;
    }
    /* @TODO DEPRECATED
     * should be used `createTransaction method from Token.js
     * wich proxied to parent `createTransaction
     *
     * @param {Object} txData transaction data
     * @return {Promise<Object>} Raw transaction
     */
    async createTransaction({ address, amount, userGasPrice, gasLimit, multiplier, feeLimit = FEE_LIMIT, memo }) {
        return {
            address,
            amount,
            contract: this.contract,
            transfer: true,
            ticker: this.ticker,
            userGasPrice,
            gasLimit,
            multiplier,
            feeLimit,
            denom: this.denom,
            memo,
        };
    }
    /**
     * availableBalance for USTC, substracts maximux stabilityFee possible
     *
     * @return {Promise<String>} Available balance for send
     */
    async availableBalance() {
        if (this.divisibleBalance) {
            const maxStabilityFee = await this.getStabilityFee(this.indivisibleBalance);
            const amount = this.indivisibleBalance.sub(new this.BN(maxStabilityFee));
            return amount.gt(0) ? this.toCurrencyUnit(amount.toString()) : '0';
        }
        return '0';
    }
    /**
     * @param {BN} amount Amount to send in minimal units
     * @return {String} Stability fee for a given ustc amount in minimal units
     */
    getStabilityFee(amount) {
        return (Number(amount) * this.stabilityFee + 1).toFixed(0);
    }
}
export default LUNCToken;
//# sourceMappingURL=LUNCToken.js.map