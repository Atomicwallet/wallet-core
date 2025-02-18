import { Token } from '../abstract/index.js';
const TRANSFER_METHOD_SIGNATURE = 'a9059cbb';
const ARGUMENT_SIZE = 64;
const FEE = '60';
const TWO = 2;
class VETToken extends Token {
    #parent;
    constructor(config, db, configManager) {
        super(config, db, configManager);
        this.id = this.ticker;
        this.fee = FEE;
        this.#parent = config.parent;
    }
    get feeTicker() {
        return this.ticker;
    }
    get feeWallet() {
        return this;
    }
    async getInfo() {
        return {
            balance: String(this.balance),
            transactions: this.transactions,
        };
    }
    async getFee() {
        return new this.BN(this.toMinimalUnit(this.fee));
    }
    /* @TODO DEPRECATED
     * should be used `createTransaction method from Token.js
     * wich proxied to parent `createTransaction
     * */
    async createTransaction({ address, amount }) {
        const hexBase = 16;
        const fee = Number(this.toCurrencyUnit(await this.getFee()));
        const dataToSend = `0x${TRANSFER_METHOD_SIGNATURE}${this.addLeadingZero(address.substring(TWO), ARGUMENT_SIZE)}${this.addLeadingZero(new this.BN(amount).toString(hexBase), ARGUMENT_SIZE)}`;
        return { contract: this.contract, amount: '0', dataToSend, fee };
    }
    async sendTransaction(args) {
        const rawTx = await this.#parent.createTokenTransaction(args);
        return this.#parent.sendTransaction(rawTx);
    }
    async isAvailableForFee() {
        const fee = await this.getFee();
        return this.indivisibleBalance.gte(fee);
    }
    /**
     * Gets the available balance.
     *
     * @return {Promise<String>} The balance.
     */
    async availableBalance() {
        const fee = await this.getFee();
        const available = new this.BN(this.balance).sub(fee);
        return available.lt(new this.BN(0)) ? '0' : this.toCurrencyUnit(available);
    }
    addLeadingZero(value, totalStringLength) {
        return String(value).padStart(totalStringLength, '0');
    }
}
export default VETToken;
//# sourceMappingURL=VETToken.js.map