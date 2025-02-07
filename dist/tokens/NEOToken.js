import { Token } from '../abstract/index.js';
export default class NEOToken extends Token {
    #parent;
    constructor(config, db, configManager) {
        super(config, db, configManager);
        this.id = 'GAS3';
        this.#parent = config.parent;
    }
    async createTransaction({ address, amount }) {
        return {
            address,
            amount: this.toCurrencyUnit(amount),
            asset: this.ticker,
        };
    }
    sendRawTransaction(args) {
        return this.#parent.sendTransaction(args);
    }
    getFee() {
        return this.#parent.getFee();
    }
    get feeTicker() {
        return this.ticker;
    }
    get feeWallet() {
        return this;
    }
    isAvailableForFee(userFee) {
        return this.#parent.isAvailableForFee(userFee);
    }
}
//# sourceMappingURL=NEOToken.js.map