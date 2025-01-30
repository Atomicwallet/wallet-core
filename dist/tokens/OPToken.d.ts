export default OPToken;
declare class OPToken extends Token {
    constructor(...args: any[]);
    gasLimit: string;
    coefficient: number;
    getInfo(): Promise<{
        balance: string;
        transactions: import("../explorers/Transaction.js").default[];
    }>;
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
