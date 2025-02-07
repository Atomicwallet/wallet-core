import { Token } from '../abstract/index.js';
class OPToken extends Token {
    constructor(config, db, configManager) {
        super(config, db, configManager);
        this.gasLimit = '150000';
        this.coefficient = 1;
    }
    async getInfo() {
        return {
            balance: String(this.balance),
            transactions: this.transactions,
        };
    }
    async createTransaction({ address, amount, custom, userGasPrice, gasLimit = this.gasLimit, multiplier = this.multiplier, nonce, }) {
        return {
            address,
            amount,
            custom,
            userGasPrice,
            gasLimit,
            contract: this.contract,
            multiplier,
            nonce,
        };
    }
}
export default OPToken;
//# sourceMappingURL=OPToken.js.map