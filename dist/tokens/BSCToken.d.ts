export default BSCToken;
declare class BSCToken extends Token {
    constructor(...args: any[]);
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
