import BN from 'bn.js';
import { Token } from '../abstract/index.js';
export default class THETAToken extends Token {
    #parent;
    constructor(config, db, configManageer) {
        super(config);
        this.id = this.ticker;
        this.#parent = config.parent;
    }
    get feeTicker() {
        return this.ticker;
    }
    get feeWallet() {
        return this;
    }
    /* @TODO DEPRECATED
     * should be used `createTransaction method from Token.js
     * which calls parent coin's `createTransaction
     *
     *
     * @param {object} txData transaction data
     * @return {Promise<object>} Raw transaction
     */
    async createTransaction({ address, amount, userFee }) {
        return {
            address,
            amount,
            contract: this.contract,
            ticker: this.ticker,
            userFee: userFee || (await this.getFee()),
        };
    }
    async sendTransaction(args) {
        const rawTx = await this.#parent.createTransaction(args);
        return this.#parent.sendTransaction(rawTx);
    }
    /**
     * Returns available balance for send
     *
     * @return {Promise<string>} In currency units
     */
    async availableBalance(fee) {
        return this.#parent.getAvailableBalanceForWallet(this, fee);
    }
    /**
     * Determines if the amount with fee is available for send
     *
     * @param {string} amount - The amount in currency unit
     * @param {string} fee - The fee in currency unit
     * @return {Promise<boolean>} True if available for send, False otherwise.
     */
    async isAvailableForSend(amount, fee) {
        const availableBalance = await this.availableBalance(this.toMinimalUnit(fee));
        return new BN(this.toMinimalUnit(amount)).lte(new BN(this.toMinimalUnit(availableBalance)));
    }
    /**
     * Does fee wallet has enough balance to send transactions.
     *
     * @param {BN} [userFee]
     * @returns {Promise<boolean>}
     */
    async isAvailableForFee(userFee) {
        return this.#parent.hasEnoughFeeBalance(userFee);
    }
}
//# sourceMappingURL=THETAToken.js.map