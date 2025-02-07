export default ETHToken;
declare class ETHToken extends Token {
    constructor(config: any, db: any, configManager: any);
    gasLimit: string;
    coefficient: number;
    getTransactions(): Promise<import("../explorers/Transaction.js").default[]>;
    createTransaction({ address, amount, custom, userGasPrice, gasLimit, multiplier, nonce, }: {
        address: any;
        amount: any;
        custom: any;
        userGasPrice: any;
        gasLimit?: string | undefined;
        multiplier?: any;
        nonce: any;
    }): Promise<{
        address: any;
        amount: any;
        custom: any;
        userGasPrice: any;
        gasLimit: string;
        contract: string;
        multiplier: any;
        nonce: any;
    }>;
    /**
     * Get ERC20 fee settings
     * @return {Promise<Object>} The ERC20 fee settings
     */
    getFeeSettings(): Promise<Object>;
}
import Token from '../abstract/token.js';
