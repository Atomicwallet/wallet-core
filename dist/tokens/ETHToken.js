import Token from '../abstract/token.js';
import { ConfigKey } from '../utils/configManager/index.js';
class ETHToken extends Token {
    constructor(...args) {
        super(...args);
        this.gasLimit = '150000';
        this.coefficient = 1;
    }
    async getTransactions() {
        return this.getTokenTransactions();
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
    /**
     * Get ERC20 fee settings
     * @return {Promise<Object>} The ERC20 fee settings
     */
    getFeeSettings() {
        return this.configManager?.get(ConfigKey.EthereumGasPrice);
    }
}
export default ETHToken;
//# sourceMappingURL=ETHToken.js.map