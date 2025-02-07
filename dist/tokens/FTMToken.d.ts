export default FTMToken;
declare class FTMToken extends Token {
    constructor(config: any, db: any, configManager: any);
    gasLimit: string;
    coefficient: number;
    getInfo(): Promise<{
        balance: string;
        transactions: import("../explorers/Transaction.js").default[];
    }>;
    getFee({ amount, isSendAll, gasPrice, gasLimit }: {
        amount?: number | undefined;
        isSendAll: any;
        gasPrice: any;
        gasLimit: any;
    }): Promise<import("bn.js")>;
    /**
     * Get ERC20 fee settings
     * @return {Promise<Object>} The ERC20 fee settings
     */
    getFeeSettings(): Promise<Object>;
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
}
import { Token } from '../abstract/index.js';
