import { Token } from '../abstract/index.js';
class EVMToken extends Token {
    constructor(config, db, configManager) {
        super(config, db, configManager);
        this.gasLimit = '150000';
        this.coefficient = 1;
    }
    /* @TODO DEPRECATED
     * should be used `createTransaction method from Token.js
     * wich proxied to parent `createTransaction
     * */
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
export default EVMToken;
//# sourceMappingURL=EVMToken.js.map